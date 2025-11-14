import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { createCustomerPortalSession } from '@/lib/stripe';

// Prevent Next.js from trying to collect page data
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Lazy load Prisma to avoid build-time issues
  const getPrisma = (await import('@/lib/prisma')).default;
  const prisma = getPrisma();
  
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's subscription information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        subscriptions: {
          where: {
            status: {
              in: ['active', 'canceled', 'past_due', 'trialing'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const activeSubscription = user.subscriptions[0];

    if (!activeSubscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscriptionTier: user.subscriptionTier,
        canManage: false,
      });
    }

    // If user has a Stripe customer ID, they can manage their subscription
    const canManage = !!activeSubscription.stripeCustomerId;

    let portalUrl: string | null = null;

    if (canManage && activeSubscription.stripeCustomerId) {
      try {
        const portalSession = await createCustomerPortalSession(
          activeSubscription.stripeCustomerId
        );
        portalUrl = portalSession.url;
      } catch (error) {
        console.error('Failed to create portal session:', error);
        // Return subscription info even if portal creation fails
      }
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: activeSubscription.id,
        tier: activeSubscription.tier,
        status: activeSubscription.status,
        interval: activeSubscription.interval,
        price: activeSubscription.price,
        currency: activeSubscription.currency,
        currentPeriodStart: activeSubscription.currentPeriodStart,
        currentPeriodEnd: activeSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: activeSubscription.cancelAtPeriodEnd,
        canceledAt: activeSubscription.canceledAt,
        stripeSubscriptionId: activeSubscription.stripeSubscriptionId,
      },
      canManage,
      portalUrl,
    });

  } catch (error) {
    console.error('Subscription management error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: {
          in: ['active', 'canceled', 'past_due', 'trialing'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Create customer portal session
    const portalSession = await createCustomerPortalSession(
      subscription.stripeCustomerId
    );

    // Log subscription management action
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'subscription_downgraded', // Reusing existing action type
        metadata: {
          action: 'portal_access',
          subscriptionId: subscription.stripeSubscriptionId,
        },
      },
    });

    return NextResponse.json({
      url: portalSession.url,
    });

  } catch (error) {
    console.error('Portal creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create management portal' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { immediate = false } = await request.json();

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: 'active',
      },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Import here to avoid circular dependencies
    const { cancelStripeSubscription } = await import('@/lib/stripe');

    // Cancel subscription in Stripe
    await cancelStripeSubscription(
      subscription.stripeSubscriptionId,
      immediate
    );

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: !immediate,
        status: immediate ? 'canceled' : 'active',
      },
    });

    // If immediate cancellation, downgrade user to free
    if (immediate) {
      await prisma.user.update({
        where: { id: payload.userId },
        data: {
          subscriptionTier: 'free',
        },
      });
    }

    // Log cancellation
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'subscription_downgraded',
        metadata: {
          action: immediate ? 'immediate_cancellation' : 'end_of_period_cancellation',
          subscriptionId: subscription.stripeSubscriptionId,
        },
      },
    });

    return NextResponse.json({
      message: immediate
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of the billing period',
      effective: immediate ? 'immediate' : 'end_of_period',
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { createStripeCheckoutSession } from '@/lib/stripe';
import prisma from '@/lib/prisma';

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

    // Get user information
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { tier, billingCycle } = body;

    // Validate tier and billing cycle
    if (!tier || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: tier, billingCycle' },
        { status: 400 }
      );
    }

    if (!['professional', 'team'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Supported tiers: professional, team' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle. Supported cycles: monthly, yearly' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: payload.userId,
        status: 'active',
      },
    });

    if (activeSubscription) {
      // If user has the same plan and wants to change billing cycle, handle upgrade
      if (activeSubscription.tier === tier && activeSubscription.interval !== billingCycle) {
        // Create Stripe session for billing cycle change
        const session = await createStripeCheckoutSession(
          payload.userId,
          user.email,
          tier,
          billingCycle
        );

        return NextResponse.json({
          sessionId: session.id,
          url: session.url,
          action: 'update',
        });
      }

      return NextResponse.json(
        { error: 'You already have an active subscription. Please manage your existing subscription from the dashboard.' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await createStripeCheckoutSession(
      payload.userId,
      user.email,
      tier as 'professional' | 'team',
      billingCycle as 'monthly' | 'yearly'
    );

    // Record subscription intent in database
    await prisma.subscription.create({
      data: {
        userId: payload.userId,
        tier: tier as 'professional' | 'team',
        status: 'incomplete',
        interval: (billingCycle === 'monthly' ? 'month' : 'year') as 'month' | 'year',
        price: tier === 'professional'
          ? (billingCycle === 'monthly' ? 29 : 240)
          : (billingCycle === 'monthly' ? 99 : 792),
        currency: 'usd',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: '', // Will be populated by webhook
        stripeCustomerId: '', // Will be populated by webhook
        stripePriceId: '', // Will be populated by webhook
      },
    });

    // Log usage
    await prisma.usageLog.create({
      data: {
        userId: payload.userId,
        actionType: 'subscription_upgraded',
        metadata: {
          tier,
          billingCycle,
          sessionId: session.id,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      action: 'create',
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
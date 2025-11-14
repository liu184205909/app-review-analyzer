import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type { PrismaClient } from '@prisma/client';

// Prevent Next.js from trying to collect page data
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Check if subscriptions are enabled (safe access with default)
const SUBSCRIPTIONS_ENABLED = process.env.ENABLE_SUBSCRIPTIONS === 'true';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Check if subscription feature is enabled
    if (!SUBSCRIPTIONS_ENABLED) {
      return NextResponse.json(
        { error: 'Subscription feature is currently disabled' },
        { status: 503 }
      );
    }

    // Lazy load dependencies to avoid build-time errors
    const getStripe = (await import('@/lib/stripe')).default;
    const { STRIPE_PRICES } = await import('@/lib/stripe');
    const getPrisma = (await import('@/lib/prisma')).default;
    const prisma = getPrisma();

    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: any;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing Stripe webhook: ${event.type}`);

    // Helper functions with access to prisma and getStripe
    const handleCheckoutSessionCompleted = async (session: any) => {
      const { userId, tier, billingCycle } = session.metadata || {};

      if (!userId || !tier || !billingCycle) {
        console.error('Missing metadata in checkout session:', session.id);
        return;
      }

      console.log(`Checkout completed for user ${userId}, tier ${tier}, cycle ${billingCycle}`);

      await prisma.subscription.updateMany({
        where: { userId, status: 'incomplete' },
        data: {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          stripePriceId: session.display_items?.[0]?.price?.id || '',
          status: 'active',
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: tier as any,
          subscriptionEnds: null,
        },
      });

      await prisma.usageLog.create({
        data: {
          userId,
          actionType: 'subscription_upgraded',
          metadata: {
            tier,
            billingCycle,
            sessionId: session.id,
            customerId: session.customer,
            subscriptionId: session.subscription,
          },
        },
      });
    };

    const handleInvoicePaymentSucceeded = async (invoice: any) => {
      const subscriptionId = invoice.subscription;
      console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);

      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { user: true },
      });

      if (!subscription) {
        console.error(`Subscription not found in database: ${subscriptionId}`);
        return;
      }

      const stripe = getStripe();
      const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          cancelAtPeriodEnd: (stripeSubscription as any).cancel_at_period_end,
        },
      });

      await prisma.usageLog.create({
        data: {
          userId: subscription.userId,
          actionType: 'subscription_upgraded',
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount_paid,
            subscriptionId,
          },
        },
      });
    };

    const handleInvoicePaymentFailed = async (invoice: any) => {
      const subscriptionId = invoice.subscription;
      console.log(`Invoice payment failed for subscription ${subscriptionId}`);

      const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
      });

      if (!subscription) {
        console.error(`Subscription not found in database: ${subscriptionId}`);
        return;
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' },
      });

      await prisma.usageLog.create({
        data: {
          userId: subscription.userId,
          actionType: 'analysis_failed',
          metadata: {
            invoiceId: invoice.id,
            amount: invoice.amount_due,
            subscriptionId,
            reason: 'payment_failed',
          },
        },
      });
    };

    const handleSubscriptionUpdated = async (subscription: any) => {
      console.log(`Subscription updated: ${subscription.id}`);

      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!dbSubscription) {
        console.error(`Subscription not found in database: ${subscription.id}`);
        return;
      }

      let tier = 'free';
      if (subscription.items?.data?.[0]?.price?.id) {
        const priceId = subscription.items.data[0].price.id;
        if (priceId === STRIPE_PRICES.professional.monthly || priceId === STRIPE_PRICES.professional.yearly) {
          tier = 'professional';
        } else if (priceId === STRIPE_PRICES.team.monthly || priceId === STRIPE_PRICES.team.yearly) {
          tier = 'team';
        }
      }

      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        },
      });

      if (tier !== dbSubscription.tier) {
        await prisma.user.update({
          where: { id: dbSubscription.userId },
          data: { subscriptionTier: tier as any },
        });
      }

      await prisma.usageLog.create({
        data: {
          userId: dbSubscription.userId,
          actionType: 'subscription_upgraded',
          metadata: {
            subscriptionId: subscription.id,
            newStatus: subscription.status,
            newTier: tier,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        },
      });
    };

    const handleSubscriptionDeleted = async (subscription: any) => {
      console.log(`Subscription deleted: ${subscription.id}`);

      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (!dbSubscription) {
        console.error(`Subscription not found in database: ${subscription.id}`);
        return;
      }

      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: { status: 'canceled' },
      });

      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: {
          subscriptionTier: 'free',
          subscriptionEnds: new Date(subscription.current_period_end * 1000),
        },
      });

      await prisma.usageLog.create({
        data: {
          userId: dbSubscription.userId,
          actionType: 'subscription_downgraded',
          metadata: {
            subscriptionId: subscription.id,
            reason: 'subscription_deleted',
            periodEnd: subscription.current_period_end,
          },
        },
      });
    };

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

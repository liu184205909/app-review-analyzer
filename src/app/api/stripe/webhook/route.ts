import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe, { STRIPE_PRICES } from '@/lib/stripe';
import prisma from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
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
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

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

async function handleCheckoutSessionCompleted(session: any) {
  const { userId, tier, billingCycle } = session.metadata || {};

  if (!userId || !tier || !billingCycle) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  console.log(`Checkout completed for user ${userId}, tier ${tier}, cycle ${billingCycle}`);

  // Update the incomplete subscription record
  await prisma.subscription.updateMany({
    where: {
      userId,
      status: 'incomplete',
    },
    data: {
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      stripePriceId: session.display_items?.[0]?.price?.id || '',
      status: 'active',
    },
  });

  // Update user's subscription tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier as any,
      subscriptionEnds: null, // Active subscription
    },
  });

  // Log successful subscription
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
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;

  console.log(`Invoice payment succeeded for subscription ${subscriptionId}`);

  // Find the subscription in our database
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    include: {
      user: true,
    },
  });

  if (!subscription) {
    console.error(`Subscription not found in database: ${subscriptionId}`);
    return;
  }

  // Update subscription period
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active',
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
  });

  // Log successful payment
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
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;

  console.log(`Invoice payment failed for subscription ${subscriptionId}`);

  // Find the subscription in our database
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  if (!subscription) {
    console.error(`Subscription not found in database: ${subscriptionId}`);
    return;
  }

  // Update subscription status to past_due
  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'past_due',
    },
  });

  // Log failed payment
  await prisma.usageLog.create({
    data: {
      userId: subscription.userId,
      actionType: 'analysis_failed', // Reusing existing action type
      metadata: {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        subscriptionId,
        reason: 'payment_failed',
      },
    },
  });
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log(`Subscription updated: ${subscription.id}`);

  // Find the subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!dbSubscription) {
    console.error(`Subscription not found in database: ${subscription.id}`);
    return;
  }

  // Determine tier based on price ID
  let tier = 'free';
  if (subscription.items?.data?.[0]?.price?.id) {
    const priceId = subscription.items.data[0].price.id;
    if (priceId === STRIPE_PRICES.professional.monthly || priceId === STRIPE_PRICES.professional.yearly) {
      tier = 'professional';
    } else if (priceId === STRIPE_PRICES.team.monthly || priceId === STRIPE_PRICES.team.yearly) {
      tier = 'team';
    }
  }

  // Update subscription
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

  // Update user's subscription tier if changed
  if (tier !== dbSubscription.tier) {
    await prisma.user.update({
      where: { id: dbSubscription.userId },
      data: {
        subscriptionTier: tier as any,
      },
    });
  }

  // Log subscription update
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
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log(`Subscription deleted: ${subscription.id}`);

  // Find the subscription in our database
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!dbSubscription) {
    console.error(`Subscription not found in database: ${subscription.id}`);
    return;
  }

  // Update subscription status
  await prisma.subscription.update({
    where: { id: dbSubscription.id },
    data: {
      status: 'canceled',
    },
  });

  // Downgrade user to free plan
  await prisma.user.update({
    where: { id: dbSubscription.userId },
    data: {
      subscriptionTier: 'free',
      subscriptionEnds: new Date(subscription.current_period_end * 1000),
    },
  });

  // Log subscription cancellation
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
}
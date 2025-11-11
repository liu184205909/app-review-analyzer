import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-10-28.acacia',
});

// Stripe price IDs for different plans and billing cycles
export const STRIPE_PRICES = {
  professional: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1OqVnY2eZvKYlo2C7x2x2x2x',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_1OqVnY2eZvKYlo2C7x2x2x2x',
  },
  team: {
    monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_1OqVnY2eZvKYlo2C7x2x2x2x',
    yearly: process.env.STRIPE_PRICE_TEAM_YEARLY || 'price_1OqVnY2eZvKYlo2C7x2x2x2x',
  },
} as const;

export interface StripePlanConfig {
  name: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year';
  currency: string;
}

export function getStripePrice(tier: 'professional' | 'team', billingCycle: 'monthly' | 'yearly'): StripePlanConfig {
  const priceId = STRIPE_PRICES[tier][billingCycle];
  const amount = tier === 'professional'
    ? (billingCycle === 'monthly' ? 2900 : 24000) // $29/month or $240/year
    : (billingCycle === 'monthly' ? 9900 : 79200); // $99/month or $792/year

  return {
    name: tier === 'professional' ? 'Professional' : 'Team',
    priceId,
    amount,
    interval: billingCycle,
    currency: 'usd',
  };
}

export async function createStripeCheckoutSession(
  userId: string,
  userEmail: string,
  tier: 'professional' | 'team',
  billingCycle: 'monthly' | 'yearly'
) {
  const priceConfig = getStripePrice(tier, billingCycle);

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    billing_address_collection: 'auto',
    line_items: [
      {
        price: priceConfig.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXTAUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: {
      userId,
      tier,
      billingCycle,
    },
    allow_promotion_codes: true,
    automatic_tax: {
      enabled: true,
    },
  });

  return session;
}

export async function createStripeCustomer(userEmail: string, userName?: string) {
  return await stripe.customers.create({
    email: userEmail,
    name: userName || undefined,
    metadata: {
      source: 'app_review_analyzer',
    },
  });
}

export async function retrieveStripeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelStripeSubscription(subscriptionId: string, immediate = false) {
  if (immediate) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

export async function createCustomerPortalSession(customerId: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  });
}

export default stripe;
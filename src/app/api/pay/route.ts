import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  try {
    const { amount, email, orderDetails } = await req.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      receipt_email: email,
      metadata: {
        orderDetails: typeof orderDetails === 'string' ? orderDetails : JSON.stringify(orderDetails),
      },
      payment_method_types: ['card'],
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe Payment Intent Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

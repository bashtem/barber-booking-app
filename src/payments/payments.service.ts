import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Stripe from 'stripe';
import { Payment } from './payment.entity';
import { Repository } from 'typeorm';
import { PaymentMethod, PaymentStatus } from 'src/enums/payment.enum';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
  ) {
    this.stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here',
    );
  }

  async createPaymentIntent(customerId: number, amount: number): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: { customerId: customerId.toString() },
    });

    const payment = await this.create({
      customer: { id: customerId } as any,
      amount,
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CARD,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      paymentId: payment.id,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async create(paymentData: Partial<Payment>): Promise<Payment> {
    const payment = this.paymentsRepository.create(paymentData);
    return this.paymentsRepository.save(payment);
  }

  async updateStatus(
    id: number,
    status: PaymentStatus,
  ): Promise<Payment | null> {
    await this.paymentsRepository.update(id, { status });
    return this.paymentsRepository.findOne({ where: { id } });
  }

  async findByStripePaymentIntent(
    paymentIntentId: string,
  ): Promise<Payment | null> {
    return this.paymentsRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const payment = await this.findByStripePaymentIntent(paymentIntent.id);
        if (payment) {
          await this.updateStatus(payment.id, PaymentStatus.COMPLETED);
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent;
        const failedPayment = await this.findByStripePaymentIntent(
          failedIntent.id,
        );
        if (failedPayment) {
          await this.updateStatus(failedPayment.id, PaymentStatus.FAILED);
        }
        break;
    }
  }

  async refund(paymentId: number): Promise<Payment | null> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.stripePaymentIntentId) {
      await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
      });
    }

    return this.updateStatus(paymentId, PaymentStatus.REFUNDED);
  }
}

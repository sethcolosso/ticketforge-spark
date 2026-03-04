const Refund = () => (
  <div className="py-12">
    <div className="container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-heading font-bold mb-8">Refund & Deposit Policy</h1>

      <div className="space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">1. General Refund Policy</h2>
          <p>All ticket purchases are final. Refunds are only issued if an event is cancelled by the organizer. In such cases, a full refund will be processed within 10 business days to the original payment method.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">2. Deposit Payment Terms</h2>
          <p>When a 50% deposit option is available, you pay half the ticket price upfront. The remaining 50% is due within one month after the first event concludes. You will receive automated reminders at 7 days, 3 days, and 1 day before the payment deadline.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">3. Failure to Complete Payment</h2>
          <p>If full payment is not received by the deadline, your ticket will be revoked and you will lose eligibility for any associated benefits, including lifetime ticket access. The initial deposit is non-refundable in this case.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">4. Event Postponement</h2>
          <p>If an event is rescheduled, your ticket remains valid for the new date. If you cannot attend the rescheduled date, you may request a refund within 14 days of the postponement announcement.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">5. Contact</h2>
          <p>For refund requests or deposit-related questions, email support@urbanpunk.com with your order ID and details.</p>
        </section>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">Last updated: March 2026</p>
      </div>
    </div>
  </div>
);

export default Refund;

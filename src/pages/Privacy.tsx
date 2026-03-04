const Privacy = () => (
  <div className="py-12">
    <div className="container mx-auto px-4 max-w-3xl">
      <h1 className="text-3xl font-heading font-bold mb-8">Privacy Policy</h1>

      <div className="space-y-6 text-muted-foreground text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly (name, email, phone, payment details) and automatically (device info, IP address, browsing behavior via cookies and analytics).</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <p>We use your data to process ticket purchases, manage your account, send event updates and promotional communications, improve our platform, and comply with legal obligations.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">3. Data Sharing</h2>
          <p>We may share your information with event organizers (for ticket fulfillment), payment processors (Stripe), analytics providers, and as required by law. We never sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">4. Data Security</h2>
          <p>We implement industry-standard security measures including encryption, secure payment processing (PCI DSS compliant), and regular security audits to protect your information.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. You may opt out of marketing communications at any time. Contact us at privacy@urbanpunk.com to exercise these rights.</p>
        </section>

        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-2">6. Cookies</h2>
          <p>We use essential cookies for platform functionality and optional analytics cookies to improve our service. You can manage cookie preferences in your browser settings.</p>
        </section>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">Last updated: March 2026</p>
      </div>
    </div>
  </div>
);

export default Privacy;

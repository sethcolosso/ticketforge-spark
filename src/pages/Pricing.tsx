import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for small events and getting started.",
    features: ["Up to 100 tickets per event", "Basic event page", "Email confirmations", "Standard support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "KSh 99",
    priceNote: "per ticket sold",
    description: "For growing organizers who need more power.",
    features: ["Unlimited tickets", "Custom branding", "Promo codes & discounts", "Real-time analytics", "Priority support", "Multi-event dashboard"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large-scale events and organizations.",
    features: ["Everything in Pro", "Dedicated account manager", "API access", "White-label solution", "Custom integrations", "On-site support"],
    cta: "Contact Sales",
    popular: false,
  },
];

const Pricing = () => (
  <div className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-14">
        <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
          Simple, Transparent <span className="text-primary">Pricing</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          No hidden fees. No contracts. Pay only for what you use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-6 flex flex-col ${
              plan.popular
                ? "border-primary bg-card box-glow"
                : "border-border bg-card"
            }`}
          >
            {plan.popular && (
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Most Popular</span>
            )}
            <h3 className="text-xl font-heading font-bold">{plan.name}</h3>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-heading font-bold">{plan.price}</span>
              {plan.priceNote && (
                <span className="text-sm text-muted-foreground ml-1">{plan.priceNote}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/register">
              <Button
                variant={plan.popular ? "default" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Pricing;

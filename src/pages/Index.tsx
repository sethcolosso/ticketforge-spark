import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import EventCard from "@/components/EventCard";
import { getFeaturedEvents } from "@/data/events";
import heroBg from "@/assets/hero-bg.png";

const features = [
  {
    icon: Zap,
    title: "Lightning-Fast Setup",
    description: "Create and publish your event page in minutes, not days.",
  },
  {
    icon: Shield,
    title: "Secure Checkout",
    description: "PCI-compliant payments with fraud protection built in.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track sales, attendance, and revenue as it happens.",
  },
  {
    icon: Sparkles,
    title: "Fully Customizable",
    description: "Brand your event page to match your unique identity.",
  },
];

const Index = () => {
  const featured = getFeaturedEvents();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden noise-overlay">
        <img
          src={heroBg}
          alt="Urban concert scene"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 gradient-hero opacity-80" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <p className="text-primary font-mono text-sm tracking-widest uppercase mb-4 animate-fade-in">
            The Future of Event Ticketing
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Sell Tickets.{" "}
            <span className="text-glow text-primary">Build Culture.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            URBANPUNK is the bold, modern ticketing platform for concerts, festivals, art shows, and everything in between. Easy to use. Unbelievably affordable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/register">
              <Button size="lg" className="text-base px-8 font-semibold">
                Get Started Free
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg" className="text-base px-8">
                Browse Events <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Everything You Need to{" "}
              <span className="text-primary">Sell Out</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful tools designed for event creators who refuse to settle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-lg border border-border bg-background hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-heading font-bold">Featured Events</h2>
              <p className="text-muted-foreground mt-1">Don't miss what's hot right now.</p>
            </div>
            <Link to="/events">
              <Button variant="outline" size="sm">
                View All <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to Launch Your Event?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Join thousands of organizers who trust URBANPUNK to power their events.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-base px-8 font-semibold animate-glow-pulse">
              Start Selling Tickets
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;

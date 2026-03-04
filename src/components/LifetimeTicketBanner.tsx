import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TOTAL_SLOTS = 500000;
const CLAIMED = 487342;
const remaining = TOTAL_SLOTS - CLAIMED;

const LifetimeTicketBanner = () => (
  <section className="py-16 bg-card border-y border-border relative overflow-hidden">
    <div className="absolute inset-0 gradient-punk opacity-5" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Crown className="h-3.5 w-3.5" />
          Lifetime Access
        </div>
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Join the <span className="text-primary text-glow">Main Circle</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          The first 500,000 ticket buyers for our inaugural event receive <span className="text-foreground font-medium">lifetime access</span> to all future URBANPUNK events. Forever.
        </p>

        {/* Counter */}
        <div className="flex items-center justify-center gap-8 py-4">
          <div className="text-center">
            <motion.p
              className="text-3xl md:text-4xl font-heading font-bold text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {remaining.toLocaleString()}
            </motion.p>
            <p className="text-xs text-muted-foreground mt-1">Spots Remaining</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-3xl md:text-4xl font-heading font-bold">
                {CLAIMED.toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Members Claimed</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full gradient-neon rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${(CLAIMED / TOTAL_SLOTS) * 100}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              viewport={{ once: true }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {((CLAIMED / TOTAL_SLOTS) * 100).toFixed(1)}% claimed
          </p>
        </div>

        <Link to="/events">
          <Button size="lg" className="font-semibold animate-glow-pulse">
            Claim Your Lifetime Pass
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default LifetimeTicketBanner;

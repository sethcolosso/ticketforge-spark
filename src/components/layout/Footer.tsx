import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 text-primary font-heading font-bold text-lg mb-3">
            <Ticket className="h-5 w-5" />
            URBANPUNK
          </Link>
          <p className="text-sm text-muted-foreground">
            The bold new way to discover, create, and sell tickets for unforgettable events.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Platform</h4>
          <div className="flex flex-col gap-2">
            <Link to="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse Events</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
            <Link to="/register" className="text-sm text-muted-foreground hover:text-primary transition-colors">Create Event</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">About</span>
            <span className="text-sm text-muted-foreground">Contact</span>
            <span className="text-sm text-muted-foreground">Careers</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <div className="flex flex-col gap-2">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
            <Link to="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground">&copy; 2026 URBANPUNK. All rights reserved.</p>
        <p className="text-xs text-muted-foreground">Built for the culture.</p>
      </div>
    </div>
  </footer>
);

export default Footer;

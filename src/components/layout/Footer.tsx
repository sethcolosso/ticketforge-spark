import { Link } from "react-router-dom";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import urbanpunkLogo from "@/assets/urbanpunk-logo.jpeg";

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M14 4v2.96a4.04 4.04 0 0 0 2.88 3.88c.66.19 1.38.2 2.12.03v2.94a7.02 7.02 0 0 1-5-2.08V16a5 5 0 1 1-5-5h.25v3.03A2 2 0 1 0 11 16V4h3Z"
      fill="currentColor"
    />
  </svg>
);

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg mb-3">
            <img src={urbanpunkLogo} alt="URBANPUNK" className="h-7 w-auto rounded" />
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
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
            <span className="text-sm text-muted-foreground">Cookie Policy</span>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-muted-foreground text-center md:text-left">
          &copy; 2026 URBANPUNK. All rights reserved. Designed by SethColosso and Timo.
        </p>
        <div className="flex items-center gap-3">
          <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="#" aria-label="TikTok" className="text-muted-foreground hover:text-primary transition-colors">
            <TiktokIcon className="h-4 w-4" />
          </a>
          <a href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

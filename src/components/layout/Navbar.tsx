import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Ticket, User, Store, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { isSeller, isAdmin } = useRoles();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/events", label: "Events" },
    { to: "/pricing", label: "Pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-primary font-heading font-bold text-xl">
          <Ticket className="h-6 w-6" />
          <span>URBANPUNK</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link key={link.to} to={link.to}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.to ? "text-primary" : "text-muted-foreground"
              }`}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {isSeller && (
                <Link to="/seller">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Store className="h-4 w-4" /> Seller
                  </Button>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" /> Dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground p-2" aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium py-2 transition-colors ${location.pathname === link.to ? "text-primary" : "text-muted-foreground"}`}>
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-2 border-t border-border flex-wrap">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2"><User className="h-4 w-4" /> Dashboard</Button>
                  </Link>
                  {isSeller && (
                    <Link to="/seller" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2"><Store className="h-4 w-4" /> Seller</Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2"><Shield className="h-4 w-4" /> Admin</Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

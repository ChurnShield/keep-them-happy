import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

export function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleMenu = () => setOpen(!open);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      // Check if we're on the landing page
      if (window.location.pathname === "/") {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: "smooth" });
      } else {
        // Navigate to landing page with hash
        navigate("/" + href);
      }
    } else {
      navigate(href);
    }
  };

  const handleGetStarted = () => {
    setOpen(false);
    if (user) {
      navigate("/welcome");
    } else {
      navigate("/auth", { state: { from: "/welcome" } });
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "How it Works", href: "#how-it-works" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-background/70 border-b border-border/10">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(187_85%_53%)] flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-foreground font-semibold text-lg tracking-tight">
            ChurnShield
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-muted-foreground hover:text-foreground transition text-sm font-medium"
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground transition text-sm font-medium"
              >
                Log out
              </button>
              <Button 
                onClick={() => navigate("/welcome")}
                className="bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-medium hover:opacity-90 shadow-lg shadow-primary/20"
              >
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-muted-foreground hover:text-foreground transition text-sm font-medium"
              >
                Log in
              </Link>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-medium hover:opacity-90 shadow-lg shadow-primary/20"
              >
                Get Started
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-muted-foreground hover:text-foreground transition p-2"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/10 overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-6 space-y-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-muted-foreground hover:text-foreground transition text-left font-medium"
                >
                  {link.label}
                </button>
              ))}
              {user ? (
                <>
                  <button
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-foreground transition text-left font-medium"
                  >
                    Log out
                  </button>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-medium hover:opacity-90"
                    onClick={() => { setOpen(false); navigate("/welcome"); }}
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    onClick={toggleMenu}
                    className="text-muted-foreground hover:text-foreground transition font-medium"
                  >
                    Log in
                  </Link>
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-[hsl(187_85%_53%)] text-primary-foreground font-medium hover:opacity-90"
                    onClick={handleGetStarted}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

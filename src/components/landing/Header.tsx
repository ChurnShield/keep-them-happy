import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleMenu = () => setOpen(!open);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border/10">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="w-6 h-6 rounded-md bg-gradient-to-r from-teal-400 to-cyan-400" />
          <span className="text-foreground font-semibold text-lg tracking-tight">
            ChurnShield
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => handleNavClick("#features")}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            Features
          </button>
          <button
            onClick={() => handleNavClick("#pricing")}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            Pricing
          </button>
          <button
            onClick={() => handleNavClick("#how-it-works")}
            className="text-muted-foreground hover:text-foreground transition text-sm"
          >
            How it Works
          </button>
          {user ? (
            <>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground transition text-sm"
              >
                Log out
              </button>
              <Button 
                onClick={() => navigate("/welcome")}
                className="bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium hover:opacity-90"
              >
                Dashboard
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-muted-foreground hover:text-foreground transition text-sm"
              >
                Log in
              </Link>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium hover:opacity-90"
              >
                Get Started
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-muted-foreground hover:text-foreground transition"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border/10">
          <nav className="flex flex-col px-6 py-6 space-y-4">
            <button
              onClick={() => handleNavClick("#features")}
              className="text-muted-foreground hover:text-foreground transition text-left"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick("#pricing")}
              className="text-muted-foreground hover:text-foreground transition text-left"
            >
              Pricing
            </button>
            <button
              onClick={() => handleNavClick("#how-it-works")}
              className="text-muted-foreground hover:text-foreground transition text-left"
            >
              How it Works
            </button>
            {user ? (
              <>
                <button
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground transition text-left"
                >
                  Log out
                </button>
                <Button
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium hover:opacity-90"
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
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  Log in
                </Link>
                <Button
                  className="w-full bg-gradient-to-r from-teal-400 to-cyan-400 text-black font-medium hover:opacity-90"
                  onClick={handleGetStarted}
                >
                  Get Started
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

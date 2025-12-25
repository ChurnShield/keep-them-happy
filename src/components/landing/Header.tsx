import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Shield, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Recovery", href: "/recovery" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);

    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    navigate(href);
  };

  const handleStartTrial = () => {
    setIsMenuOpen(false);
    if (user) {
      navigate('/welcome');
    } else {
      navigate('/auth', { state: { from: '/welcome' } });
    }
  };

  const handleSignIn = () => {
    setIsMenuOpen(false);
    navigate('/auth');
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg">
          <div className="flex h-16 items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsMenuOpen(false)}>
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                Churn<span className="gradient-text">Shield</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) =>
                link.href.startsWith("#") ? (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                ),
              )}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button variant="default" size="sm" onClick={() => navigate("/welcome")}>
                    Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={handleSignIn}>
                    Sign In
                  </Button>
                  <Button variant="default" size="sm" onClick={handleStartTrial}>
                    Start Free Trial
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden mt-2 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl p-6 shadow-lg"
            >
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) =>
                  link.href.startsWith("#") ? (
                    <button
                      key={link.name}
                      onClick={() => handleNavClick(link.href)}
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground text-left"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground text-left"
                    >
                      {link.name}
                    </Link>
                  ),
                )}
                <div className="pt-4 border-t border-border flex flex-col gap-3">
                  {user ? (
                    <>
                      <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                      <Button variant="default" className="w-full" onClick={() => { setIsMenuOpen(false); navigate("/welcome"); }}>
                        Dashboard
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" className="w-full" onClick={handleSignIn}>
                        Sign In
                      </Button>
                      <Button variant="default" className="w-full" onClick={handleStartTrial}>
                        Start Free Trial
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

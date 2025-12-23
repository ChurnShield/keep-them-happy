import { Link } from "react-router-dom";

interface LegalLinksProps {
  className?: string;
}

export function LegalLinks({ className = "" }: LegalLinksProps) {
  return (
    <div className={`flex items-center justify-center gap-2 text-xs text-muted-foreground ${className}`}>
      <Link to="/privacy" className="hover:text-foreground transition-colors">
        Privacy
      </Link>
      <span>•</span>
      <Link to="/terms" className="hover:text-foreground transition-colors">
        Terms
      </Link>
      <span>•</span>
      <Link to="/security" className="hover:text-foreground transition-colors">
        Security
      </Link>
    </div>
  );
}
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function PlausiblePageviews() {
  const location = useLocation();

  useEffect(() => {
    // Track pageview on route change
    if (window.plausible) {
      window.plausible("pageview");
    }
  }, [location.pathname, location.search]);

  return null;
}

import { Link, useLocation } from "wouter";
import { Home, AlertTriangle, Camera, Leaf, User } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/reports", label: "Report", icon: Camera },
    { href: "/carbon-credits", label: "Credits", icon: Leaf },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40" data-testid="mobile-navigation">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={`flex flex-col items-center py-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="text-lg" />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

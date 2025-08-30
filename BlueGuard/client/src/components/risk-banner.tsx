import { cn } from "@/lib/utils";
import { Shield, ShieldCheck, AlertTriangle } from "lucide-react";

interface RiskBannerProps {
  riskLevel: "low" | "medium" | "high";
  lastUpdated?: string;
}

export function RiskBanner({ riskLevel, lastUpdated = "2 minutes ago" }: RiskBannerProps) {
  const riskConfig = {
    low: {
      className: "risk-low",
      icon: ShieldCheck,
      title: "Current Risk Level: LOW",
      description: "All coastal conditions are within normal parameters",
    },
    medium: {
      className: "risk-medium",
      icon: AlertTriangle,
      title: "Current Risk Level: MEDIUM",
      description: "Elevated coastal conditions detected - monitor closely",
    },
    high: {
      className: "risk-high",
      icon: Shield,
      title: "Current Risk Level: HIGH",
      description: "Dangerous coastal conditions - exercise extreme caution",
    },
  };

  const config = riskConfig[riskLevel];
  const Icon = config.icon;

  return (
    <div className="mb-6" data-testid="risk-banner">
      <div className={cn("text-white rounded-lg p-6 shadow-lg", config.className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Icon className="h-8 w-8" data-testid={`risk-icon-${riskLevel}`} />
            <div>
              <h2 className="text-2xl font-bold" data-testid="risk-title">{config.title}</h2>
              <p className="opacity-90" data-testid="risk-description">{config.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Last Updated</div>
            <div className="font-semibold" data-testid="last-updated">{lastUpdated}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

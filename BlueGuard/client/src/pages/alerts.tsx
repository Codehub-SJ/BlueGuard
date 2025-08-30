import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle, Clock, Bell, Shield, Info } from "lucide-react";

export default function Alerts() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["/api/alerts"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return AlertTriangle;
      case "warning":
        return Shield;
      default:
        return Info;
    }
  };

  const getAlertColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "bg-red-50 border-red-200 text-red-900";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const getIconColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
            <p className="text-muted-foreground">Stay informed about coastal conditions and warnings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <Badge variant="outline" data-testid="alert-count">
              {(alerts as any)?.length || 0} Active
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts && (alerts as any).length > 0 ? (
          <div className="space-y-4">
            {(alerts as any).map((alert: any, index: number) => {
              const Icon = getAlertIcon(alert.type);
              return (
                <Card 
                  key={alert.id} 
                  className={`border-l-4 ${
                    alert.riskLevel === "high" 
                      ? "border-l-red-500" 
                      : alert.riskLevel === "medium"
                      ? "border-l-yellow-500"
                      : "border-l-blue-500"
                  }`}
                  data-testid={`alert-card-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-lg ${getAlertColor(alert.riskLevel)}`}>
                          <Icon className={`h-6 w-6 ${getIconColor(alert.riskLevel)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold" data-testid={`alert-title-${index}`}>
                              {alert.title}
                            </h3>
                            <Badge 
                              variant={alert.riskLevel === "high" ? "destructive" : "default"}
                              data-testid={`alert-risk-${index}`}
                            >
                              {alert.riskLevel.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant="outline"
                              data-testid={`alert-type-${index}`}
                            >
                              {alert.type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3" data-testid={`alert-message-${index}`}>
                            {alert.message}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            <span data-testid={`alert-time-${index}`}>
                              {new Date(alert.createdAt!).toLocaleString()}
                            </span>
                            {alert.expiresAt && (
                              <>
                                <span className="mx-2">•</span>
                                <span>
                                  Expires: {new Date(alert.expiresAt).toLocaleString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {alert.isActive && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Active</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Alerts</h3>
              <p className="text-muted-foreground mb-6">
                All coastal conditions are within normal parameters. You'll be notified when new alerts are issued.
              </p>
              <Button 
                onClick={() => setLocation("/dashboard")}
                data-testid="return-dashboard-button"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <MobileNav />
    </div>
  );
}

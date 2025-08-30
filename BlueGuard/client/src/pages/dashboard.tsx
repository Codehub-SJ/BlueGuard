import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { RiskBanner } from "@/components/risk-banner";
import { CoastalDataCard } from "@/components/coastal-data";
import { AIPredictionsCard } from "@/components/ai-predictions";
import { CoastalMap } from "@/components/coastal-map";
import { ReportModal } from "@/components/report-modal";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { AlertTriangle, Camera, Leaf, Plus, Clock, MapPin } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { coastalData, predictions, sensors, currentRiskLevel, isLoading } = useRealtimeData();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
    enabled: isAuthenticated,
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated,
  });

  const { data: carbonData } = useQuery({
    queryKey: ["/api/carbon-credits", user?.id],
    enabled: isAuthenticated && !!user,
  });

  if (!isAuthenticated) {
    return null;
  }

  const recentReports = (reports as any)?.slice(0, 2) || [];
  const recentAlerts = (alerts as any)?.slice(0, 2) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <RiskBanner riskLevel={currentRiskLevel} />

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <CoastalDataCard data={coastalData as any} isLoading={isLoading} />

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            <Card data-testid="quick-actions-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-destructive hover:bg-destructive/90"
                  data-testid="emergency-report-button"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Report Emergency
                </Button>
                
                <ReportModal>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    data-testid="report-incident-button"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Report Incident
                  </Button>
                </ReportModal>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation("/carbon-credits")}
                  data-testid="carbon-credits-button"
                >
                  <Leaf className="mr-2 h-4 w-4" />
                  Carbon Credits
                </Button>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card data-testid="recent-alerts-card">
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {recentAlerts.length > 0 ? (
                  <div className="space-y-3">
                    {recentAlerts.map((alert: any, index: number) => (
                      <div 
                        key={alert.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          alert.riskLevel === "high" 
                            ? "bg-red-50 border-red-200" 
                            : alert.riskLevel === "medium"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-blue-50 border-blue-200"
                        }`}
                        data-testid={`alert-${index}`}
                      >
                        <AlertTriangle className={`mt-1 h-4 w-4 ${
                          alert.riskLevel === "high" 
                            ? "text-red-600" 
                            : alert.riskLevel === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" data-testid={`alert-title-${index}`}>
                            {alert.title}
                          </p>
                          <p className="text-xs text-muted-foreground" data-testid={`alert-message-${index}`}>
                            {alert.message}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {new Date(alert.createdAt!).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent alerts
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Predictions & Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AIPredictionsCard predictions={predictions as any} isLoading={isLoading} />
          <CoastalMap sensors={sensors as any} isLoading={isLoading} />
        </div>

        {/* Community Reports & Carbon Credits Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Community Reports */}
          <Card data-testid="community-reports-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Community Reports
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setLocation("/reports")}
                  data-testid="view-all-reports-button"
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReports.length > 0 ? (
                <div className="space-y-4">
                  {recentReports.map((report: any, index: number) => (
                    <div key={report.id} className="border border-border rounded-lg p-4" data-testid={`report-${index}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${report.userId}`} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">Community Member</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-medium mb-1" data-testid={`report-title-${index}`}>
                        {report.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {report.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {report.location}
                        </span>
                        {report.photos && report.photos.length > 0 && (
                          <span>
                            <Camera className="inline h-3 w-3 mr-1" />
                            {report.photos.length} photos
                          </span>
                        )}
                        <Badge variant={
                          report.priority === "high" ? "destructive" : 
                          report.priority === "medium" ? "default" : "secondary"
                        }>
                          {report.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reports yet
                </p>
              )}
              
              <ReportModal>
                <Button className="w-full mt-4" data-testid="submit-new-report-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit New Report
                </Button>
              </ReportModal>
            </CardContent>
          </Card>

          {/* Carbon Credits Preview */}
          <Card data-testid="carbon-credits-preview-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Carbon Credits
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Marketplace
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-900">Your Carbon Credits</h4>
                  <span className="text-2xl font-bold text-green-600" data-testid="user-credits-balance">
                    {(carbonData as any)?.balance || 0}
                  </span>
                </div>
                <p className="text-sm text-green-700 mb-3">
                  Earned from coastal conservation activities
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-green-800">+5</div>
                    <div className="text-green-600">Recent Earning</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-800">
                      ${(((carbonData as any)?.balance || 0) * 0.05).toFixed(2)}
                    </div>
                    <div className="text-green-600">Market Value</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Trade your credits or earn more through conservation activities
                </p>
                <Button 
                  className="w-full"
                  onClick={() => setLocation("/carbon-credits")}
                  data-testid="open-marketplace-button"
                >
                  <Leaf className="mr-2 h-4 w-4" />
                  Open Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

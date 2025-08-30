import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigation } from "@/components/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Activity,
  FileText,
  Radio,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from "lucide-react";
import type { Report, Sensor } from "@shared/schema";

const alertSchema = z.object({
  type: z.enum(["warning", "watch", "emergency"]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  riskLevel: z.enum(["low", "medium", "high"]),
  expiresAt: z.string().optional(),
});

type AlertFormData = z.infer<typeof alertSchema>;

export default function Authority() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isAuthority } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAuthority) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isAuthority, setLocation]);

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/authority/stats"],
    enabled: isAuthenticated && isAuthority,
  });

  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ["/api/reports"],
    enabled: isAuthenticated && isAuthority,
  });

  const { data: sensors, isLoading: isLoadingSensors } = useQuery({
    queryKey: ["/api/dashboard/sensors"],
    enabled: isAuthenticated && isAuthority,
  });

  const { data: alerts } = useQuery({
    queryKey: ["/api/alerts"],
    enabled: isAuthenticated && isAuthority,
  });

  const form = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      type: "warning",
      title: "",
      message: "",
      riskLevel: "medium",
      expiresAt: "",
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: AlertFormData) => {
      const alertData = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      };
      const response = await apiRequest("POST", "/api/alerts", alertData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Alert broadcast successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      setAlertModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to broadcast alert", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/reports/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/authority/stats"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update report", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (!isAuthenticated || !isAuthority) {
    return null;
  }

  const pendingReports = reports?.filter((r: Report) => r.status === "pending") || [];
  const priorityReports = pendingReports.filter((r: Report) => r.priority === "high");
  const sensorsOnline = sensors?.filter((s: Sensor) => s.isOnline).length || 0;
  const totalSensors = sensors?.length || 0;

  const onSubmitAlert = (data: AlertFormData) => {
    createAlertMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Authority Management Panel</h1>
            <p className="text-muted-foreground">Monitor and manage coastal alert systems</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={alertModalOpen} onOpenChange={setAlertModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-destructive hover:bg-destructive/90" data-testid="broadcast-alert-button">
                  <Radio className="mr-2 h-4 w-4" />
                  Radio Alert
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="alert-modal">
                <DialogHeader>
                  <DialogTitle>Radio Emergency Alert</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitAlert)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="alert-type-select">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warning">Warning</SelectItem>
                              <SelectItem value="watch">Watch</SelectItem>
                              <SelectItem value="emergency">Emergency</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="riskLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="risk-level-select">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter alert title" {...field} data-testid="alert-title-input" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alert Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter detailed alert message..."
                              rows={4}
                              {...field}
                              data-testid="alert-message-textarea"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              data-testid="alert-expiration-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setAlertModalOpen(false)}
                        data-testid="cancel-alert-button"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-destructive hover:bg-destructive/90"
                        disabled={createAlertMutation.isPending}
                        data-testid="submit-alert-button"
                      >
                        {createAlertMutation.isPending ? "Broadcasting..." : "Radio Alert"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" data-testid="export-reports-button">
              <Download className="mr-2 h-4 w-4" />
              Export Reports
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card data-testid="pending-reports-stat">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-1" data-testid="pending-reports-count">
                {stats?.pendingReports || 0}
              </div>
              <div className="text-sm text-muted-foreground">Pending Reports</div>
            </CardContent>
          </Card>

          <Card data-testid="active-alerts-stat">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-1" data-testid="active-alerts-count">
                {stats?.activeAlerts || 0}
              </div>
              <div className="text-sm text-muted-foreground">Active Alerts</div>
            </CardContent>
          </Card>

          <Card data-testid="sensors-status-stat">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-1" data-testid="sensors-online-count">
                {sensorsOnline}/{totalSensors}
              </div>
              <div className="text-sm text-muted-foreground">Sensors Online</div>
            </CardContent>
          </Card>

          <Card data-testid="community-members-stat">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-foreground mb-1" data-testid="community-members-count">
                1,247
              </div>
              <div className="text-sm text-muted-foreground">Community Members</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports" className="space-y-6" data-testid="authority-tabs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports" data-testid="reports-tab">Reports</TabsTrigger>
            <TabsTrigger value="sensors" data-testid="sensors-tab">Sensors</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="alerts-tab">Alerts</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High Priority Reports */}
              <Card data-testid="priority-reports-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>High Priority Reports</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingReports ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse border-l-4 border-l-red-500 bg-red-50 rounded p-3">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : priorityReports.length > 0 ? (
                    <div className="space-y-3">
                      {priorityReports.slice(0, 5).map((report: Report, index: number) => (
                        <div key={report.id} className="border-l-4 border-l-red-500 bg-red-50 rounded p-3" data-testid={`priority-report-${index}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-red-900" data-testid={`priority-report-title-${index}`}>
                                {report.title}
                              </p>
                              <p className="text-sm text-red-700 mb-2">
                                {report.description.substring(0, 100)}...
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-red-600">
                                <span>{new Date(report.createdAt!).toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{report.location}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatusMutation.mutate({ id: report.id, status: "reviewed" })}
                                disabled={updateReportStatusMutation.isPending}
                                data-testid={`review-priority-report-${index}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateReportStatusMutation.mutate({ id: report.id, status: "resolved" })}
                                disabled={updateReportStatusMutation.isPending}
                                data-testid={`resolve-priority-report-${index}`}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="text-muted-foreground">No high priority reports</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Reports Summary */}
              <Card data-testid="all-reports-summary-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span>All Reports Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingReports ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-border rounded p-3">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : reports && reports.length > 0 ? (
                    <div className="space-y-3">
                      {reports.slice(0, 8).map((report: Report, index: number) => (
                        <div key={report.id} className="flex items-center justify-between border border-border rounded p-3" data-testid={`report-summary-${index}`}>
                          <div className="flex-1">
                            <p className="font-medium text-sm" data-testid={`report-summary-title-${index}`}>
                              {report.title}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{new Date(report.createdAt!).toLocaleDateString()}</span>
                              <Badge variant={
                                report.priority === "high" ? "destructive" : 
                                report.priority === "medium" ? "default" : "secondary"
                              }>
                                {report.priority}
                              </Badge>
                              <Badge variant="outline" className={
                                report.status === "resolved" ? "text-green-600" :
                                report.status === "reviewed" ? "text-blue-600" : "text-yellow-600"
                              }>
                                {report.status}
                              </Badge>
                            </div>
                          </div>
                          {report.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateReportStatusMutation.mutate({ id: report.id, status: "reviewed" })}
                              disabled={updateReportStatusMutation.isPending}
                              data-testid={`quick-review-${index}`}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No reports available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sensors">
            <Card data-testid="sensor-network-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Sensor Network Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSensors ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center justify-between border border-border rounded p-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-muted rounded-full"></div>
                          <div className="h-4 bg-muted rounded w-32"></div>
                        </div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                ) : sensors && sensors.length > 0 ? (
                  <div className="space-y-3">
                    {sensors.map((sensor: Sensor, index: number) => (
                      <div key={sensor.id} className="flex items-center justify-between border border-border rounded p-3" data-testid={`sensor-${index}`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${sensor.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <p className="font-medium" data-testid={`sensor-name-${index}`}>
                              {sensor.name}
                            </p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {sensor.type} Monitor • {sensor.location}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {sensor.isOnline ? (
                            <div className="flex items-center text-green-600">
                              <Wifi className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-red-600">
                              <WifiOff className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">Offline</span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(sensor.lastReading!).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No sensors configured</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card data-testid="alert-management-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <span>Alert Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && (alerts as any).length > 0 ? (
                  <div className="space-y-4">
                    {(alerts as any).map((alert: any, index: number) => (
                      <div key={alert.id} className={`border rounded-lg p-4 ${
                        alert.riskLevel === "high" ? "border-red-200 bg-red-50" :
                        alert.riskLevel === "medium" ? "border-yellow-200 bg-yellow-50" :
                        "border-blue-200 bg-blue-50"
                      }`} data-testid={`alert-management-${index}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold" data-testid={`alert-management-title-${index}`}>
                                {alert.title}
                              </h4>
                              <Badge variant={alert.riskLevel === "high" ? "destructive" : "default"}>
                                {alert.riskLevel.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {alert.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2" data-testid={`alert-management-message-${index}`}>
                              {alert.message}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>
                                <Clock className="inline h-3 w-3 mr-1" />
                                {new Date(alert.createdAt!).toLocaleString()}
                              </span>
                              {alert.expiresAt && (
                                <span>
                                  Expires: {new Date(alert.expiresAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {alert.isActive && (
                              <div className="flex items-center text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                                <span className="text-xs font-medium">Active</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No alerts active</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="system-health-card">
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Sensor Network</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(sensorsOnline / totalSensors) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.round((sensorsOnline / totalSensors) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Report Response Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "87%" }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">87%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Community Engagement</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-600 h-2 rounded-full" style={{ width: "73%" }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">73%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="monthly-statistics-card">
                <CardHeader>
                  <CardTitle>Monthly Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Reports Received</span>
                      <span className="font-semibold">{(reports as any)?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Reports Resolved</span>
                      <span className="font-semibold">
                        {(reports as Report[])?.filter((r: Report) => r.status === "resolved").length || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Alerts Issued</span>
                      <span className="font-semibold">{(alerts as any)?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Community Growth</span>
                      <span className="font-semibold text-green-600">+12%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
    </div>
  );
}

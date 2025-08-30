import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { ReportModal } from "@/components/report-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText, 
  Plus, 
  Filter, 
  MapPin, 
  Camera, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Eye
} from "lucide-react";
import type { Report } from "@shared/schema";

export default function Reports() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isAuthority } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/reports", activeTab === "mine" ? user?.id : undefined],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/reports/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report status updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update report status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const filteredReports = (reports as Report[])?.filter((report: Report) => {
    if (activeTab === "mine" && report.userId !== user?.id) return false;
    if (filterType !== "all" && report.type !== filterType) return false;
    if (filterStatus !== "all" && report.status !== filterStatus) return false;
    if (filterPriority !== "all" && report.priority !== filterPriority) return false;
    return true;
  }) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-50 border-green-200 text-green-800";
      case "reviewed":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return CheckCircle;
      case "reviewed":
        return Eye;
      default:
        return Clock;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Community incident reports and observations</p>
          </div>
          <ReportModal>
            <Button data-testid="create-report-button">
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </ReportModal>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-4">
            <Card data-testid="filters-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger data-testid="filter-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="erosion">Coastal Erosion</SelectItem>
                      <SelectItem value="flooding">High Water Level</SelectItem>
                      <SelectItem value="illegal_mining">Illegal Mining</SelectItem>
                      <SelectItem value="hazard">Environmental Hazard</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger data-testid="filter-status-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger data-testid="filter-priority-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="reports-tabs">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="all" data-testid="all-reports-tab">All Reports</TabsTrigger>
                <TabsTrigger value="mine" data-testid="my-reports-tab">My Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                              <div className="h-3 bg-muted rounded w-2/3"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredReports.length > 0 ? (
                  <div className="space-y-4">
                    {filteredReports.map((report: Report, index: number) => {
                      const StatusIcon = getStatusIcon(report.status);
                      return (
                        <Card key={report.id} data-testid={`report-card-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start space-x-4 flex-1">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${report.userId}`} />
                                  <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="text-lg font-semibold" data-testid={`report-title-${index}`}>
                                      {report.title}
                                    </h3>
                                    <Badge variant={getPriorityColor(report.priority)} data-testid={`report-priority-${index}`}>
                                      {report.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground mb-3" data-testid={`report-description-${index}`}>
                                    {report.description}
                                  </p>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      {report.location}
                                    </span>
                                    {report.photos && report.photos.length > 0 && (
                                      <span className="flex items-center">
                                        <Camera className="h-4 w-4 mr-1" />
                                        {report.photos.length} photos
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {new Date(report.createdAt!).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <Badge className={`text-xs ${getStatusColor(report.status)}`} data-testid={`report-status-${index}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                              {isAuthority && report.status === "pending" && (
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: report.id, status: "reviewed" })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`mark-reviewed-${index}`}
                                  >
                                    Mark Reviewed
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => updateStatusMutation.mutate({ id: report.id, status: "resolved" })}
                                    disabled={updateStatusMutation.isPending}
                                    data-testid={`mark-resolved-${index}`}
                                  >
                                    Mark Resolved
                                  </Button>
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
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Reports Found</h3>
                      <p className="text-muted-foreground mb-6">
                        {activeTab === "mine" 
                          ? "You haven't submitted any reports yet." 
                          : "No reports match your current filters."}
                      </p>
                      <ReportModal>
                        <Button data-testid="create-first-report-button">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Your First Report
                        </Button>
                      </ReportModal>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="mine">
                {/* Same content as "all" but filtered to user's reports */}
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded w-3/4"></div>
                              <div className="h-3 bg-muted rounded w-1/2"></div>
                              <div className="h-3 bg-muted rounded w-2/3"></div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredReports.length > 0 ? (
                  <div className="space-y-4">
                    {filteredReports.map((report: Report, index: number) => {
                      const StatusIcon = getStatusIcon(report.status);
                      return (
                        <Card key={report.id} data-testid={`my-report-card-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="text-lg font-semibold" data-testid={`my-report-title-${index}`}>
                                    {report.title}
                                  </h3>
                                  <Badge variant={getPriorityColor(report.priority)}>
                                    {report.priority}
                                  </Badge>
                                </div>
                                <p className="text-muted-foreground mb-3">
                                  {report.description}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {report.location}
                                  </span>
                                  {report.photos && report.photos.length > 0 && (
                                    <span className="flex items-center">
                                      <Camera className="h-4 w-4 mr-1" />
                                      {report.photos.length} photos
                                    </span>
                                  )}
                                  <span className="flex items-center">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {new Date(report.createdAt!).toLocaleDateString()}
                                  </span>
                                </div>
                                <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't submitted any reports yet. Help protect our coastal communities by reporting incidents.
                      </p>
                      <ReportModal>
                        <Button data-testid="create-my-first-report-button">
                          <Plus className="mr-2 h-4 w-4" />
                          Submit Your First Report
                        </Button>
                      </ReportModal>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

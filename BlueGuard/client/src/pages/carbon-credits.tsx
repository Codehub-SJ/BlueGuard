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
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Leaf, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Award,
  DollarSign,
  BarChart3,
  Plus
} from "lucide-react";
import type { CarbonCredit, CarbonTrade } from "@shared/schema";

const tradeSchema = z.object({
  buyerCompany: z.string().min(1, "Company name is required"),
  amount: z.number().min(1, "Amount must be at least 1"),
  pricePerCredit: z.number().min(0.01, "Price must be at least $0.01"),
});

type TradeFormData = z.infer<typeof tradeSchema>;

export default function CarbonCredits() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tradeModalOpen, setTradeModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: carbonData, isLoading: isLoadingCredits } = useQuery({
    queryKey: ["/api/carbon-credits", user?.id],
    enabled: isAuthenticated && !!user,
  });

  const { data: trades, isLoading: isLoadingTrades } = useQuery({
    queryKey: ["/api/carbon-credits/trades"],
    enabled: isAuthenticated,
  });

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      buyerCompany: "",
      amount: 1,
      pricePerCredit: 0.05,
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      const response = await apiRequest("POST", "/api/carbon-credits/trade", {
        ...data,
        sellerId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Trade listing created successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/carbon-credits/trades"] });
      setTradeModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create trade", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const userCredits = (carbonData as any)?.credits || [];
  const userBalance = (carbonData as any)?.balance || 0;
  const marketValue = userBalance * 0.05; // $0.05 per credit average

  const recentEarnings = userCredits
    .filter((credit: CarbonCredit) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(credit.createdAt!) > oneWeekAgo;
    })
    .reduce((total: number, credit: CarbonCredit) => total + credit.amount, 0);

  const mockTradingOpportunities = [
    {
      company: "OceanTech Industries",
      pricePerCredit: 0.052,
      change: 3.2,
      volume: "2.1K credits",
    },
    {
      company: "GreenShip Logistics",
      pricePerCredit: 0.048,
      change: -1.1,
      volume: "5.7K credits",
    },
    {
      company: "Coastal Renewables",
      pricePerCredit: 0.055,
      change: 5.8,
      volume: "1.8K credits",
    },
  ];

  const onSubmitTrade = (data: TradeFormData) => {
    if (data.amount > userBalance) {
      toast({
        title: "Insufficient credits",
        description: `You only have ${userBalance} credits available`,
        variant: "destructive"
      });
      return;
    }
    createTradeMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Carbon Credits</h1>
            <p className="text-muted-foreground">Earn and trade carbon credits through coastal conservation</p>
          </div>
          <div className="flex items-center space-x-2">
            <Leaf className="h-5 w-5 text-green-600" />
            <Badge variant="outline" className="bg-green-100 text-green-800" data-testid="marketplace-badge">
              Marketplace Active
            </Badge>
          </div>
        </div>

        {/* Your Credits Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-green-50 border-green-200" data-testid="credits-balance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Total Credits</p>
                  <p className="text-3xl font-bold text-green-900" data-testid="total-credits">
                    {userBalance}
                  </p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200" data-testid="market-value-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Market Value</p>
                  <p className="text-3xl font-bold text-blue-900" data-testid="market-value">
                    ${marketValue.toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200" data-testid="recent-earnings-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">This Week</p>
                  <p className="text-3xl font-bold text-purple-900" data-testid="weekly-earnings">
                    +{recentEarnings}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" data-testid="carbon-credits-tabs">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
            <TabsTrigger value="marketplace" data-testid="marketplace-tab">Marketplace</TabsTrigger>
            <TabsTrigger value="history" data-testid="history-tab">History</TabsTrigger>
            <TabsTrigger value="earning" data-testid="earning-tab">Earning</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card data-testid="recent-activity-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingCredits ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : userCredits.length > 0 ? (
                    <div className="space-y-4">
                      {userCredits.slice(0, 5).map((credit: CarbonCredit, index: number) => (
                        <div key={credit.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`credit-activity-${index}`}>
                          <div>
                            <p className="font-medium text-sm" data-testid={`credit-description-${index}`}>
                              {credit.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(credit.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600" data-testid={`credit-amount-${index}`}>
                              +{credit.amount}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {credit.source}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No carbon credits earned yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start earning by reporting incidents and participating in conservation activities
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card data-testid="performance-chart-card">
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3" />
                      <p>Credits Earned Over Time</p>
                      <p className="text-xs mt-1">Chart visualization coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="marketplace">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Opportunities */}
              <Card data-testid="trading-opportunities-card">
                <CardHeader>
                  <CardTitle>Trading Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTradingOpportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`trading-opportunity-${index}`}>
                        <div>
                          <p className="font-medium" data-testid={`company-name-${index}`}>
                            {opportunity.company}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${opportunity.pricePerCredit.toFixed(3)}/credit • {opportunity.volume}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center ${opportunity.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {opportunity.change > 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            <span className="font-semibold">
                              {opportunity.change > 0 ? '+' : ''}{opportunity.change}%
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="mt-2" data-testid={`trade-button-${index}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Trade
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Sell Your Credits */}
              <Card data-testid="sell-credits-card">
                <CardHeader>
                  <CardTitle>Sell Your Credits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-900">Available to Sell</span>
                        <span className="text-2xl font-bold text-green-600" data-testid="available-credits">
                          {userBalance}
                        </span>
                      </div>
                      <p className="text-sm text-green-700">
                        Current market rate: $0.05/credit
                      </p>
                    </div>

                    <Dialog open={tradeModalOpen} onOpenChange={setTradeModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={userBalance === 0} data-testid="create-trade-button">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Trade Listing
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-testid="trade-modal">
                        <DialogHeader>
                          <DialogTitle>Create Trade Listing</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmitTrade)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="buyerCompany"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Buyer Company</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter company name" {...field} data-testid="buyer-company-input" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="amount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Amount (Credits)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      max={userBalance}
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      data-testid="amount-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="pricePerCredit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price per Credit ($)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      step="0.01" 
                                      min="0.01"
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      data-testid="price-input"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="bg-muted p-3 rounded-lg">
                              <div className="flex justify-between text-sm">
                                <span>Total Value:</span>
                                <span className="font-semibold" data-testid="total-value">
                                  ${(form.watch("amount") * form.watch("pricePerCredit")).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <div className="flex space-x-3">
                              <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setTradeModalOpen(false)}
                                data-testid="cancel-trade-button"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                className="flex-1"
                                disabled={createTradeMutation.isPending}
                                data-testid="submit-trade-button"
                              >
                                {createTradeMutation.isPending ? "Creating..." : "Create Listing"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card data-testid="transaction-history-card">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTrades ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : trades && (trades as any).length > 0 ? (
                  <div className="space-y-4">
                    {(trades as any).map((trade: CarbonTrade, index: number) => (
                      <div key={trade.id} className="border border-border rounded-lg p-4" data-testid={`trade-history-${index}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" data-testid={`trade-company-${index}`}>
                              {trade.buyerCompany}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {trade.amount} credits @ ${trade.pricePerCredit.toFixed(3)} each
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trade.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600" data-testid={`trade-total-${index}`}>
                              ${(trade.amount * trade.pricePerCredit).toFixed(2)}
                            </p>
                            <Badge 
                              variant={trade.status === "completed" ? "default" : "secondary"}
                              data-testid={`trade-status-${index}`}
                            >
                              {trade.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No trading history yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your completed trades will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earning">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card data-testid="earning-opportunities-card">
                <CardHeader>
                  <CardTitle>Earning Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Report Incidents</h4>
                        <Badge variant="secondary">+5 credits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Earn credits by reporting coastal incidents and environmental hazards
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Conservation Activities</h4>
                        <Badge variant="secondary">+10-25 credits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Participate in beach cleanups and conservation projects
                      </p>
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Sensor Monitoring</h4>
                        <Badge variant="secondary">+15 credits</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Help maintain and monitor coastal sensor networks
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card data-testid="earning-tips-card">
                <CardHeader>
                  <CardTitle>Earning Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Quality Reports</h4>
                      <p className="text-sm text-blue-700">
                        Detailed reports with photos and accurate locations earn more credits
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Regular Participation</h4>
                      <p className="text-sm text-green-700">
                        Consistent reporting and engagement increases your earning potential
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-2">Community Impact</h4>
                      <p className="text-sm text-purple-700">
                        Help resolve issues and improve coastal resilience for bonus credits
                      </p>
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

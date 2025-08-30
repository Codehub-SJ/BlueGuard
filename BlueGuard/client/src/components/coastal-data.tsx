import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Waves, TrendingUp, Wind, Thermometer } from "lucide-react";
import type { CoastalData } from "@shared/schema";

interface CoastalDataCardProps {
  data?: CoastalData;
  isLoading: boolean;
}

export function CoastalDataCard({ data, isLoading }: CoastalDataCardProps) {
  if (isLoading) {
    return (
      <Card className="lg:col-span-2" data-testid="coastal-data-loading">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Real-time Coastal Data
            <div className="animate-pulse bg-muted h-4 w-12 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 bg-muted rounded-lg animate-pulse">
                <div className="h-8 w-8 bg-muted-foreground/20 rounded mx-auto mb-2"></div>
                <div className="h-6 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-4 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataPoints = [
    {
      icon: Waves,
      value: `${data?.waveHeight?.toFixed(1) || "0.0"}m`,
      label: "Wave Height",
      color: "text-blue-500",
      testId: "wave-height"
    },
    {
      icon: TrendingUp,
      value: `${data?.tideLevel?.toFixed(1) || "0.0"}m`,
      label: "Tide Level",
      color: "text-teal-500",
      testId: "tide-level"
    },
    {
      icon: Wind,
      value: `${data?.windSpeed?.toFixed(0) || "0"} km/h`,
      label: "Wind Speed",
      color: "text-gray-500",
      testId: "wind-speed"
    },
    {
      icon: Thermometer,
      value: `${data?.temperature?.toFixed(0) || "0"}°C`,
      label: "Temperature",
      color: "text-orange-500",
      testId: "temperature"
    },
  ];

  return (
    <Card className="lg:col-span-2" data-testid="coastal-data-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Real-time Coastal Data
          <Badge variant="outline" className="bg-green-100 text-green-800 live-indicator" data-testid="live-badge">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {dataPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.label} className="text-center p-4 bg-muted rounded-lg" data-testid={`data-point-${point.testId}`}>
                <Icon className={`text-2xl mb-2 mx-auto ${point.color}`} />
                <div className="text-2xl font-bold text-foreground">{point.value}</div>
                <div className="text-sm text-muted-foreground">{point.label}</div>
              </div>
            );
          })}
        </div>
        
        {/* Chart Placeholder */}
        <div className="h-48 bg-muted rounded-lg flex items-center justify-center" data-testid="chart-placeholder">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="text-4xl mb-2 mx-auto wave-animation" />
            <p>24-Hour Trend Chart</p>
            <p className="text-xs mt-1">Real-time data visualization</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb } from "lucide-react";
import type { AIPrediction } from "@shared/schema";

interface AIPredictionsCardProps {
  predictions?: AIPrediction[];
  isLoading: boolean;
}

export function AIPredictionsCard({ predictions, isLoading }: AIPredictionsCardProps) {
  if (isLoading) {
    return (
      <Card data-testid="ai-predictions-loading">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            AI Risk Predictions
            <div className="animate-pulse bg-muted h-4 w-16 rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg animate-pulse">
                <div className="h-4 bg-muted-foreground/20 rounded mb-2"></div>
                <div className="h-3 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-50 border-green-200 text-green-900";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "high":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getRiskDotColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTimeSlotLabel = (timeSlot: string) => {
    switch (timeSlot) {
      case "6-12":
        return "6:00 AM - 12:00 PM";
      case "12-18":
        return "12:00 PM - 6:00 PM";
      case "18-24":
        return "6:00 PM - 12:00 AM";
      default:
        return timeSlot;
    }
  };

  return (
    <Card data-testid="ai-predictions-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Risk Predictions
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary" data-testid="prediction-badge">
            Next 24h
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions?.map((prediction, index) => (
            <div
              key={prediction.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${getRiskColor(prediction.riskLevel)}`}
              data-testid={`prediction-${index}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getRiskDotColor(prediction.riskLevel)}`}></div>
                <div>
                  <p className="font-medium" data-testid={`prediction-time-${index}`}>
                    {getTimeSlotLabel(prediction.timeSlot)}
                  </p>
                  <p className="text-sm opacity-80" data-testid={`prediction-risk-${index}`}>
                    {prediction.riskLevel.charAt(0).toUpperCase() + prediction.riskLevel.slice(1)} Risk
                  </p>
                </div>
              </div>
              <span className="font-semibold" data-testid={`prediction-confidence-${index}`}>
                {prediction.confidence}% confidence
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg" data-testid="ai-insight">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              AI model suggests monitoring afternoon tide levels more closely due to weather patterns.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

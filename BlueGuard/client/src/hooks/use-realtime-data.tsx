import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

export function useRealtimeData() {
  const { data: coastalData, isLoading: isLoadingCoastal } = useQuery({
    queryKey: ["/api/dashboard/coastal-data"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: predictions, isLoading: isLoadingPredictions } = useQuery({
    queryKey: ["/api/dashboard/predictions"],
    refetchInterval: 60000, // Refetch every minute
  });

  const { data: sensors, isLoading: isLoadingSensors } = useQuery({
    queryKey: ["/api/dashboard/sensors"],
    refetchInterval: 60000, // Refetch every minute
  });

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch("/api/simulate/coastal-data", { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/coastal-data"] });
      } catch (error) {
        console.error("Failed to simulate coastal data:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getCurrentRiskLevel = (): "low" | "medium" | "high" => {
    if (!coastalData) return "low";
    
    const { waveHeight, tideLevel, windSpeed } = coastalData as any;
    
    // Simple risk calculation algorithm
    let riskScore = 0;
    if (waveHeight > 3) riskScore += 2;
    else if (waveHeight > 2.5) riskScore += 1;
    
    if (tideLevel > 2.5) riskScore += 2;
    else if (tideLevel > 2) riskScore += 1;
    
    if (windSpeed > 25) riskScore += 2;
    else if (windSpeed > 20) riskScore += 1;
    
    if (riskScore >= 4) return "high";
    if (riskScore >= 2) return "medium";
    return "low";
  };

  return {
    coastalData,
    predictions,
    sensors,
    currentRiskLevel: getCurrentRiskLevel(),
    isLoading: isLoadingCoastal || isLoadingPredictions || isLoadingSensors,
  };
}

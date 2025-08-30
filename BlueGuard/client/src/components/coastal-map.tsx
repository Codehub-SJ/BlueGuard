import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Sensor } from "@shared/schema";

interface CoastalMapProps {
  sensors?: Sensor[];
  isLoading: boolean;
}

export function CoastalMap({ sensors, isLoading }: CoastalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showSensors, setShowSensors] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Initialize Leaflet map (we'll simulate this for now)
    const mockMap = {
      initialized: true,
      markers: [],
      addMarker: (lat: number, lng: number, info: any) => {
        console.log(`Adding marker at ${lat}, ${lng}:`, info);
      }
    };

    setMapInstance(mockMap);

    // Add sensor markers
    if (sensors && showSensors) {
      sensors.forEach(sensor => {
        mockMap.addMarker(sensor.latitude, sensor.longitude, {
          name: sensor.name,
          type: sensor.type,
          status: sensor.isOnline ? "online" : "offline"
        });
      });
    }
  }, [sensors, showSensors, isLoading]);

  if (isLoading) {
    return (
      <Card data-testid="coastal-map-loading">
        <CardHeader>
          <CardTitle>Coastal Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="coastal-map-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            Coastal Monitoring
          </div>
          <div className="flex space-x-2">
            <Button
              variant={showSensors ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSensors(!showSensors)}
              data-testid="toggle-sensors-button"
            >
              <Layers className="h-4 w-4 mr-1" />
              Sensors
            </Button>
            <Button variant="outline" size="sm" data-testid="toggle-reports-button">
              Reports
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={mapRef}
          className="h-64 bg-muted rounded-lg flex items-center justify-center"
          data-testid="map-container"
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="text-4xl mb-2 mx-auto text-primary" />
            <p className="font-medium">Interactive Coastal Map</p>
            <p className="text-xs mt-1">Shows sensors, reports, and risk zones</p>
            {sensors && (
              <div className="mt-3 text-xs">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{sensors.filter(s => s.isOnline).length} Online</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{sensors.filter(s => !s.isOnline).length} Offline</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Advanced Geographical Analytics Service
// Provides location-based analytics, clustering, and risk zone mapping

interface LocationCluster {
  id: string;
  centerLat: number;
  centerLon: number;
  radius: number; // in kilometers
  riskLevel: 'low' | 'medium' | 'high';
  incidentCount: number;
  userCount: number;
  lastActivity: Date;
}

interface RiskZone {
  id: string;
  name: string;
  polygon: Array<{ lat: number; lon: number }>;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  evacuationRoutes: Array<{
    name: string;
    coordinates: Array<{ lat: number; lon: number }>;
    capacity: number;
  }>;
}

interface HeatmapData {
  lat: number;
  lon: number;
  intensity: number;
  type: 'incident' | 'user_activity' | 'sensor_alert' | 'risk_prediction';
  timestamp: Date;
}

export class GeoAnalyticsService {
  private riskZones: RiskZone[] = [];
  private clusters: LocationCluster[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Initialize predefined risk zones
    this.riskZones = [
      {
        id: 'zone_001',
        name: 'Miami Beach High Risk Zone',
        polygon: [
          { lat: 25.7617, lon: -80.1918 },
          { lat: 25.7817, lon: -80.1718 },
          { lat: 25.7417, lon: -80.1518 },
          { lat: 25.7217, lon: -80.1818 }
        ],
        riskLevel: 'high',
        riskFactors: ['Storm surge susceptible', 'Low elevation', 'Dense population'],
        evacuationRoutes: [
          {
            name: 'Route A1A North',
            coordinates: [
              { lat: 25.7617, lon: -80.1918 },
              { lat: 25.8017, lon: -80.1718 }
            ],
            capacity: 5000
          }
        ]
      },
      {
        id: 'zone_002',
        name: 'San Francisco Bay Area',
        polygon: [
          { lat: 37.7749, lon: -122.4194 },
          { lat: 37.8049, lon: -122.3894 },
          { lat: 37.7449, lon: -122.3594 },
          { lat: 37.7149, lon: -122.3994 }
        ],
        riskLevel: 'medium',
        riskFactors: ['Seismic activity', 'Tsunami risk', 'Fog impact'],
        evacuationRoutes: [
          {
            name: 'Golden Gate Bridge',
            coordinates: [
              { lat: 37.7749, lon: -122.4194 },
              { lat: 37.8083, lon: -122.4784 }
            ],
            capacity: 10000
          }
        ]
      }
    ];

    this.isInitialized = true;
    console.log('Geo Analytics Service initialized');
  }

  async analyzeLocationClusters(locations: Array<{ lat: number; lon: number; timestamp: Date }>): Promise<LocationCluster[]> {
    if (!this.isInitialized) await this.initialize();

    // K-means clustering algorithm for grouping locations
    const clusters = this.performClustering(locations, 5); // 5 clusters
    
    this.clusters = clusters.map((cluster, index) => ({
      id: `cluster_${index + 1}`,
      centerLat: cluster.center.lat,
      centerLon: cluster.center.lon,
      radius: cluster.radius,
      riskLevel: this.calculateClusterRisk(cluster),
      incidentCount: cluster.points.length,
      userCount: Math.floor(cluster.points.length * 0.7), // Estimate unique users
      lastActivity: new Date(Math.max(...cluster.points.map(p => p.timestamp.getTime())))
    }));

    return this.clusters;
  }

  async getRiskZones(): Promise<RiskZone[]> {
    if (!this.isInitialized) await this.initialize();
    return this.riskZones;
  }

  async generateHeatmap(
    region: { northEast: { lat: number; lon: number }, southWest: { lat: number; lon: number } },
    dataType: 'incidents' | 'user_activity' | 'combined' = 'combined'
  ): Promise<HeatmapData[]> {
    const heatmapData: HeatmapData[] = [];

    // Generate synthetic heatmap data for the region
    const latRange = region.northEast.lat - region.southWest.lat;
    const lonRange = region.northEast.lon - region.southWest.lon;

    for (let i = 0; i < 100; i++) {
      const lat = region.southWest.lat + Math.random() * latRange;
      const lon = region.southWest.lon + Math.random() * lonRange;
      
      // Calculate intensity based on proximity to known risk zones
      const intensity = this.calculateIntensity(lat, lon, dataType);
      
      if (intensity > 0.1) { // Only include significant data points
        heatmapData.push({
          lat,
          lon,
          intensity,
          type: this.getRandomDataType(dataType),
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
        });
      }
    }

    return heatmapData.sort((a, b) => b.intensity - a.intensity);
  }

  async analyzeProximityRisks(lat: number, lon: number, radius: number = 10): Promise<{
    riskScore: number;
    nearbyRiskZones: Array<{ zone: RiskZone; distance: number }>;
    recentIncidents: Array<{ type: string; distance: number; timestamp: Date }>;
    recommendations: string[];
  }> {
    const nearbyRiskZones = this.riskZones
      .map(zone => ({
        zone,
        distance: this.calculateDistance(lat, lon, zone.polygon[0].lat, zone.polygon[0].lon)
      }))
      .filter(item => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Calculate risk score based on proximity to risk zones
    let riskScore = 0;
    nearbyRiskZones.forEach(item => {
      const proximityFactor = Math.max(0, (radius - item.distance) / radius);
      const riskMultiplier = item.zone.riskLevel === 'high' ? 3 : item.zone.riskLevel === 'medium' ? 2 : 1;
      riskScore += proximityFactor * riskMultiplier * 20;
    });

    // Generate mock recent incidents
    const recentIncidents = this.generateMockIncidents(lat, lon, radius);

    // Generate recommendations
    const recommendations = this.generateLocationRecommendations(riskScore, nearbyRiskZones);

    return {
      riskScore: Math.min(100, Math.round(riskScore)),
      nearbyRiskZones,
      recentIncidents,
      recommendations
    };
  }

  async getEvacuationAnalysis(lat: number, lon: number): Promise<{
    nearestRoute: {
      name: string;
      distance: number;
      estimatedTime: number;
      coordinates: Array<{ lat: number; lon: number }>;
    } | null;
    alternativeRoutes: Array<{
      name: string;
      distance: number;
      estimatedTime: number;
      capacity: number;
    }>;
    zoneCongestion: 'low' | 'medium' | 'high';
  }> {
    let nearestRoute = null;
    let minDistance = Infinity;
    const alternativeRoutes: any[] = [];

    // Find nearest evacuation routes
    for (const zone of this.riskZones) {
      for (const route of zone.evacuationRoutes) {
        const distance = this.calculateDistance(
          lat, lon,
          route.coordinates[0].lat, route.coordinates[0].lon
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestRoute = {
            name: route.name,
            distance,
            estimatedTime: Math.round(distance * 3), // 3 minutes per km estimate
            coordinates: route.coordinates
          };
        }

        if (distance <= 20) { // Within 20km
          alternativeRoutes.push({
            name: route.name,
            distance,
            estimatedTime: Math.round(distance * 3),
            capacity: route.capacity
          });
        }
      }
    }

    // Calculate zone congestion based on user activity
    const congestionLevel = this.calculateCongestion(lat, lon);

    return {
      nearestRoute,
      alternativeRoutes: alternativeRoutes.sort((a, b) => a.distance - b.distance).slice(0, 3),
      zoneCongestion: congestionLevel
    };
  }

  private performClustering(
    points: Array<{ lat: number; lon: number; timestamp: Date }>,
    k: number
  ): Array<{
    center: { lat: number; lon: number };
    points: Array<{ lat: number; lon: number; timestamp: Date }>;
    radius: number;
  }> {
    if (points.length === 0) return [];

    // Simple K-means clustering implementation
    const clusters: any[] = [];
    
    // Initialize cluster centers randomly
    for (let i = 0; i < k; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      clusters.push({
        center: { lat: randomPoint.lat, lon: randomPoint.lon },
        points: [],
        radius: 0
      });
    }

    // Assign points to nearest cluster and update centers
    for (let iteration = 0; iteration < 10; iteration++) {
      // Clear previous assignments
      clusters.forEach(cluster => cluster.points = []);

      // Assign each point to nearest cluster
      points.forEach(point => {
        let nearestCluster = clusters[0];
        let minDistance = this.calculateDistance(
          point.lat, point.lon,
          nearestCluster.center.lat, nearestCluster.center.lon
        );

        clusters.forEach(cluster => {
          const distance = this.calculateDistance(
            point.lat, point.lon,
            cluster.center.lat, cluster.center.lon
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = cluster;
          }
        });

        nearestCluster.points.push(point);
      });

      // Update cluster centers
      clusters.forEach(cluster => {
        if (cluster.points.length > 0) {
          const avgLat = cluster.points.reduce((sum: number, p: any) => sum + p.lat, 0) / cluster.points.length;
          const avgLon = cluster.points.reduce((sum: number, p: any) => sum + p.lon, 0) / cluster.points.length;
          cluster.center = { lat: avgLat, lon: avgLon };

          // Calculate cluster radius
          const maxDistance = Math.max(...cluster.points.map((p: any) => 
            this.calculateDistance(p.lat, p.lon, cluster.center.lat, cluster.center.lon)
          ));
          cluster.radius = maxDistance;
        }
      });
    }

    return clusters.filter(cluster => cluster.points.length > 0);
  }

  private calculateClusterRisk(cluster: any): 'low' | 'medium' | 'high' {
    const pointDensity = cluster.points.length / (Math.PI * cluster.radius * cluster.radius);
    
    if (pointDensity > 10) return 'high';
    if (pointDensity > 5) return 'medium';
    return 'low';
  }

  private calculateIntensity(lat: number, lon: number, dataType: string): number {
    let intensity = 0;

    // Calculate intensity based on proximity to risk zones
    this.riskZones.forEach(zone => {
      const distance = this.calculateDistance(lat, lon, zone.polygon[0].lat, zone.polygon[0].lon);
      const proximityFactor = Math.max(0, 1 - (distance / 20)); // 20km influence radius
      
      if (zone.riskLevel === 'high') intensity += proximityFactor * 0.8;
      else if (zone.riskLevel === 'medium') intensity += proximityFactor * 0.5;
      else intensity += proximityFactor * 0.2;
    });

    // Add random variation based on data type
    if (dataType === 'incidents') {
      intensity *= (0.8 + Math.random() * 0.4);
    } else if (dataType === 'user_activity') {
      intensity *= (0.5 + Math.random() * 0.8);
    }

    return Math.min(1, intensity);
  }

  private getRandomDataType(filter: string): 'incident' | 'user_activity' | 'sensor_alert' | 'risk_prediction' {
    if (filter === 'incidents') return 'incident';
    if (filter === 'user_activity') return 'user_activity';
    
    const types: Array<'incident' | 'user_activity' | 'sensor_alert' | 'risk_prediction'> = 
      ['incident', 'user_activity', 'sensor_alert', 'risk_prediction'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private generateMockIncidents(lat: number, lon: number, radius: number) {
    const incidents = [];
    const incidentTypes = ['Coastal erosion', 'Flooding', 'Storm damage', 'Illegal mining', 'Marine pollution'];
    
    for (let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
      incidents.push({
        type: incidentTypes[Math.floor(Math.random() * incidentTypes.length)],
        distance: Math.random() * radius,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }
    
    return incidents.sort((a, b) => a.distance - b.distance);
  }

  private generateLocationRecommendations(riskScore: number, nearbyZones: any[]): string[] {
    const recommendations = [];
    
    if (riskScore > 70) {
      recommendations.push("High risk area - consider relocation during storm season");
      recommendations.push("Maintain emergency kit and evacuation plan");
    } else if (riskScore > 40) {
      recommendations.push("Moderate risk - stay informed about weather conditions");
      recommendations.push("Review and practice evacuation procedures");
    } else {
      recommendations.push("Low risk area - maintain standard coastal preparedness");
    }
    
    if (nearbyZones.length > 0) {
      recommendations.push(`Monitor conditions in nearby ${nearbyZones[0].zone.name}`);
    }
    
    recommendations.push("Install BlueGuard mobile alerts for real-time updates");
    
    return recommendations;
  }

  private calculateCongestion(lat: number, lon: number): 'low' | 'medium' | 'high' {
    // Mock congestion calculation based on location
    const baseScore = Math.random();
    
    // Higher congestion near city centers (simplified)
    if (Math.abs(lat - 25.7617) < 0.1 && Math.abs(lon + 80.1918) < 0.1) { // Miami area
      return baseScore > 0.3 ? 'high' : 'medium';
    }
    
    return baseScore > 0.7 ? 'medium' : 'low';
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async getRegionalStatistics(region: string): Promise<{
    totalIncidents: number;
    riskTrend: 'increasing' | 'stable' | 'decreasing';
    populationAtRisk: number;
    economicImpact: number;
    lastUpdate: Date;
  }> {
    // Mock regional statistics
    return {
      totalIncidents: Math.floor(Math.random() * 100) + 50,
      riskTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as any,
      populationAtRisk: Math.floor(Math.random() * 50000) + 10000,
      economicImpact: Math.random() * 10000000 + 1000000,
      lastUpdate: new Date()
    };
  }
}

export const geoAnalyticsService = new GeoAnalyticsService();
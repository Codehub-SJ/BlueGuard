// Advanced Weather and Tide API Service
// Uses mock data but structured for easy API integration

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  visibility: number;
  uvIndex: number;
  description: string;
}

interface TideData {
  tideLevel: number;
  tideType: 'high' | 'low' | 'rising' | 'falling';
  nextTideTime: Date;
  moonPhase: number;
}

interface OceanData {
  waveHeight: number;
  swellPeriod: number;
  swellDirection: number;
  seaTemperature: number;
}

export class WeatherService {
  private locations = [
    { name: "New York Harbor", lat: 40.7128, lon: -74.0060 },
    { name: "Miami Beach", lat: 25.7617, lon: -80.1918 },
    { name: "San Francisco Bay", lat: 37.7749, lon: -122.4194 },
    { name: "Boston Harbor", lat: 42.3601, lon: -71.0589 },
  ];

  // Simulated OpenWeatherMap API call
  async getWeatherData(lat: number, lon: number): Promise<WeatherData> {
    // In real implementation: await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    
    const baseTemp = 20 + Math.sin(Date.now() / 1000000) * 10;
    
    return {
      temperature: baseTemp + (Math.random() - 0.5) * 5,
      humidity: 60 + Math.random() * 30,
      pressure: 1013 + (Math.random() - 0.5) * 20,
      windSpeed: 5 + Math.random() * 15,
      visibility: 8 + Math.random() * 7,
      uvIndex: Math.max(0, Math.min(11, 3 + Math.random() * 5)),
      description: this.getWeatherDescription()
    };
  }

  // Simulated NOAA Tide API call
  async getTideData(lat: number, lon: number): Promise<TideData> {
    // In real implementation: await fetch(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=${stationId}`)
    
    const tideValue = Math.sin((Date.now() / 43200000) * Math.PI) * 2; // 12-hour cycle
    
    return {
      tideLevel: tideValue,
      tideType: tideValue > 1 ? 'high' : tideValue < -1 ? 'low' : tideValue > 0 ? 'rising' : 'falling',
      nextTideTime: new Date(Date.now() + (6 * 60 * 60 * 1000)), // 6 hours from now
      moonPhase: (Date.now() / (29.5 * 24 * 60 * 60 * 1000)) % 1 // Lunar cycle
    };
  }

  async getOceanData(lat: number, lon: number): Promise<OceanData> {
    const waveBase = 1.5 + Math.sin(Date.now() / 3600000) * 1.5; // Hourly variation
    
    return {
      waveHeight: Math.max(0.3, waveBase + Math.random() * 2),
      swellPeriod: 8 + Math.random() * 6,
      swellDirection: Math.random() * 360,
      seaTemperature: 18 + Math.random() * 8
    };
  }

  async getLocationBasedData(userLat?: number, userLon?: number) {
    // Find nearest location or use default
    const location = userLat && userLon 
      ? this.findNearestLocation(userLat, userLon)
      : this.locations[0];

    const [weather, tide, ocean] = await Promise.all([
      this.getWeatherData(location.lat, location.lon),
      this.getTideData(location.lat, location.lon),
      this.getOceanData(location.lat, location.lon)
    ]);

    return {
      location: location.name,
      latitude: location.lat,
      longitude: location.lon,
      weather,
      tide,
      ocean,
      timestamp: new Date()
    };
  }

  private findNearestLocation(lat: number, lon: number) {
    let nearest = this.locations[0];
    let minDistance = this.calculateDistance(lat, lon, nearest.lat, nearest.lon);

    for (const location of this.locations) {
      const distance = this.calculateDistance(lat, lon, location.lat, location.lon);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = location;
      }
    }

    return nearest;
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

  private getWeatherDescription(): string {
    const conditions = [
      "Clear skies", "Partly cloudy", "Overcast", "Light rain",
      "Moderate rain", "Thunderstorms", "Foggy", "Windy"
    ];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }
}

export const weatherService = new WeatherService();
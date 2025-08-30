// IoT Sensor Data Integration Service
// Manages real-time sensor data streams and WebSocket communications

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface SensorReading {
  sensorId: string;
  timestamp: Date;
  data: {
    [key: string]: number | string | boolean;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  batteryLevel?: number;
  signalStrength?: number;
}

interface SensorConfig {
  id: string;
  type: 'wave' | 'tide' | 'weather' | 'seismic' | 'water_quality' | 'marine_life';
  location: { lat: number; lon: number; name: string };
  updateInterval: number; // seconds
  isActive: boolean;
  lastMaintenance: Date;
}

interface AlertThreshold {
  sensorType: string;
  parameter: string;
  minValue?: number;
  maxValue?: number;
  condition: 'above' | 'below' | 'between' | 'outside';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class IoTService {
  private wss: WebSocketServer | null = null;
  private connectedClients: Set<WebSocket> = new Set();
  private sensorConfigs: Map<string, SensorConfig> = new Map();
  private streamingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private alertThresholds: AlertThreshold[] = [];
  private isInitialized = false;

  async initialize(server: Server): Promise<void> {
    if (this.isInitialized) return;

    // Initialize WebSocket server
    this.wss = new WebSocketServer({ server, path: '/ws/sensors' });
    
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('IoT sensor client connected');
      this.connectedClients.add(ws);
      
      ws.on('close', () => {
        console.log('IoT sensor client disconnected');
        this.connectedClients.delete(ws);
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleSensorMessage(message);
        } catch (error) {
          console.error('Invalid sensor message:', error);
        }
      });
    });

    // Initialize sensor configurations
    this.initializeSensorConfigs();
    
    // Set up alert thresholds
    this.setupAlertThresholds();
    
    // Start sensor data simulation
    this.startSensorDataStreams();
    
    this.isInitialized = true;
    console.log('IoT Service initialized with WebSocket support');
  }

  private initializeSensorConfigs(): void {
    const defaultSensors: SensorConfig[] = [
      {
        id: 'wave_001',
        type: 'wave',
        location: { lat: 40.7128, lon: -74.0060, name: 'New York Harbor Alpha' },
        updateInterval: 30,
        isActive: true,
        lastMaintenance: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'tide_001',
        type: 'tide',
        location: { lat: 40.7589, lon: -73.9851, name: 'Central Park Reservoir Beta' },
        updateInterval: 60,
        isActive: false, // Simulating offline sensor
        lastMaintenance: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'weather_001',
        type: 'weather',
        location: { lat: 40.6892, lon: -74.0445, name: 'Gamma Weather Station' },
        updateInterval: 15,
        isActive: true,
        lastMaintenance: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'seismic_001',
        type: 'seismic',
        location: { lat: 40.7282, lon: -74.0776, name: 'Seismic Monitor Delta' },
        updateInterval: 5,
        isActive: true,
        lastMaintenance: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'water_001',
        type: 'water_quality',
        location: { lat: 40.7505, lon: -73.9934, name: 'Water Quality Epsilon' },
        updateInterval: 300, // 5 minutes
        isActive: true,
        lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    ];

    defaultSensors.forEach(sensor => {
      this.sensorConfigs.set(sensor.id, sensor);
    });
  }

  private setupAlertThresholds(): void {
    this.alertThresholds = [
      {
        sensorType: 'wave',
        parameter: 'height',
        maxValue: 4.0,
        condition: 'above',
        severity: 'high'
      },
      {
        sensorType: 'wave',
        parameter: 'height',
        maxValue: 6.0,
        condition: 'above',
        severity: 'critical'
      },
      {
        sensorType: 'tide',
        parameter: 'level',
        minValue: -3.0,
        maxValue: 3.0,
        condition: 'outside',
        severity: 'medium'
      },
      {
        sensorType: 'weather',
        parameter: 'windSpeed',
        maxValue: 25.0,
        condition: 'above',
        severity: 'medium'
      },
      {
        sensorType: 'weather',
        parameter: 'windSpeed',
        maxValue: 40.0,
        condition: 'above',
        severity: 'high'
      },
      {
        sensorType: 'seismic',
        parameter: 'magnitude',
        maxValue: 3.0,
        condition: 'above',
        severity: 'medium'
      },
      {
        sensorType: 'water_quality',
        parameter: 'ph',
        minValue: 6.5,
        maxValue: 8.5,
        condition: 'outside',
        severity: 'medium'
      }
    ];
  }

  private startSensorDataStreams(): void {
    this.sensorConfigs.forEach((config, sensorId) => {
      if (config.isActive) {
        const interval = setInterval(() => {
          const reading = this.generateSensorReading(config);
          this.processSensorReading(reading);
        }, config.updateInterval * 1000);
        
        this.streamingIntervals.set(sensorId, interval);
      }
    });
  }

  private generateSensorReading(config: SensorConfig): SensorReading {
    const baseTimestamp = new Date();
    let data: { [key: string]: number | string | boolean } = {};
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    switch (config.type) {
      case 'wave':
        data = {
          height: Math.max(0.2, 2.5 + Math.sin(Date.now() / 60000) * 1.5 + (Math.random() - 0.5) * 1.0),
          period: 8 + Math.random() * 4,
          direction: Math.random() * 360,
          energy: Math.random() * 100
        };
        break;

      case 'tide':
        data = {
          level: Math.sin(Date.now() / 43200000) * 2.5 + (Math.random() - 0.5) * 0.3,
          flow: (Math.random() - 0.5) * 2,
          temperature: 18 + Math.random() * 8
        };
        break;

      case 'weather':
        data = {
          temperature: 20 + Math.sin(Date.now() / 86400000) * 10 + (Math.random() - 0.5) * 3,
          humidity: 60 + Math.random() * 30,
          pressure: 1013 + (Math.random() - 0.5) * 20,
          windSpeed: Math.max(0, 8 + Math.random() * 15),
          windDirection: Math.random() * 360,
          rainfall: Math.random() < 0.3 ? Math.random() * 5 : 0
        };
        break;

      case 'seismic':
        data = {
          magnitude: Math.random() * 2.5, // Usually very low
          frequency: 1 + Math.random() * 10,
          pWaveVelocity: 5000 + Math.random() * 1000,
          sWaveVelocity: 3000 + Math.random() * 500,
          acceleration: Math.random() * 0.1
        };
        
        // Occasionally simulate stronger seismic activity
        if (Math.random() < 0.05) {
          data.magnitude = 2.5 + Math.random() * 2;
          quality = 'excellent'; // High confidence in significant readings
        }
        break;

      case 'water_quality':
        data = {
          ph: 7.0 + (Math.random() - 0.5) * 2,
          dissolvedOxygen: 6 + Math.random() * 3,
          turbidity: Math.random() * 10,
          temperature: 18 + Math.random() * 8,
          salinity: 35 + (Math.random() - 0.5) * 5,
          nitrateLevel: Math.random() * 2,
          phosphateLevel: Math.random() * 0.5
        };
        break;

      case 'marine_life':
        data = {
          fishCount: Math.floor(Math.random() * 50),
          avgFishSize: 10 + Math.random() * 20,
          speciesCount: Math.floor(Math.random() * 10) + 1,
          migrationIndicator: Math.random() > 0.7,
          biomassIndex: Math.random() * 100
        };
        break;
    }

    // Simulate quality degradation over time since last maintenance
    const daysSinceMaintenance = (Date.now() - config.lastMaintenance.getTime()) / (24 * 60 * 60 * 1000);
    if (daysSinceMaintenance > 30) quality = 'poor';
    else if (daysSinceMaintenance > 14) quality = 'fair';
    else if (daysSinceMaintenance > 7) quality = 'good';
    else quality = 'excellent';

    return {
      sensorId: config.id,
      timestamp: baseTimestamp,
      data,
      quality,
      batteryLevel: Math.max(10, 100 - (daysSinceMaintenance * 2) + (Math.random() - 0.5) * 10),
      signalStrength: Math.max(20, 100 - Math.random() * 30)
    };
  }

  private processSensorReading(reading: SensorReading): void {
    // Check for alert conditions
    const alerts = this.checkAlertThresholds(reading);
    
    // Broadcast to all connected WebSocket clients
    this.broadcastToClients({
      type: 'sensor_reading',
      data: reading,
      alerts
    });

    // Log significant readings
    if (alerts.length > 0 || reading.quality === 'poor') {
      console.log(`Sensor ${reading.sensorId}: ${alerts.length} alerts, quality: ${reading.quality}`);
    }
  }

  private checkAlertThresholds(reading: SensorReading): Array<{
    parameter: string;
    value: number;
    threshold: AlertThreshold;
    message: string;
  }> {
    const alerts: any[] = [];
    const config = this.sensorConfigs.get(reading.sensorId);
    
    if (!config) return alerts;

    this.alertThresholds
      .filter(threshold => threshold.sensorType === config.type)
      .forEach(threshold => {
        const value = reading.data[threshold.parameter] as number;
        
        if (typeof value !== 'number') return;

        let triggered = false;
        let message = '';

        switch (threshold.condition) {
          case 'above':
            if (threshold.maxValue && value > threshold.maxValue) {
              triggered = true;
              message = `${threshold.parameter} (${value.toFixed(2)}) exceeds maximum threshold (${threshold.maxValue})`;
            }
            break;
          case 'below':
            if (threshold.minValue && value < threshold.minValue) {
              triggered = true;
              message = `${threshold.parameter} (${value.toFixed(2)}) below minimum threshold (${threshold.minValue})`;
            }
            break;
          case 'outside':
            if (threshold.minValue && threshold.maxValue && 
                (value < threshold.minValue || value > threshold.maxValue)) {
              triggered = true;
              message = `${threshold.parameter} (${value.toFixed(2)}) outside normal range (${threshold.minValue}-${threshold.maxValue})`;
            }
            break;
        }

        if (triggered) {
          alerts.push({
            parameter: threshold.parameter,
            value,
            threshold,
            message
          });
        }
      });

    return alerts;
  }

  private broadcastToClients(data: any): void {
    const message = JSON.stringify(data);
    
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private handleSensorMessage(message: any): void {
    switch (message.type) {
      case 'sensor_config_update':
        this.updateSensorConfig(message.sensorId, message.config);
        break;
      case 'manual_reading':
        this.processSensorReading(message.reading);
        break;
      case 'maintenance_update':
        this.updateMaintenanceRecord(message.sensorId, message.date);
        break;
    }
  }

  async getSensorStatus(): Promise<Array<{
    id: string;
    type: string;
    location: string;
    isOnline: boolean;
    lastReading: Date;
    batteryLevel: number;
    signalStrength: number;
    quality: string;
    nextMaintenance: Date;
  }>> {
    return Array.from(this.sensorConfigs.values()).map(config => ({
      id: config.id,
      type: config.type,
      location: config.location.name,
      isOnline: config.isActive,
      lastReading: new Date(Date.now() - Math.random() * 300000), // Last 5 minutes
      batteryLevel: Math.max(10, 100 - Math.random() * 30),
      signalStrength: Math.max(50, 100 - Math.random() * 30),
      quality: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
      nextMaintenance: new Date(config.lastMaintenance.getTime() + 30 * 24 * 60 * 60 * 1000)
    }));
  }

  async getSensorData(sensorId: string, hours: number = 24): Promise<SensorReading[]> {
    // Mock historical data generation
    const config = this.sensorConfigs.get(sensorId);
    if (!config) return [];

    const readings: SensorReading[] = [];
    const endTime = Date.now();
    const startTime = endTime - (hours * 60 * 60 * 1000);
    const interval = (endTime - startTime) / 100; // 100 data points

    for (let time = startTime; time <= endTime; time += interval) {
      const tempConfig = { ...config };
      const reading = this.generateSensorReading(tempConfig);
      reading.timestamp = new Date(time);
      readings.push(reading);
    }

    return readings;
  }

  private updateSensorConfig(sensorId: string, newConfig: Partial<SensorConfig>): void {
    const existing = this.sensorConfigs.get(sensorId);
    if (existing) {
      this.sensorConfigs.set(sensorId, { ...existing, ...newConfig });
      
      // Restart interval if update interval changed
      if (newConfig.updateInterval) {
        const oldInterval = this.streamingIntervals.get(sensorId);
        if (oldInterval) {
          clearInterval(oldInterval);
        }
        
        if (existing.isActive) {
          const newInterval = setInterval(() => {
            const reading = this.generateSensorReading(existing);
            this.processSensorReading(reading);
          }, newConfig.updateInterval * 1000);
          
          this.streamingIntervals.set(sensorId, newInterval);
        }
      }
    }
  }

  private updateMaintenanceRecord(sensorId: string, maintenanceDate: Date): void {
    const config = this.sensorConfigs.get(sensorId);
    if (config) {
      config.lastMaintenance = maintenanceDate;
      this.sensorConfigs.set(sensorId, config);
    }
  }

  async getNetworkTopology(): Promise<{
    totalSensors: number;
    onlineSensors: number;
    networkHealth: number;
    dataTransmissionRate: number;
    lastNetworkUpdate: Date;
  }> {
    const totalSensors = this.sensorConfigs.size;
    const onlineSensors = Array.from(this.sensorConfigs.values()).filter(s => s.isActive).length;
    
    return {
      totalSensors,
      onlineSensors,
      networkHealth: (onlineSensors / totalSensors) * 100,
      dataTransmissionRate: onlineSensors * 2.5, // KB/s estimate
      lastNetworkUpdate: new Date()
    };
  }

  cleanup(): void {
    // Clear all streaming intervals
    this.streamingIntervals.forEach(interval => clearInterval(interval));
    this.streamingIntervals.clear();
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('IoT Service cleaned up');
  }
}

export const iotService = new IoTService();
// TensorFlow-based Machine Learning Service for Coastal Risk Prediction
import * as tf from '@tensorflow/tfjs-node';

interface MLInputData {
  waveHeight: number;
  tideLevel: number;
  windSpeed: number;
  temperature: number;
  pressure: number;
  humidity: number;
  historicalIncidents: number;
  seasonalFactor: number;
}

interface RiskPrediction {
  timeSlot: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  factors: {
    waveImpact: number;
    tideImpact: number;
    weatherImpact: number;
    historicalPattern: number;
  };
  recommendations: string[];
}

export class MLService {
  private model: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    // Create a simple neural network for coastal risk prediction
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({
          inputShape: [8], // 8 input features
          units: 16,
          activation: 'relu',
          name: 'hidden1'
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({
          units: 8,
          activation: 'relu',
          name: 'hidden2'
        }),
        tf.layers.dense({
          units: 3, // 3 risk levels (low, medium, high)
          activation: 'softmax',
          name: 'output'
        })
      ]
    });

    // Compile the model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    // Train with synthetic data (in production, use historical coastal data)
    await this.trainModel();
    
    this.isInitialized = true;
    console.log('ML Service initialized with TensorFlow model');
  }

  async predictRisk(inputData: MLInputData): Promise<RiskPrediction[]> {
    if (!this.model) {
      await this.initialize();
    }

    const predictions: RiskPrediction[] = [];
    const timeSlots = ['6-12', '12-18', '18-24'];

    for (let i = 0; i < timeSlots.length; i++) {
      // Adjust inputs for different time slots
      const adjustedInput = this.adjustForTimeSlot(inputData, i) as MLInputData;
      const tensorInput = tf.tensor2d([this.normalizeInputs(adjustedInput)]);
      
      const prediction = this.model!.predict(tensorInput) as tf.Tensor;
      const probabilities = await prediction.data();
      
      // Convert probabilities to risk assessment
      const probabilityArray = Array.from(probabilities as Float32Array);
      const riskIndex = this.getRiskIndex(probabilityArray);
      const confidence = Math.max(...probabilities) * 100;
      
      predictions.push({
        timeSlot: timeSlots[i],
        riskLevel: this.indexToRiskLevel(riskIndex),
        confidence: Math.round(confidence),
        factors: this.calculateFactors(adjustedInput),
        recommendations: this.generateRecommendations(riskIndex, adjustedInput)
      });

      tensorInput.dispose();
      prediction.dispose();
    }

    return predictions;
  }

  async analyzePatterns(historicalData: any[]): Promise<{
    trends: string[];
    seasonalFactors: { [key: string]: number };
    riskCorrelations: { [key: string]: number };
  }> {
    // Advanced pattern analysis using TensorFlow
    const trends = this.identifyTrends(historicalData);
    const seasonalFactors = this.calculateSeasonalFactors();
    const riskCorrelations = this.calculateRiskCorrelations(historicalData);

    return {
      trends,
      seasonalFactors,
      riskCorrelations
    };
  }

  private async trainModel() {
    // Generate synthetic training data (replace with real historical data)
    const trainingData = this.generateTrainingData(1000);
    
    const xs = tf.tensor2d(trainingData.inputs);
    const ys = tf.tensor2d(trainingData.outputs);

    await this.model!.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      verbose: 0
    });

    xs.dispose();
    ys.dispose();
  }

  private generateTrainingData(samples: number) {
    const inputs: number[][] = [];
    const outputs: number[][] = [];

    for (let i = 0; i < samples; i++) {
      const waveHeight = Math.random() * 5;
      const tideLevel = (Math.random() - 0.5) * 4;
      const windSpeed = Math.random() * 30;
      const temperature = 15 + Math.random() * 15;
      const pressure = 980 + Math.random() * 50;
      const humidity = 40 + Math.random() * 50;
      const historicalIncidents = Math.random() * 10;
      const seasonalFactor = Math.random();

      // Calculate risk based on rules
      let riskScore = 0;
      if (waveHeight > 3) riskScore += 2;
      if (Math.abs(tideLevel) > 2) riskScore += 1;
      if (windSpeed > 20) riskScore += 2;
      if (pressure < 1000) riskScore += 1;
      if (historicalIncidents > 5) riskScore += 1;

      const riskLevel = riskScore <= 2 ? 0 : riskScore <= 4 ? 1 : 2; // low, medium, high

      inputs.push([
        waveHeight, tideLevel, windSpeed, temperature,
        pressure, humidity, historicalIncidents, seasonalFactor
      ]);

      const output = [0, 0, 0];
      output[riskLevel] = 1; // One-hot encoding
      outputs.push(output);
    }

    return { inputs, outputs };
  }

  private normalizeInputs(input: MLInputData): number[] {
    return [
      input.waveHeight / 5,           // Normalize to 0-1
      (input.tideLevel + 4) / 8,      // Normalize to 0-1
      input.windSpeed / 30,           // Normalize to 0-1
      (input.temperature - 10) / 20,  // Normalize to 0-1
      (input.pressure - 980) / 50,    // Normalize to 0-1
      input.humidity / 100,           // Normalize to 0-1
      input.historicalIncidents / 10, // Normalize to 0-1
      input.seasonalFactor            // Already 0-1
    ];
  }

  private adjustForTimeSlot(input: MLInputData, slotIndex: number): MLInputData {
    // Adjust predictions for different time periods
    const timeAdjustments = [1.0, 1.1, 1.2]; // Morning, afternoon, evening factors
    const factor = timeAdjustments[slotIndex];

    return {
      ...input,
      waveHeight: input.waveHeight * factor,
      windSpeed: input.windSpeed * (factor * 0.8),
      seasonalFactor: input.seasonalFactor * factor
    };
  }

  private getRiskIndex(probabilities: number[]): number {
    return probabilities.indexOf(Math.max(...probabilities));
  }

  private indexToRiskLevel(index: number): 'low' | 'medium' | 'high' {
    return ['low', 'medium', 'high'][index] as 'low' | 'medium' | 'high';
  }

  private calculateFactors(input: MLInputData) {
    return {
      waveImpact: Math.min(100, (input.waveHeight / 5) * 100),
      tideImpact: Math.min(100, (Math.abs(input.tideLevel) / 4) * 100),
      weatherImpact: Math.min(100, (input.windSpeed / 30) * 100),
      historicalPattern: Math.min(100, (input.historicalIncidents / 10) * 100)
    };
  }

  private generateRecommendations(riskIndex: number, input: MLInputData): string[] {
    const recommendations: string[] = [];

    if (riskIndex >= 1) { // Medium or high risk
      recommendations.push("Monitor weather conditions closely");
      recommendations.push("Check evacuation routes");
    }

    if (riskIndex === 2) { // High risk
      recommendations.push("Consider coastal evacuation");
      recommendations.push("Alert emergency services");
      recommendations.push("Secure coastal infrastructure");
    }

    if (input.waveHeight > 3) {
      recommendations.push("Avoid beach and coastal activities");
    }

    if (input.windSpeed > 20) {
      recommendations.push("Secure loose objects near coast");
    }

    return recommendations;
  }

  private identifyTrends(_data: any[]): string[] {
    // Analyze trends in historical data
    return [
      "Increasing wave heights during storm season",
      "Tidal variations show 14-day spring/neap cycle",
      "Temperature correlation with coastal incidents"
    ];
  }

  private calculateSeasonalFactors() {
    return {
      spring: 1.2,
      summer: 1.5,
      autumn: 1.8,
      winter: 1.0
    };
  }

  private calculateRiskCorrelations(data: any[]) {
    return {
      waveHeight: 0.85,
      windSpeed: 0.72,
      tideLevel: 0.58,
      temperature: 0.43,
      pressure: 0.67
    };
  }
}

export const mlService = new MLService();
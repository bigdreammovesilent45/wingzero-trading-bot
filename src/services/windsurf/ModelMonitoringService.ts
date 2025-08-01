import { EventEmitter } from 'events';
import { Histogram, Counter, Gauge, register } from 'prom-client';
import * as tf from '@tensorflow/tfjs';
import * as ss from 'simple-statistics';

// Types and Interfaces
export interface Prediction {
  modelId: string;
  modelVersion: string;
  timestamp: Date;
  input: number[] | tf.Tensor;
  output: number | number[] | tf.Tensor;
  confidence?: number;
  processingTime: number;
}

export interface ModelData {
  predictions: Prediction[];
  actuals?: number[];
  features: FeatureData[];
  performanceMetrics: PerformanceMetrics[];
}

export interface FeatureData {
  name: string;
  values: number[];
  timestamp: Date;
}

export interface PerformanceMetrics {
  timestamp: Date;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  mse?: number;
  mae?: number;
  latency: LatencyMetrics;
  throughput: number;
}

export interface LatencyMetrics {
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  mean: number;
}

export interface DriftAnalysis {
  modelId: string;
  timestamp: Date;
  driftDetected: boolean;
  details: DriftDetails;
  recommendations: string[];
}

export interface DriftDetails {
  dataDistributionDrift: DistributionDrift;
  predictionDrift: PredictionDrift;
  performanceDrift: PerformanceDrift;
  featureDrift: FeatureDrift[];
}

export interface DistributionDrift {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  affectedFeatures: string[];
  statistics: DriftStatistics[];
}

export interface PredictionDrift {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  baselineMean: number;
  currentMean: number;
  deviation: number;
}

export interface PerformanceDrift {
  detected: boolean;
  severity: 'low' | 'medium' | 'high';
  metrics: {
    accuracy?: { baseline: number; current: number; delta: number };
    latency?: { baseline: number; current: number; delta: number };
    errorRate?: { baseline: number; current: number; delta: number };
  };
}

export interface FeatureDrift {
  featureName: string;
  driftScore: number;
  pValue: number;
  detected: boolean;
}

export interface DriftStatistics {
  test: string;
  statistic: number;
  pValue: number;
  threshold: number;
}

export interface Alert {
  id: string;
  modelId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  metadata?: any;
}

export type AlertType = 
  | 'drift_detected'
  | 'performance_degradation'
  | 'error_spike'
  | 'latency_increase'
  | 'throughput_decrease'
  | 'model_failure';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ModelReport {
  modelId: string;
  period: { start: Date; end: Date };
  summary: ReportSummary;
  performanceAnalysis: PerformanceAnalysis;
  driftAnalysis: DriftAnalysis[];
  alerts: Alert[];
  recommendations: string[];
}

export interface ReportSummary {
  totalPredictions: number;
  averageLatency: number;
  errorRate: number;
  uptime: number;
  driftIncidents: number;
}

export interface PerformanceAnalysis {
  accuracyTrend: TrendData[];
  latencyTrend: TrendData[];
  throughputTrend: TrendData[];
  resourceUsage: ResourceUsage;
}

export interface TrendData {
  timestamp: Date;
  value: number;
}

export interface ResourceUsage {
  cpu: { mean: number; peak: number };
  memory: { mean: number; peak: number };
  gpu?: { mean: number; peak: number };
}

export interface TimeWindow {
  start: Date;
  end: Date;
  duration: number;
}

export interface ReportPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  customPeriod?: { start: Date; end: Date };
}

// Drift Detection Algorithms
interface DriftAlgorithm {
  detect(reference: number[], current: number[]): DriftStatistics;
}

class KSTestAlgorithm implements DriftAlgorithm {
  detect(reference: number[], current: number[]): DriftStatistics {
    const { statistic, pValue } = this.kolmogorovSmirnovTest(reference, current);
    return {
      test: 'Kolmogorov-Smirnov',
      statistic,
      pValue,
      threshold: 0.05
    };
  }

  private kolmogorovSmirnovTest(sample1: number[], sample2: number[]): { statistic: number; pValue: number } {
    // Simplified KS test implementation
    const n1 = sample1.length;
    const n2 = sample2.length;
    const sorted1 = [...sample1].sort((a, b) => a - b);
    const sorted2 = [...sample2].sort((a, b) => a - b);
    
    let maxDiff = 0;
    let i = 0, j = 0;
    
    while (i < n1 && j < n2) {
      const diff = Math.abs(i / n1 - j / n2);
      maxDiff = Math.max(maxDiff, diff);
      
      if (sorted1[i] < sorted2[j]) {
        i++;
      } else {
        j++;
      }
    }
    
    const statistic = maxDiff;
    const pValue = this.calculateKSPValue(statistic, n1, n2);
    
    return { statistic, pValue };
  }

  private calculateKSPValue(d: number, n1: number, n2: number): number {
    const n = n1 * n2 / (n1 + n2);
    const lambda = Math.sqrt(n) * d;
    
    // Simplified p-value calculation
    return 2 * Math.exp(-2 * lambda * lambda);
  }
}

class PSIAlgorithm implements DriftAlgorithm {
  detect(reference: number[], current: number[]): DriftStatistics {
    const psi = this.calculatePSI(reference, current);
    return {
      test: 'Population Stability Index',
      statistic: psi,
      pValue: psi > 0.2 ? 0.01 : 0.1, // Simplified
      threshold: 0.2
    };
  }

  private calculatePSI(reference: number[], current: number[], bins: number = 10): number {
    const refBins = this.createBins(reference, bins);
    const currBins = this.createBins(current, bins, refBins.edges);
    
    let psi = 0;
    for (let i = 0; i < bins; i++) {
      const refPct = refBins.counts[i] / reference.length;
      const currPct = currBins.counts[i] / current.length;
      
      if (refPct > 0 && currPct > 0) {
        psi += (currPct - refPct) * Math.log(currPct / refPct);
      }
    }
    
    return psi;
  }

  private createBins(data: number[], bins: number, edges?: number[]): { counts: number[]; edges: number[] } {
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    if (!edges) {
      edges = [];
      const step = (max - min) / bins;
      for (let i = 0; i <= bins; i++) {
        edges.push(min + i * step);
      }
    }
    
    const counts = new Array(bins).fill(0);
    for (const value of data) {
      const bin = Math.min(Math.floor((value - min) / ((max - min) / bins)), bins - 1);
      counts[bin]++;
    }
    
    return { counts, edges };
  }
}

// Main Model Monitoring Service
export class ModelMonitoringService extends EventEmitter {
  private metricsCollector: MetricsCollector;
  private driftDetector: DriftDetector;
  private alertManager: AlertManager;
  private dataStore: MonitoringDataStore;

  constructor() {
    super();
    this.metricsCollector = new MetricsCollector();
    this.driftDetector = new DriftDetector();
    this.alertManager = new AlertManager(this);
    this.dataStore = new MonitoringDataStore();
  }

  /**
   * Track a model prediction
   */
  async trackPrediction(
    modelId: string,
    prediction: Prediction,
    actual?: number
  ): Promise<void> {
    try {
      // Store prediction
      await this.dataStore.storePrediction(modelId, prediction);

      // Collect metrics
      this.metricsCollector.collectPredictionMetrics(modelId, prediction);

      // Update accuracy if actual value provided
      if (actual !== undefined) {
        await this.updateAccuracy(modelId, prediction, actual);
      }

      // Check for anomalies
      const anomaly = await this.detectAnomaly(modelId, prediction);
      if (anomaly) {
        this.alertManager.createAlert({
          modelId,
          type: 'model_failure',
          severity: 'warning',
          message: `Anomalous prediction detected: ${anomaly.reason}`,
          metadata: { prediction, anomaly }
        });
      }

      this.emit('prediction:tracked', { modelId, prediction, actual });
    } catch (error) {
      this.emit('prediction:tracking:error', { modelId, prediction, error });
      throw error;
    }
  }

  /**
   * Detect drift in model performance
   */
  async detectDrift(
    modelId: string,
    window: TimeWindow
  ): Promise<DriftAnalysis> {
    try {
      // Get model data for the time window
      const data = await this.dataStore.getModelData(modelId, window);

      // Perform drift analysis
      const analysis = await this.driftDetector.analyze(modelId, data);

      // Create alerts if drift detected
      if (analysis.driftDetected) {
        this.alertManager.createAlert({
          modelId,
          type: 'drift_detected',
          severity: this.getDriftSeverity(analysis),
          message: `Model drift detected: ${this.summarizeDrift(analysis)}`,
          metadata: { analysis }
        });
      }

      // Store analysis results
      await this.dataStore.storeDriftAnalysis(modelId, analysis);

      this.emit('drift:analyzed', { modelId, analysis });
      return analysis;
    } catch (error) {
      this.emit('drift:analysis:error', { modelId, window, error });
      throw error;
    }
  }

  /**
   * Check alerts for a model
   */
  async checkAlerts(modelId: string): Promise<Alert[]> {
    const alerts = await this.alertManager.getActiveAlerts(modelId);
    
    // Check for new alert conditions
    const performanceAlerts = await this.checkPerformanceAlerts(modelId);
    const latencyAlerts = await this.checkLatencyAlerts(modelId);
    const errorAlerts = await this.checkErrorAlerts(modelId);

    return [...alerts, ...performanceAlerts, ...latencyAlerts, ...errorAlerts];
  }

  /**
   * Generate comprehensive model report
   */
  async generateReport(
    modelId: string,
    period: ReportPeriod
  ): Promise<ModelReport> {
    const timeRange = this.getTimeRange(period);
    
    // Gather all data
    const [
      predictions,
      performanceData,
      driftAnalyses,
      alerts
    ] = await Promise.all([
      this.dataStore.getPredictions(modelId, timeRange),
      this.dataStore.getPerformanceMetrics(modelId, timeRange),
      this.dataStore.getDriftAnalyses(modelId, timeRange),
      this.alertManager.getAlerts(modelId, timeRange)
    ]);

    // Calculate summary statistics
    const summary = this.calculateSummary(predictions, performanceData, driftAnalyses);

    // Analyze performance trends
    const performanceAnalysis = this.analyzePerformance(performanceData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      summary,
      performanceAnalysis,
      driftAnalyses
    );

    const report: ModelReport = {
      modelId,
      period: timeRange,
      summary,
      performanceAnalysis,
      driftAnalysis: driftAnalyses,
      alerts,
      recommendations
    };

    this.emit('report:generated', { modelId, report });
    return report;
  }

  /**
   * Update model accuracy with actual values
   */
  private async updateAccuracy(
    modelId: string,
    prediction: Prediction,
    actual: number
  ): Promise<void> {
    const predicted = typeof prediction.output === 'number' 
      ? prediction.output 
      : (prediction.output as number[])[0];

    const error = Math.abs(predicted - actual);
    const accuracy = 1 - (error / Math.abs(actual));

    await this.dataStore.updatePredictionAccuracy(
      modelId,
      prediction.timestamp,
      accuracy,
      actual
    );

    this.metricsCollector.updateAccuracyMetrics(modelId, accuracy);
  }

  /**
   * Detect anomalous predictions
   */
  private async detectAnomaly(
    modelId: string,
    prediction: Prediction
  ): Promise<{ detected: boolean; reason?: string } | null> {
    // Check prediction confidence
    if (prediction.confidence && prediction.confidence < 0.5) {
      return { detected: true, reason: 'Low confidence prediction' };
    }

    // Check processing time
    const avgLatency = await this.dataStore.getAverageLatency(modelId);
    if (prediction.processingTime > avgLatency * 3) {
      return { detected: true, reason: 'Abnormally high processing time' };
    }

    // Check output range
    const outputStats = await this.dataStore.getOutputStatistics(modelId);
    const output = typeof prediction.output === 'number' 
      ? prediction.output 
      : (prediction.output as number[])[0];

    if (outputStats && (
      output < outputStats.min - 3 * outputStats.std ||
      output > outputStats.max + 3 * outputStats.std
    )) {
      return { detected: true, reason: 'Output outside expected range' };
    }

    return null;
  }

  /**
   * Get drift severity based on analysis
   */
  private getDriftSeverity(analysis: DriftAnalysis): AlertSeverity {
    const severities = [
      analysis.details.dataDistributionDrift.severity,
      analysis.details.predictionDrift.severity,
      analysis.details.performanceDrift.severity
    ];

    if (severities.includes('high')) return 'critical';
    if (severities.includes('medium')) return 'error';
    if (severities.includes('low')) return 'warning';
    return 'info';
  }

  /**
   * Summarize drift analysis
   */
  private summarizeDrift(analysis: DriftAnalysis): string {
    const parts: string[] = [];

    if (analysis.details.dataDistributionDrift.detected) {
      parts.push(`Data distribution drift in ${analysis.details.dataDistributionDrift.affectedFeatures.join(', ')}`);
    }

    if (analysis.details.predictionDrift.detected) {
      parts.push(`Prediction drift: ${analysis.details.predictionDrift.deviation.toFixed(2)}% deviation`);
    }

    if (analysis.details.performanceDrift.detected) {
      const metrics = Object.entries(analysis.details.performanceDrift.metrics)
        .filter(([, data]) => data)
        .map(([metric, data]) => `${metric}: ${data!.delta.toFixed(2)}%`);
      parts.push(`Performance drift: ${metrics.join(', ')}`);
    }

    return parts.join('; ');
  }

  /**
   * Check performance-related alerts
   */
  private async checkPerformanceAlerts(modelId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const recent = await this.dataStore.getRecentPerformanceMetrics(modelId, 1); // Last hour

    if (recent.length === 0) return alerts;

    const latest = recent[recent.length - 1];
    const baseline = await this.dataStore.getBaselineMetrics(modelId);

    // Check accuracy degradation
    if (latest.accuracy && baseline.accuracy) {
      const degradation = (baseline.accuracy - latest.accuracy) / baseline.accuracy;
      if (degradation > 0.1) { // 10% degradation
        alerts.push({
          id: `perf-${Date.now()}`,
          modelId,
          type: 'performance_degradation',
          severity: degradation > 0.2 ? 'critical' : 'error',
          message: `Model accuracy degraded by ${(degradation * 100).toFixed(1)}%`,
          timestamp: new Date(),
          metadata: { current: latest.accuracy, baseline: baseline.accuracy }
        });
      }
    }

    return alerts;
  }

  /**
   * Check latency-related alerts
   */
  private async checkLatencyAlerts(modelId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const recent = await this.dataStore.getRecentLatencyMetrics(modelId, 15); // Last 15 minutes

    if (recent.length === 0) return alerts;

    const avgLatency = recent.reduce((sum, m) => sum + m.mean, 0) / recent.length;
    const baseline = await this.dataStore.getBaselineLatency(modelId);

    if (avgLatency > baseline * 2) { // 2x increase
      alerts.push({
        id: `lat-${Date.now()}`,
        modelId,
        type: 'latency_increase',
        severity: avgLatency > baseline * 3 ? 'critical' : 'warning',
        message: `Model latency increased to ${avgLatency.toFixed(1)}ms (${(avgLatency / baseline).toFixed(1)}x baseline)`,
        timestamp: new Date(),
        metadata: { current: avgLatency, baseline }
      });
    }

    return alerts;
  }

  /**
   * Check error-related alerts
   */
  private async checkErrorAlerts(modelId: string): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const errorRate = await this.dataStore.getRecentErrorRate(modelId, 5); // Last 5 minutes

    if (errorRate > 0.05) { // 5% error rate
      alerts.push({
        id: `err-${Date.now()}`,
        modelId,
        type: 'error_spike',
        severity: errorRate > 0.1 ? 'critical' : 'error',
        message: `Model error rate spiked to ${(errorRate * 100).toFixed(1)}%`,
        timestamp: new Date(),
        metadata: { errorRate }
      });
    }

    return alerts;
  }

  /**
   * Get time range for report period
   */
  private getTimeRange(period: ReportPeriod): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    switch (period.type) {
      case 'daily':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (!period.customPeriod) {
          throw new Error('Custom period requires start and end dates');
        }
        return period.customPeriod;
    }

    return { start, end };
  }

  /**
   * Calculate report summary
   */
  private calculateSummary(
    predictions: Prediction[],
    performanceData: PerformanceMetrics[],
    driftAnalyses: DriftAnalysis[]
  ): ReportSummary {
    const totalPredictions = predictions.length;
    
    const averageLatency = performanceData.length > 0
      ? performanceData.reduce((sum, p) => sum + p.latency.mean, 0) / performanceData.length
      : 0;

    const errors = predictions.filter(p => p.confidence && p.confidence < 0.5).length;
    const errorRate = totalPredictions > 0 ? errors / totalPredictions : 0;

    const uptime = this.calculateUptime(performanceData);
    const driftIncidents = driftAnalyses.filter(d => d.driftDetected).length;

    return {
      totalPredictions,
      averageLatency,
      errorRate,
      uptime,
      driftIncidents
    };
  }

  /**
   * Calculate system uptime
   */
  private calculateUptime(performanceData: PerformanceMetrics[]): number {
    if (performanceData.length === 0) return 0;

    const sortedData = [...performanceData].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const totalTime = sortedData[sortedData.length - 1].timestamp.getTime() - sortedData[0].timestamp.getTime();
    
    // Simple uptime calculation based on data availability
    const expectedDataPoints = totalTime / (60 * 1000); // Assuming 1-minute intervals
    const actualDataPoints = performanceData.length;
    
    return Math.min(actualDataPoints / expectedDataPoints, 1) * 100;
  }

  /**
   * Analyze performance trends
   */
  private analyzePerformance(performanceData: PerformanceMetrics[]): PerformanceAnalysis {
    const accuracyTrend = performanceData
      .filter(p => p.accuracy !== undefined)
      .map(p => ({ timestamp: p.timestamp, value: p.accuracy! }));

    const latencyTrend = performanceData
      .map(p => ({ timestamp: p.timestamp, value: p.latency.mean }));

    const throughputTrend = performanceData
      .map(p => ({ timestamp: p.timestamp, value: p.throughput }));

    const resourceUsage = this.calculateResourceUsage(performanceData);

    return {
      accuracyTrend,
      latencyTrend,
      throughputTrend,
      resourceUsage
    };
  }

  /**
   * Calculate resource usage statistics
   */
  private calculateResourceUsage(performanceData: PerformanceMetrics[]): ResourceUsage {
    // Placeholder implementation - would integrate with actual resource monitoring
    return {
      cpu: { mean: 45, peak: 78 },
      memory: { mean: 512, peak: 1024 },
      gpu: { mean: 60, peak: 95 }
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    summary: ReportSummary,
    performanceAnalysis: PerformanceAnalysis,
    driftAnalyses: DriftAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // High error rate
    if (summary.errorRate > 0.05) {
      recommendations.push('High error rate detected. Consider retraining the model with recent data.');
    }

    // Drift detected
    if (summary.driftIncidents > 0) {
      recommendations.push('Model drift detected. Review feature distributions and consider model update.');
    }

    // Performance degradation
    const latencyIncreasing = this.detectTrend(performanceAnalysis.latencyTrend) > 0.1;
    if (latencyIncreasing) {
      recommendations.push('Increasing latency trend detected. Consider model optimization or infrastructure scaling.');
    }

    // Low uptime
    if (summary.uptime < 95) {
      recommendations.push('Low system uptime. Investigate stability issues and implement redundancy.');
    }

    return recommendations;
  }

  /**
   * Detect trend in time series data
   */
  private detectTrend(data: TrendData[]): number {
    if (data.length < 2) return 0;

    // Simple linear regression
    const n = data.length;
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, d) => sum + d.value, 0);
    const sumXY = data.reduce((sum, d, i) => sum + i * d.value, 0);
    const sumX2 = data.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;

    return slope / mean; // Normalized slope
  }
}

// Metrics Collector
class MetricsCollector {
  private histograms: Map<string, Histogram<string>> = new Map();
  private counters: Map<string, Counter<string>> = new Map();
  private gauges: Map<string, Gauge<string>> = new Map();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Latency histogram
    this.histograms.set('model_inference_latency', new Histogram({
      name: 'model_inference_latency_seconds',
      help: 'Model inference latency in seconds',
      labelNames: ['model_id', 'model_version'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1]
    }));

    // Prediction counter
    this.counters.set('model_predictions_total', new Counter({
      name: 'model_predictions_total',
      help: 'Total number of model predictions',
      labelNames: ['model_id', 'model_version']
    }));

    // Accuracy gauge
    this.gauges.set('model_accuracy', new Gauge({
      name: 'model_accuracy',
      help: 'Model accuracy',
      labelNames: ['model_id', 'window']
    }));

    // Error rate gauge
    this.gauges.set('model_error_rate', new Gauge({
      name: 'model_error_rate',
      help: 'Model error rate',
      labelNames: ['model_id']
    }));
  }

  collectPredictionMetrics(modelId: string, prediction: Prediction): void {
    const labels = {
      model_id: modelId,
      model_version: prediction.modelVersion
    };

    // Record latency
    this.histograms.get('model_inference_latency')!
      .observe(labels, prediction.processingTime / 1000);

    // Increment prediction counter
    this.counters.get('model_predictions_total')!.inc(labels);
  }

  updateAccuracyMetrics(modelId: string, accuracy: number): void {
    this.gauges.get('model_accuracy')!.set(
      { model_id: modelId, window: '1h' },
      accuracy
    );
  }

  collectModelMetrics(modelId: string, metrics: ModelMetrics): void {
    const histogram = this.histograms.get('model_inference_latency');
    if (histogram) {
      histogram.observe(
        { model_id: modelId, model_version: metrics.version },
        metrics.latency / 1000
      );
    }

    const accuracyGauge = this.gauges.get('model_accuracy');
    if (accuracyGauge) {
      accuracyGauge.set(
        { model_id: modelId, window: '1h' },
        metrics.accuracy
      );
    }

    const counter = this.counters.get('model_predictions_total');
    if (counter) {
      counter.inc(
        { model_id: modelId },
        metrics.predictions
      );
    }
  }
}

// Drift Detector
class DriftDetector {
  private algorithms: Map<string, DriftAlgorithm> = new Map();

  constructor() {
    this.algorithms.set('ks_test', new KSTestAlgorithm());
    this.algorithms.set('psi', new PSIAlgorithm());
  }

  async analyze(modelId: string, data: ModelData): Promise<DriftAnalysis> {
    const results = {
      dataDistributionDrift: await this.detectDistributionDrift(data),
      predictionDrift: await this.detectPredictionDrift(data),
      performanceDrift: await this.detectPerformanceDrift(data),
      featureDrift: await this.detectFeatureDrift(data)
    };

    const driftDetected = this.isDriftSignificant(results);
    const recommendations = this.generateRecommendations(results);

    return {
      modelId,
      timestamp: new Date(),
      driftDetected,
      details: results,
      recommendations
    };
  }

  private async detectDistributionDrift(data: ModelData): Promise<DistributionDrift> {
    const affectedFeatures: string[] = [];
    const statistics: DriftStatistics[] = [];

    for (const feature of data.features) {
      const reference = feature.values.slice(0, Math.floor(feature.values.length / 2));
      const current = feature.values.slice(Math.floor(feature.values.length / 2));

      for (const [name, algorithm] of this.algorithms) {
        const stat = algorithm.detect(reference, current);
        statistics.push(stat);

        if (stat.pValue < stat.threshold) {
          affectedFeatures.push(feature.name);
        }
      }
    }

    const detected = affectedFeatures.length > 0;
    const severity = this.calculateSeverity(affectedFeatures.length, data.features.length);

    return { detected, severity, affectedFeatures, statistics };
  }

  private async detectPredictionDrift(data: ModelData): Promise<PredictionDrift> {
    if (data.predictions.length < 100) {
      return {
        detected: false,
        severity: 'low',
        baselineMean: 0,
        currentMean: 0,
        deviation: 0
      };
    }

    const outputs = data.predictions.map(p => 
      typeof p.output === 'number' ? p.output : (p.output as number[])[0]
    );

    const midpoint = Math.floor(outputs.length / 2);
    const baseline = outputs.slice(0, midpoint);
    const current = outputs.slice(midpoint);

    const baselineMean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const currentMean = current.reduce((a, b) => a + b, 0) / current.length;
    const deviation = Math.abs((currentMean - baselineMean) / baselineMean) * 100;

    const detected = deviation > 10; // 10% deviation threshold
    const severity = deviation > 25 ? 'high' : deviation > 15 ? 'medium' : 'low';

    return { detected, severity, baselineMean, currentMean, deviation };
  }

  private async detectPerformanceDrift(data: ModelData): Promise<PerformanceDrift> {
    if (data.performanceMetrics.length < 10) {
      return {
        detected: false,
        severity: 'low',
        metrics: {}
      };
    }

    const midpoint = Math.floor(data.performanceMetrics.length / 2);
    const baseline = data.performanceMetrics.slice(0, midpoint);
    const current = data.performanceMetrics.slice(midpoint);

    const metrics: any = {};
    let driftsDetected = 0;

    // Check accuracy drift
    const baselineAccuracy = baseline
      .filter(m => m.accuracy !== undefined)
      .map(m => m.accuracy!);
    const currentAccuracy = current
      .filter(m => m.accuracy !== undefined)
      .map(m => m.accuracy!);

    if (baselineAccuracy.length > 0 && currentAccuracy.length > 0) {
      const baselineAvg = baselineAccuracy.reduce((a, b) => a + b, 0) / baselineAccuracy.length;
      const currentAvg = currentAccuracy.reduce((a, b) => a + b, 0) / currentAccuracy.length;
      const delta = ((currentAvg - baselineAvg) / baselineAvg) * 100;

      metrics.accuracy = { baseline: baselineAvg, current: currentAvg, delta };
      if (Math.abs(delta) > 5) driftsDetected++;
    }

    // Check latency drift
    const baselineLatency = baseline.map(m => m.latency.mean);
    const currentLatency = current.map(m => m.latency.mean);

    const baselineLatencyAvg = baselineLatency.reduce((a, b) => a + b, 0) / baselineLatency.length;
    const currentLatencyAvg = currentLatency.reduce((a, b) => a + b, 0) / currentLatency.length;
    const latencyDelta = ((currentLatencyAvg - baselineLatencyAvg) / baselineLatencyAvg) * 100;

    metrics.latency = { baseline: baselineLatencyAvg, current: currentLatencyAvg, delta: latencyDelta };
    if (latencyDelta > 20) driftsDetected++;

    const detected = driftsDetected > 0;
    const severity = driftsDetected > 1 ? 'high' : 'medium';

    return { detected, severity, metrics };
  }

  private async detectFeatureDrift(data: ModelData): Promise<FeatureDrift[]> {
    const results: FeatureDrift[] = [];

    for (const feature of data.features) {
      if (feature.values.length < 50) continue;

      const reference = feature.values.slice(0, Math.floor(feature.values.length / 2));
      const current = feature.values.slice(Math.floor(feature.values.length / 2));

      const ksTest = this.algorithms.get('ks_test')!.detect(reference, current);
      const psi = this.algorithms.get('psi')!.detect(reference, current);

      const driftScore = (ksTest.statistic + psi.statistic) / 2;
      const pValue = Math.min(ksTest.pValue, psi.pValue);
      const detected = pValue < 0.05;

      results.push({
        featureName: feature.name,
        driftScore,
        pValue,
        detected
      });
    }

    return results;
  }

  private isDriftSignificant(results: DriftDetails): boolean {
    return results.dataDistributionDrift.detected ||
           results.predictionDrift.detected ||
           results.performanceDrift.detected ||
           results.featureDrift.some(f => f.detected);
  }

  private calculateSeverity(affected: number, total: number): 'low' | 'medium' | 'high' {
    const ratio = affected / total;
    if (ratio > 0.5) return 'high';
    if (ratio > 0.2) return 'medium';
    return 'low';
  }

  private generateRecommendations(results: DriftDetails): string[] {
    const recommendations: string[] = [];

    if (results.dataDistributionDrift.detected) {
      recommendations.push(
        `Feature distribution drift detected in: ${results.dataDistributionDrift.affectedFeatures.join(', ')}. ` +
        'Consider retraining with recent data or adjusting feature preprocessing.'
      );
    }

    if (results.predictionDrift.detected) {
      recommendations.push(
        `Prediction drift of ${results.predictionDrift.deviation.toFixed(1)}% detected. ` +
        'Review model calibration and consider updating prediction thresholds.'
      );
    }

    if (results.performanceDrift.detected) {
      const metrics = Object.entries(results.performanceDrift.metrics)
        .filter(([, data]) => data && Math.abs(data.delta) > 5)
        .map(([metric]) => metric);
      
      recommendations.push(
        `Performance degradation in: ${metrics.join(', ')}. ` +
        'Investigate root causes and consider model retraining or architecture changes.'
      );
    }

    const significantFeatureDrifts = results.featureDrift
      .filter(f => f.detected)
      .map(f => f.featureName);
    
    if (significantFeatureDrifts.length > 0) {
      recommendations.push(
        `Individual feature drift in: ${significantFeatureDrifts.join(', ')}. ` +
        'Review feature engineering pipeline and data quality.'
      );
    }

    return recommendations;
  }
}

// Alert Manager
class AlertManager {
  private alerts: Map<string, Alert[]> = new Map();

  constructor(private monitoringService: ModelMonitoringService) {}

  createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const fullAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    const modelAlerts = this.alerts.get(alert.modelId) || [];
    modelAlerts.push(fullAlert);
    this.alerts.set(alert.modelId, modelAlerts);

    this.monitoringService.emit('alert:created', fullAlert);
    return fullAlert;
  }

  async getActiveAlerts(modelId: string): Promise<Alert[]> {
    const modelAlerts = this.alerts.get(modelId) || [];
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    return modelAlerts.filter(alert => alert.timestamp > cutoff);
  }

  async getAlerts(modelId: string, timeRange: { start: Date; end: Date }): Promise<Alert[]> {
    const modelAlerts = this.alerts.get(modelId) || [];
    
    return modelAlerts.filter(alert => 
      alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
    );
  }
}

// Monitoring Data Store (simplified in-memory implementation)
class MonitoringDataStore {
  private predictions: Map<string, Prediction[]> = new Map();
  private performanceMetrics: Map<string, PerformanceMetrics[]> = new Map();
  private driftAnalyses: Map<string, DriftAnalysis[]> = new Map();

  async storePrediction(modelId: string, prediction: Prediction): Promise<void> {
    const modelPredictions = this.predictions.get(modelId) || [];
    modelPredictions.push(prediction);
    this.predictions.set(modelId, modelPredictions);
  }

  async getModelData(modelId: string, window: TimeWindow): Promise<ModelData> {
    const predictions = this.getPredictionsInWindow(modelId, window);
    const features = this.extractFeatures(predictions);
    const performanceMetrics = this.getPerformanceMetricsInWindow(modelId, window);

    return { predictions, features, performanceMetrics };
  }

  async storeDriftAnalysis(modelId: string, analysis: DriftAnalysis): Promise<void> {
    const analyses = this.driftAnalyses.get(modelId) || [];
    analyses.push(analysis);
    this.driftAnalyses.set(modelId, analyses);
  }

  async getPredictions(modelId: string, timeRange: { start: Date; end: Date }): Promise<Prediction[]> {
    const allPredictions = this.predictions.get(modelId) || [];
    return allPredictions.filter(p => 
      p.timestamp >= timeRange.start && p.timestamp <= timeRange.end
    );
  }

  async getPerformanceMetrics(modelId: string, timeRange: { start: Date; end: Date }): Promise<PerformanceMetrics[]> {
    const allMetrics = this.performanceMetrics.get(modelId) || [];
    return allMetrics.filter(m => 
      m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  async getDriftAnalyses(modelId: string, timeRange: { start: Date; end: Date }): Promise<DriftAnalysis[]> {
    const allAnalyses = this.driftAnalyses.get(modelId) || [];
    return allAnalyses.filter(a => 
      a.timestamp >= timeRange.start && a.timestamp <= timeRange.end
    );
  }

  async updatePredictionAccuracy(
    modelId: string,
    timestamp: Date,
    accuracy: number,
    actual: number
  ): Promise<void> {
    // Update prediction with actual value
    const predictions = this.predictions.get(modelId) || [];
    const prediction = predictions.find(p => p.timestamp.getTime() === timestamp.getTime());
    if (prediction) {
      (prediction as any).actual = actual;
      (prediction as any).accuracy = accuracy;
    }
  }

  async getAverageLatency(modelId: string): Promise<number> {
    const predictions = this.predictions.get(modelId) || [];
    if (predictions.length === 0) return 0;

    const totalLatency = predictions.reduce((sum, p) => sum + p.processingTime, 0);
    return totalLatency / predictions.length;
  }

  async getOutputStatistics(modelId: string): Promise<{ min: number; max: number; mean: number; std: number } | null> {
    const predictions = this.predictions.get(modelId) || [];
    if (predictions.length === 0) return null;

    const outputs = predictions.map(p => 
      typeof p.output === 'number' ? p.output : (p.output as number[])[0]
    );

    const min = Math.min(...outputs);
    const max = Math.max(...outputs);
    const mean = outputs.reduce((a, b) => a + b, 0) / outputs.length;
    const variance = outputs.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / outputs.length;
    const std = Math.sqrt(variance);

    return { min, max, mean, std };
  }

  async getRecentPerformanceMetrics(modelId: string, hours: number): Promise<PerformanceMetrics[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const allMetrics = this.performanceMetrics.get(modelId) || [];
    return allMetrics.filter(m => m.timestamp > cutoff);
  }

  async getBaselineMetrics(modelId: string): Promise<any> {
    // Simplified baseline calculation
    const metrics = this.performanceMetrics.get(modelId) || [];
    if (metrics.length === 0) return { accuracy: 0.95, latency: 10 };

    const recentMetrics = metrics.slice(-100);
    const accuracy = recentMetrics
      .filter(m => m.accuracy !== undefined)
      .reduce((sum, m) => sum + m.accuracy!, 0) / recentMetrics.length;

    return { accuracy };
  }

  async getRecentLatencyMetrics(modelId: string, minutes: number): Promise<LatencyMetrics[]> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const allMetrics = this.performanceMetrics.get(modelId) || [];
    return allMetrics
      .filter(m => m.timestamp > cutoff)
      .map(m => m.latency);
  }

  async getBaselineLatency(modelId: string): Promise<number> {
    const predictions = this.predictions.get(modelId) || [];
    if (predictions.length === 0) return 10;

    const recentPredictions = predictions.slice(-1000);
    return recentPredictions.reduce((sum, p) => sum + p.processingTime, 0) / recentPredictions.length;
  }

  async getRecentErrorRate(modelId: string, minutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const predictions = (this.predictions.get(modelId) || [])
      .filter(p => p.timestamp > cutoff);

    if (predictions.length === 0) return 0;

    const errors = predictions.filter(p => p.confidence && p.confidence < 0.5).length;
    return errors / predictions.length;
  }

  private getPredictionsInWindow(modelId: string, window: TimeWindow): Prediction[] {
    const allPredictions = this.predictions.get(modelId) || [];
    return allPredictions.filter(p => 
      p.timestamp >= window.start && p.timestamp <= window.end
    );
  }

  private getPerformanceMetricsInWindow(modelId: string, window: TimeWindow): PerformanceMetrics[] {
    const allMetrics = this.performanceMetrics.get(modelId) || [];
    return allMetrics.filter(m => 
      m.timestamp >= window.start && m.timestamp <= window.end
    );
  }

  private extractFeatures(predictions: Prediction[]): FeatureData[] {
    // Simplified feature extraction from predictions
    const featureMap = new Map<string, number[]>();

    for (const prediction of predictions) {
      const input = Array.isArray(prediction.input) ? prediction.input : [];
      
      input.forEach((value, index) => {
        const featureName = `feature_${index}`;
        const values = featureMap.get(featureName) || [];
        values.push(value);
        featureMap.set(featureName, values);
      });
    }

    return Array.from(featureMap.entries()).map(([name, values]) => ({
      name,
      values,
      timestamp: new Date()
    }));
  }
}

// Type definitions for external use
export interface ModelMetrics {
  latency: number;
  accuracy: number;
  predictions: number;
  version: string;
}
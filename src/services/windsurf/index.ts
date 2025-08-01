// Windsurf Services Barrel Exports

export { PortfolioOptimizationService } from './PortfolioOptimizationService';
export { RiskManagementEngine } from './RiskManagementEngine';
export { FeatureEngineeringPipeline } from './FeatureEngineeringPipeline';
export { ModelVersioningService } from './ModelVersioningService';
export { ModelMonitoringService } from './ModelMonitoringService';

// Export types
export type {
  Asset,
  Portfolio,
  OptimizationObjective,
  PortfolioConstraints,
  OptimalPortfolio,
  EfficientFrontier,
  BacktestResult,
  RebalanceRecommendation,
  AssetType,
  PortfolioAsset,
  PortfolioMetadata,
  PortfolioPoint,
  Trade,
  RiskMetrics as PortfolioRiskMetrics
} from './PortfolioOptimizationService';

export type {
  RiskMetrics,
  VaRResult,
  ESResult,
  StressTestResult,
  RiskLimits,
  RiskAlert,
  RiskPosition,
  VaRMethod,
  Scenario,
  StressScenario,
  MarketShock,
  PositionImpact,
  ComponentVaR,
  MarginalVaR,
  MonteCarloConfig,
  BacktestResult as RiskBacktestResult,
  RiskAlertType
} from './RiskManagementEngine';

export type {
  FeatureVector,
  MarketData,
  TransformConfig,
  FeatureImportance,
  Candle,
  FeatureDataset,
  DatasetMetadata,
  NormalizationConfig,
  EncodingConfig,
  AggregationConfig,
  DimensionReductionConfig,
  RawFeatures,
  TransformedFeatures,
  FeatureMetadata,
  SelectedFeatures
} from './FeatureEngineeringPipeline';

export type {
  ModelVersion,
  ModelMetadata,
  AIModel,
  TrainingMetrics,
  DeploymentConfig,
  ModelStatus,
  Deployment,
  HealthStatus,
  PerformanceMetrics as ModelPerformanceMetrics,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PerformanceReport
} from './ModelVersioningService';

export type {
  ModelMetrics,
  Alert,
  Prediction,
  ModelData,
  FeatureData,
  PerformanceMetrics,
  LatencyMetrics,
  DriftAnalysis,
  DriftDetails,
  DistributionDrift,
  PredictionDrift,
  PerformanceDrift,
  FeatureDrift,
  DriftStatistics,
  AlertType,
  AlertSeverity,
  ModelReport,
  ReportSummary,
  PerformanceAnalysis,
  TrendData,
  ResourceUsage,
  TimeWindow,
  ReportPeriod
} from './ModelMonitoringService';
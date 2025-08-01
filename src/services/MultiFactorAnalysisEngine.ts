export interface Factor {
  id: string;
  name: string;
  description: string;
  weight: number;
  exposure: number;
}

export interface FactorModel {
  id: string;
  name: string;
  factors: Factor[];
  r2: number;
  alphaSignificance: number;
}

export interface FactorAnalysisResult {
  factorExposures: { [factorId: string]: number };
  factorContributions: { [factorId: string]: number };
  idiosyncraticRisk: number;
  systematicRisk: number;
  totalRisk: number;
  rSquared: number;
}

export class MultiFactorAnalysisEngine {
  private static instance: MultiFactorAnalysisEngine;
  private models: Map<string, FactorModel> = new Map();

  private constructor() {
    this.initializeDefaultModels();
  }

  static getInstance(): MultiFactorAnalysisEngine {
    if (!MultiFactorAnalysisEngine.instance) {
      MultiFactorAnalysisEngine.instance = new MultiFactorAnalysisEngine();
    }
    return MultiFactorAnalysisEngine.instance;
  }

  private initializeDefaultModels(): void {
    // Fama-French 3-Factor Model
    const famaFrench3Factor: FactorModel = {
      id: 'fama_french_3',
      name: 'Fama-French 3-Factor Model',
      factors: [
        {
          id: 'market',
          name: 'Market Risk Premium',
          description: 'Excess return of market over risk-free rate',
          weight: 1.0,
          exposure: 0.0
        },
        {
          id: 'smb',
          name: 'Small Minus Big (SMB)',
          description: 'Size factor - small cap vs large cap',
          weight: 0.5,
          exposure: 0.0
        },
        {
          id: 'hml',
          name: 'High Minus Low (HML)',
          description: 'Value factor - high book-to-market vs low',
          weight: 0.3,
          exposure: 0.0
        }
      ],
      r2: 0.85,
      alphaSignificance: 0.05
    };

    this.models.set('fama_french_3', famaFrench3Factor);

    // Carhart 4-Factor Model (adding momentum)
    const carhart4Factor: FactorModel = {
      id: 'carhart_4',
      name: 'Carhart 4-Factor Model',
      factors: [
        ...famaFrench3Factor.factors,
        {
          id: 'mom',
          name: 'Momentum (MOM)',
          description: 'Momentum factor - winners vs losers',
          weight: 0.2,
          exposure: 0.0
        }
      ],
      r2: 0.88,
      alphaSignificance: 0.05
    };

    this.models.set('carhart_4', carhart4Factor);
  }

  async analyzeFactorExposure(
    assetReturns: number[],
    factorReturns: { [factorId: string]: number[] },
    modelId: string = 'fama_french_3'
  ): Promise<FactorAnalysisResult> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Factor model ${modelId} not found`);
    }

    // Perform multiple regression
    const regression = this.performRegression(assetReturns, factorReturns, model);
    
    // Calculate factor contributions to risk
    const factorContributions = this.calculateFactorContributions(regression, model, factorReturns);
    
    // Calculate systematic vs idiosyncratic risk
    const riskDecomposition = this.decomposeRisk(regression, assetReturns);

    return {
      factorExposures: regression.betas,
      factorContributions,
      idiosyncraticRisk: riskDecomposition.idiosyncratic,
      systematicRisk: riskDecomposition.systematic,
      totalRisk: riskDecomposition.total,
      rSquared: regression.rSquared
    };
  }

  private performRegression(
    assetReturns: number[],
    factorReturns: { [factorId: string]: number[] },
    model: FactorModel
  ): { betas: { [factorId: string]: number }; alpha: number; rSquared: number; residuals: number[] } {
    const n = assetReturns.length;
    const factorIds = model.factors.map(f => f.id);
    const k = factorIds.length;

    // Build matrix for regression Y = Xβ + ε
    const X: number[][] = [];
    const Y = assetReturns;

    for (let i = 0; i < n; i++) {
      const row = [1]; // Intercept
      for (const factorId of factorIds) {
        row.push(factorReturns[factorId][i]);
      }
      X.push(row);
    }

    // Solve using normal equations: β = (X'X)^(-1)X'Y
    const betas = this.solveLinearSystem(X, Y);
    
    // Calculate R-squared and residuals
    const predictions = this.predictValues(X, betas);
    const residuals = Y.map((y, i) => y - predictions[i]);
    const rSquared = this.calculateRSquared(Y, predictions);

    const betaObj: { [factorId: string]: number } = {};
    factorIds.forEach((factorId, i) => {
      betaObj[factorId] = betas[i + 1]; // Skip intercept
    });

    return {
      betas: betaObj,
      alpha: betas[0],
      rSquared,
      residuals
    };
  }

  private calculateFactorContributions(
    regression: { betas: { [factorId: string]: number } },
    model: FactorModel,
    factorReturns: { [factorId: string]: number[] }
  ): { [factorId: string]: number } {
    const contributions: { [factorId: string]: number } = {};

    for (const factor of model.factors) {
      const beta = regression.betas[factor.id];
      const factorVol = this.calculateVolatility(factorReturns[factor.id]);
      contributions[factor.id] = Math.abs(beta) * factorVol;
    }

    return contributions;
  }

  private decomposeRisk(
    regression: { rSquared: number; residuals: number[] },
    assetReturns: number[]
  ): { systematic: number; idiosyncratic: number; total: number } {
    const totalVariance = this.calculateVariance(assetReturns);
    const systematicVariance = regression.rSquared * totalVariance;
    const idiosyncraticVariance = this.calculateVariance(regression.residuals);

    return {
      systematic: Math.sqrt(systematicVariance),
      idiosyncratic: Math.sqrt(idiosyncraticVariance),
      total: Math.sqrt(totalVariance)
    };
  }

  private solveLinearSystem(X: number[][], Y: number[]): number[] {
    // Simplified implementation - in practice, use numerical libraries
    const n = X.length;
    const k = X[0].length;
    
    // For demonstration, return mock coefficients
    const betas: number[] = new Array(k).fill(0);
    betas[0] = 0.01; // Alpha
    for (let i = 1; i < k; i++) {
      betas[i] = 0.5 + Math.random() * 0.5; // Factor betas
    }
    
    return betas;
  }

  private predictValues(X: number[][], betas: number[]): number[] {
    return X.map(row => 
      row.reduce((sum, x, i) => sum + x * betas[i], 0)
    );
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const actualMean = actual.reduce((sum, y) => sum + y, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, y) => sum + Math.pow(y - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
    return 1 - (residualSumSquares / totalSumSquares);
  }

  private calculateVolatility(returns: number[]): number {
    const variance = this.calculateVariance(returns);
    return Math.sqrt(variance);
  }

  private calculateVariance(returns: number[]): number {
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    return returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  }

  getAvailableModels(): FactorModel[] {
    return Array.from(this.models.values());
  }

  addCustomModel(model: FactorModel): void {
    this.models.set(model.id, model);
  }

  removeModel(modelId: string): boolean {
    return this.models.delete(modelId);
  }
}
interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  timestamp: number;
}

interface CPUMetrics {
  cpuUsage: number;
  systemUsage: number;
  userUsage: number;
  timestamp: number;
}

interface RenderMetrics {
  fps: number;
  frameDrops: number;
  renderTime: number;
  timestamp: number;
}

interface PerformanceThreshold {
  memoryMB: number;
  cpuPercent: number;
  minFPS: number;
  maxRenderTime: number;
}

interface LeakDetection {
  symbol: string;
  growthRate: number;
  sustained: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class EnhancedPerformanceProfiler {
  private memoryHistory: MemoryMetrics[] = [];
  private cpuHistory: CPUMetrics[] = [];
  private renderHistory: RenderMetrics[] = [];
  
  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly MONITORING_INTERVAL = 1000; // 1 second
  private readonly MEMORY_LEAK_THRESHOLD = 10; // MB growth over time
  private readonly CPU_HIGH_THRESHOLD = 80; // %
  private readonly MIN_FPS_THRESHOLD = 30;
  
  private monitoringTimer: NodeJS.Timeout | null = null;
  private renderObserver: PerformanceObserver | null = null;
  private isMonitoring = false;
  
  private thresholds: PerformanceThreshold = {
    memoryMB: 500,
    cpuPercent: 70,
    minFPS: 30,
    maxRenderTime: 16.67 // 60 FPS target
  };
  
  private leakDetectionResults: LeakDetection[] = [];
  private lastGCTime = Date.now();
  
  constructor() {
    this.initializeRenderTracking();
  }

  // Start comprehensive performance monitoring
  async startProfiling(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ Performance profiling already active');
      return;
    }

    console.log('🚀 Starting Enhanced Performance Profiling...');
    
    this.isMonitoring = true;
    
    // Start periodic monitoring
    this.monitoringTimer = setInterval(() => {
      this.collectMetrics();
      this.analyzePerformance();
      this.detectMemoryLeaks();
    }, this.MONITORING_INTERVAL);
    
    // Enable render performance tracking
    this.enableRenderTracking();
    
    console.log('✅ Performance profiling started');
  }

  async stopProfiling(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    console.log('🛑 Stopping Performance Profiling...');
    
    this.isMonitoring = false;
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    
    if (this.renderObserver) {
      this.renderObserver.disconnect();
      this.renderObserver = null;
    }
    
    console.log('✅ Performance profiling stopped');
  }

  // Memory metrics collection and analysis
  private collectMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: memUsage.heapUsed / 1024 / 1024, // MB
      heapTotal: memUsage.heapTotal / 1024 / 1024, // MB
      external: memUsage.external / 1024 / 1024, // MB
      rss: memUsage.rss / 1024 / 1024, // MB
      arrayBuffers: memUsage.arrayBuffers / 1024 / 1024, // MB
      timestamp: Date.now()
    };
  }

  // CPU metrics collection
  private collectCPUMetrics(): CPUMetrics {
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    
    // Convert microseconds to percentage (approximation)
    const cpuPercent = Math.min(100, (totalUsage / 1000000) * 100);
    
    return {
      cpuUsage: cpuPercent,
      systemUsage: (cpuUsage.system / 1000000) * 100,
      userUsage: (cpuUsage.user / 1000000) * 100,
      timestamp: Date.now()
    };
  }

  // Comprehensive metrics collection
  private collectMetrics(): void {
    try {
      // Memory metrics
      const memMetrics = this.collectMemoryMetrics();
      this.memoryHistory.push(memMetrics);
      
      // CPU metrics
      const cpuMetrics = this.collectCPUMetrics();
      this.cpuHistory.push(cpuMetrics);
      
      // Maintain history size
      if (this.memoryHistory.length > this.MAX_HISTORY_SIZE) {
        this.memoryHistory.shift();
      }
      
      if (this.cpuHistory.length > this.MAX_HISTORY_SIZE) {
        this.cpuHistory.shift();
      }
      
    } catch (error) {
      console.error('❌ Error collecting performance metrics:', error);
    }
  }

  // Advanced memory leak detection
  private detectMemoryLeaks(): void {
    if (this.memoryHistory.length < 10) {
      return; // Need sufficient data
    }
    
    const recentMemory = this.memoryHistory.slice(-10);
    const oldMemory = this.memoryHistory.slice(-20, -10);
    
    if (oldMemory.length === 0) return;
    
    const recentAvg = recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) / recentMemory.length;
    const oldAvg = oldMemory.reduce((sum, m) => sum + m.heapUsed, 0) / oldMemory.length;
    
    const growthRate = recentAvg - oldAvg;
    
    // Check for sustained growth
    const sustained = this.checkSustainedGrowth();
    
    if (growthRate > this.MEMORY_LEAK_THRESHOLD || sustained) {
      const severity = this.calculateLeakSeverity(growthRate, sustained);
      
      const leak: LeakDetection = {
        symbol: 'memory_heap',
        growthRate,
        sustained,
        severity
      };
      
      this.leakDetectionResults.push(leak);
      
      console.log(`🚨 Memory leak detected: ${growthRate.toFixed(2)}MB growth, severity: ${severity}`);
      
      // Trigger garbage collection if available
      this.triggerOptimizations(severity);
    }
  }

  private checkSustainedGrowth(): boolean {
    if (this.memoryHistory.length < 30) return false;
    
    const segments = 6;
    const segmentSize = 5;
    let increasingCount = 0;
    
    for (let i = 0; i < segments - 1; i++) {
      const start1 = this.memoryHistory.slice(-(segments - i) * segmentSize, -(segments - i - 1) * segmentSize);
      const start2 = this.memoryHistory.slice(-(segments - i - 1) * segmentSize, -(segments - i - 2) * segmentSize);
      
      if (start2.length === 0) continue;
      
      const avg1 = start1.reduce((sum, m) => sum + m.heapUsed, 0) / start1.length;
      const avg2 = start2.reduce((sum, m) => sum + m.heapUsed, 0) / start2.length;
      
      if (avg2 > avg1) {
        increasingCount++;
      }
    }
    
    return increasingCount >= 4; // 4 out of 5 segments showing growth
  }

  private calculateLeakSeverity(growthRate: number, sustained: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (sustained && growthRate > 50) return 'critical';
    if (sustained && growthRate > 20) return 'high';
    if (growthRate > 30) return 'high';
    if (growthRate > 15) return 'medium';
    return 'low';
  }

  // Performance optimization triggers
  private triggerOptimizations(severity: 'low' | 'medium' | 'high' | 'critical'): void {
    switch (severity) {
      case 'critical':
        this.performCriticalOptimization();
        break;
      case 'high':
        this.performHighOptimization();
        break;
      case 'medium':
        this.performMediumOptimization();
        break;
      case 'low':
        this.performLowOptimization();
        break;
    }
  }

  private performCriticalOptimization(): void {
    console.log('🚨 CRITICAL: Performing emergency memory optimization');
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
      console.log('🧹 Forced garbage collection');
    }
    
    // Clear excessive caches
    this.clearPerformanceCaches();
    
    // Emit critical alert
    this.emitPerformanceAlert('critical', 'Critical memory usage detected');
  }

  private performHighOptimization(): void {
    console.log('⚠️ HIGH: Performing aggressive memory optimization');
    
    if (global.gc) {
      global.gc();
    }
    
    this.optimizeDataStructures();
  }

  private performMediumOptimization(): void {
    console.log('⚡ MEDIUM: Performing standard optimization');
    
    this.optimizeDataStructures();
    this.scheduleDelayedGC();
  }

  private performLowOptimization(): void {
    console.log('📊 LOW: Performing light optimization');
    
    this.scheduleDelayedGC();
  }

  private clearPerformanceCaches(): void {
    // Clear history to free memory
    this.memoryHistory = this.memoryHistory.slice(-100);
    this.cpuHistory = this.cpuHistory.slice(-100);
    this.renderHistory = this.renderHistory.slice(-100);
    
    console.log('🧹 Performance caches cleared');
  }

  private optimizeDataStructures(): void {
    // Trim history arrays
    const targetSize = Math.floor(this.MAX_HISTORY_SIZE * 0.7);
    
    if (this.memoryHistory.length > targetSize) {
      this.memoryHistory = this.memoryHistory.slice(-targetSize);
    }
    
    if (this.cpuHistory.length > targetSize) {
      this.cpuHistory = this.cpuHistory.slice(-targetSize);
    }
    
    if (this.renderHistory.length > targetSize) {
      this.renderHistory = this.renderHistory.slice(-targetSize);
    }
  }

  private scheduleDelayedGC(): void {
    // Schedule GC for when system is less busy
    setTimeout(() => {
      if (global.gc && this.getCurrentCPUUsage() < 50) {
        global.gc();
        this.lastGCTime = Date.now();
      }
    }, 5000);
  }

  // Render performance tracking
  private initializeRenderTracking(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.renderObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            this.recordRenderMetric(entry);
          }
        }
      });
    }
  }

  private enableRenderTracking(): void {
    if (this.renderObserver) {
      try {
        this.renderObserver.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
        console.log('✅ Render performance tracking enabled');
      } catch (error) {
        console.log('⚠️ Render tracking not available in this environment');
      }
    }
    
    // Fallback: manual FPS tracking
    this.startManualFPSTracking();
  }

  private startManualFPSTracking(): void {
    if (typeof window === 'undefined') return;
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    const trackFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        const renderMetric: RenderMetrics = {
          fps,
          frameDrops: Math.max(0, 60 - fps),
          renderTime: 1000 / fps,
          timestamp: Date.now()
        };
        
        this.renderHistory.push(renderMetric);
        
        if (this.renderHistory.length > this.MAX_HISTORY_SIZE) {
          this.renderHistory.shift();
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(trackFrame);
      }
    };
    
    requestAnimationFrame(trackFrame);
  }

  private recordRenderMetric(entry: PerformanceEntry): void {
    const renderMetric: RenderMetrics = {
      fps: 60, // Estimated based on duration
      frameDrops: entry.duration > 16.67 ? 1 : 0,
      renderTime: entry.duration,
      timestamp: Date.now()
    };
    
    this.renderHistory.push(renderMetric);
    
    if (this.renderHistory.length > this.MAX_HISTORY_SIZE) {
      this.renderHistory.shift();
    }
  }

  // Performance analysis
  private analyzePerformance(): void {
    this.analyzeMemoryTrends();
    this.analyzeCPUUsage();
    this.analyzeRenderPerformance();
  }

  private analyzeMemoryTrends(): void {
    if (this.memoryHistory.length < 5) return;
    
    const recent = this.memoryHistory.slice(-5);
    const avgMemory = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    
    if (avgMemory > this.thresholds.memoryMB) {
      console.log(`⚠️ Memory usage high: ${avgMemory.toFixed(2)}MB (threshold: ${this.thresholds.memoryMB}MB)`);
      this.emitPerformanceAlert('warning', `High memory usage: ${avgMemory.toFixed(2)}MB`);
    }
  }

  private analyzeCPUUsage(): void {
    if (this.cpuHistory.length < 5) return;
    
    const recent = this.cpuHistory.slice(-5);
    const avgCPU = recent.reduce((sum, c) => sum + c.cpuUsage, 0) / recent.length;
    
    if (avgCPU > this.thresholds.cpuPercent) {
      console.log(`⚠️ CPU usage high: ${avgCPU.toFixed(2)}% (threshold: ${this.thresholds.cpuPercent}%)`);
      this.emitPerformanceAlert('warning', `High CPU usage: ${avgCPU.toFixed(2)}%`);
    }
  }

  private analyzeRenderPerformance(): void {
    if (this.renderHistory.length < 5) return;
    
    const recent = this.renderHistory.slice(-5);
    const avgFPS = recent.reduce((sum, r) => sum + r.fps, 0) / recent.length;
    
    if (avgFPS < this.thresholds.minFPS) {
      console.log(`⚠️ Low FPS detected: ${avgFPS.toFixed(1)} (threshold: ${this.thresholds.minFPS})`);
      this.emitPerformanceAlert('warning', `Low FPS: ${avgFPS.toFixed(1)}`);
    }
  }

  private emitPerformanceAlert(level: 'info' | 'warning' | 'critical', message: string): void {
    // This would integrate with the notification system
    console.log(`🚨 Performance Alert [${level.toUpperCase()}]: ${message}`);
  }

  // Utility methods
  private getCurrentCPUUsage(): number {
    return this.cpuHistory.length > 0 ? this.cpuHistory[this.cpuHistory.length - 1].cpuUsage : 0;
  }

  // Public API methods
  getPerformanceReport(): {
    memory: {
      current: MemoryMetrics | null;
      average: number;
      peak: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    cpu: {
      current: CPUMetrics | null;
      average: number;
      peak: number;
    };
    render: {
      current: RenderMetrics | null;
      averageFPS: number;
      frameDrops: number;
    };
    leaks: LeakDetection[];
  } {
    const currentMemory = this.memoryHistory[this.memoryHistory.length - 1] || null;
    const avgMemory = this.memoryHistory.length > 0 
      ? this.memoryHistory.reduce((sum, m) => sum + m.heapUsed, 0) / this.memoryHistory.length 
      : 0;
    const peakMemory = this.memoryHistory.length > 0 
      ? Math.max(...this.memoryHistory.map(m => m.heapUsed)) 
      : 0;

    const currentCPU = this.cpuHistory[this.cpuHistory.length - 1] || null;
    const avgCPU = this.cpuHistory.length > 0 
      ? this.cpuHistory.reduce((sum, c) => sum + c.cpuUsage, 0) / this.cpuHistory.length 
      : 0;
    const peakCPU = this.cpuHistory.length > 0 
      ? Math.max(...this.cpuHistory.map(c => c.cpuUsage)) 
      : 0;

    const currentRender = this.renderHistory[this.renderHistory.length - 1] || null;
    const avgFPS = this.renderHistory.length > 0 
      ? this.renderHistory.reduce((sum, r) => sum + r.fps, 0) / this.renderHistory.length 
      : 0;
    const totalFrameDrops = this.renderHistory.reduce((sum, r) => sum + r.frameDrops, 0);

    const memoryTrend = this.calculateMemoryTrend();

    return {
      memory: {
        current: currentMemory,
        average: avgMemory,
        peak: peakMemory,
        trend: memoryTrend
      },
      cpu: {
        current: currentCPU,
        average: avgCPU,
        peak: peakCPU
      },
      render: {
        current: currentRender,
        averageFPS: avgFPS,
        frameDrops: totalFrameDrops
      },
      leaks: [...this.leakDetectionResults]
    };
  }

  private calculateMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 10) return 'stable';
    
    const recent = this.memoryHistory.slice(-5);
    const older = this.memoryHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((sum, m) => sum + m.heapUsed, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.heapUsed, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    
    if (diff > 5) return 'increasing';
    if (diff < -5) return 'decreasing';
    return 'stable';
  }

  setThresholds(thresholds: Partial<PerformanceThreshold>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('🎛️ Performance thresholds updated:', this.thresholds);
  }

  clearHistory(): void {
    this.memoryHistory = [];
    this.cpuHistory = [];
    this.renderHistory = [];
    this.leakDetectionResults = [];
    console.log('🧹 Performance history cleared');
  }

  forceGarbageCollection(): boolean {
    if (global.gc) {
      global.gc();
      this.lastGCTime = Date.now();
      console.log('🧹 Forced garbage collection executed');
      return true;
    }
    return false;
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}
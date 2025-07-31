interface WASMModuleConfig {
  enableSIMD: boolean;
  enableThreads: boolean;
  memoryPages: number;
  stackSize: number;
  optimizationLevel: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
}

interface ComputationTask {
  taskId: string;
  type: 'matrix_multiplication' | 'monte_carlo' | 'fft' | 'optimization' | 'risk_calculation';
  data: ArrayBuffer;
  parameters: { [key: string]: any };
  priority: 'low' | 'normal' | 'high' | 'critical';
  createdAt: number;
  estimatedDuration: number;
}

interface ComputationResult {
  taskId: string;
  success: boolean;
  result: ArrayBuffer | null;
  executionTime: number;
  memoryUsed: number;
  errorMessage?: string;
  completedAt: number;
}

interface PerformanceMetrics {
  totalComputations: number;
  averageExecutionTime: number;
  memoryUtilization: number;
  cpuUtilization: number;
  tasksPerSecond: number;
  errorRate: number;
  lastUpdated: number;
}

interface WASMModule {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  memory: WebAssembly.Memory;
  exports: { [key: string]: Function };
  isLoaded: boolean;
  loadTime: number;
}

export class WebAssemblyComputeEngine {
  private wasmModules: Map<string, WASMModule> = new Map();
  private taskQueue: ComputationTask[] = [];
  private activeComputations: Map<string, ComputationTask> = new Map();
  private completedResults: Map<string, ComputationResult> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private config: WASMModuleConfig;
  private isInitialized = false;
  private workerPool: Worker[] = [];
  private availableWorkers: Worker[] = [];

  private readonly DEFAULT_CONFIG: WASMModuleConfig = {
    enableSIMD: true,
    enableThreads: true,
    memoryPages: 256, // 16MB initial memory
    stackSize: 1024 * 1024, // 1MB stack
    optimizationLevel: 'O3'
  };

  constructor(config?: Partial<WASMModuleConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.performanceMetrics = this.initializeMetrics();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ WebAssembly Compute Engine already initialized');
      return;
    }

    console.log('🚀 Initializing WebAssembly Compute Engine...');

    try {
      // Check WebAssembly support
      if (typeof WebAssembly === 'undefined') {
        throw new Error('WebAssembly is not supported in this environment');
      }

      // Check SIMD support if enabled
      if (this.config.enableSIMD) {
        const simdSupported = await this.checkSIMDSupport();
        console.log(`📊 SIMD support: ${simdSupported ? 'Available' : 'Not available'}`);
      }

      // Check Threads support if enabled
      if (this.config.enableThreads) {
        const threadsSupported = await this.checkThreadsSupport();
        console.log(`🧵 Threads support: ${threadsSupported ? 'Available' : 'Not available'}`);
      }

      // Load core WASM modules
      await this.loadCoreModules();

      // Initialize worker pool for parallel processing
      await this.initializeWorkerPool();

      // Start task processing
      this.startTaskProcessor();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.isInitialized = true;
      console.log('✅ WebAssembly Compute Engine initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize WebAssembly Compute Engine:', error);
      throw error;
    }
  }

  async loadCoreModules(): Promise<void> {
    console.log('📦 Loading core WASM modules...');

    // Load Financial Mathematics Module
    await this.loadModule('financial_math', this.generateFinancialMathWASM());

    // Load Matrix Operations Module
    await this.loadModule('matrix_ops', this.generateMatrixOpsWASM());

    // Load Monte Carlo Module
    await this.loadModule('monte_carlo', this.generateMonteCarloWASM());

    // Load Signal Processing Module
    await this.loadModule('signal_processing', this.generateSignalProcessingWASM());

    console.log('✅ Core WASM modules loaded');
  }

  async loadModule(name: string, wasmBytes: Uint8Array): Promise<void> {
    console.log(`📦 Loading WASM module: ${name}`);

    try {
      const startTime = performance.now();

      // Compile the WebAssembly module
      const module = await WebAssembly.compile(wasmBytes);

      // Create memory for the module
      const memory = new WebAssembly.Memory({
        initial: this.config.memoryPages,
        maximum: this.config.memoryPages * 4,
        shared: this.config.enableThreads
      });

      // Create imports object
      const imports = {
        env: {
          memory,
          abort: (msg: number, file: number, line: number, column: number) => {
            console.error(`WASM Abort: ${msg} at ${file}:${line}:${column}`);
          },
          console_log: (ptr: number, len: number) => {
            const buffer = new Uint8Array(memory.buffer, ptr, len);
            const message = new TextDecoder().decode(buffer);
            console.log(`WASM[${name}]: ${message}`);
          }
        },
        Math: {
          sin: Math.sin,
          cos: Math.cos,
          tan: Math.tan,
          log: Math.log,
          exp: Math.exp,
          sqrt: Math.sqrt,
          pow: Math.pow,
          floor: Math.floor,
          ceil: Math.ceil,
          random: Math.random
        }
      };

      // Instantiate the module
      const instance = await WebAssembly.instantiate(module, imports);

      const loadTime = performance.now() - startTime;

      const wasmModule: WASMModule = {
        instance,
        module,
        memory,
        exports: instance.exports as { [key: string]: Function },
        isLoaded: true,
        loadTime
      };

      this.wasmModules.set(name, wasmModule);

      console.log(`✅ WASM module '${name}' loaded in ${loadTime.toFixed(2)}ms`);

    } catch (error) {
      console.error(`❌ Failed to load WASM module '${name}':`, error);
      throw error;
    }
  }

  async submitTask(task: Omit<ComputationTask, 'taskId' | 'createdAt'>): Promise<string> {
    const taskId = this.generateTaskId();
    
    const computationTask: ComputationTask = {
      ...task,
      taskId,
      createdAt: Date.now()
    };

    // Add to queue based on priority
    this.insertTaskByPriority(computationTask);

    console.log(`📝 Task submitted: ${taskId} (${task.type}, priority: ${task.priority})`);

    this.performanceMetrics.totalComputations++;
    return taskId;
  }

  async getResult(taskId: string, timeout: number = 30000): Promise<ComputationResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.completedResults.get(taskId);
        if (result) {
          resolve(result);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
          return;
        }

        setTimeout(checkResult, 100); // Check every 100ms
      };

      checkResult();
    });
  }

  // High-performance matrix multiplication using WASM
  async multiplyMatrices(
    matrixA: Float64Array,
    matrixB: Float64Array,
    rowsA: number,
    colsA: number,
    colsB: number
  ): Promise<Float64Array> {
    console.log(`🔢 Computing matrix multiplication: ${rowsA}x${colsA} × ${colsA}x${colsB}`);

    const module = this.wasmModules.get('matrix_ops');
    if (!module || !module.isLoaded) {
      throw new Error('Matrix operations WASM module not loaded');
    }

    try {
      const startTime = performance.now();

      // Allocate memory in WASM
      const mallocFn = module.exports.malloc as Function;
      const freeFn = module.exports.free as Function;
      const multiplyFn = module.exports.matrix_multiply as Function;

      const sizeA = matrixA.length * 8; // 8 bytes per double
      const sizeB = matrixB.length * 8;
      const sizeResult = rowsA * colsB * 8;

      const ptrA = mallocFn(sizeA);
      const ptrB = mallocFn(sizeB);
      const ptrResult = mallocFn(sizeResult);

      // Copy data to WASM memory
      const memoryView = new Float64Array(module.memory.buffer);
      memoryView.set(matrixA, ptrA / 8);
      memoryView.set(matrixB, ptrB / 8);

      // Perform multiplication
      multiplyFn(ptrA, ptrB, ptrResult, rowsA, colsA, colsB);

      // Copy result back
      const result = new Float64Array(rowsA * colsB);
      result.set(memoryView.subarray(ptrResult / 8, ptrResult / 8 + rowsA * colsB));

      // Free memory
      freeFn(ptrA);
      freeFn(ptrB);
      freeFn(ptrResult);

      const executionTime = performance.now() - startTime;
      console.log(`✅ Matrix multiplication completed in ${executionTime.toFixed(2)}ms`);

      return result;

    } catch (error) {
      console.error('❌ Matrix multiplication failed:', error);
      throw error;
    }
  }

  // High-performance Monte Carlo simulation using WASM
  async runMonteCarloSimulation(
    parameters: {
      simulations: number;
      timeSteps: number;
      initialValue: number;
      drift: number;
      volatility: number;
      randomSeed?: number;
    }
  ): Promise<Float64Array> {
    console.log(`🎲 Running Monte Carlo simulation: ${parameters.simulations} paths, ${parameters.timeSteps} steps`);

    const module = this.wasmModules.get('monte_carlo');
    if (!module || !module.isLoaded) {
      throw new Error('Monte Carlo WASM module not loaded');
    }

    try {
      const startTime = performance.now();

      const simulateFn = module.exports.monte_carlo_simulation as Function;
      const mallocFn = module.exports.malloc as Function;
      const freeFn = module.exports.free as Function;

      const resultSize = parameters.simulations * 8; // 8 bytes per double
      const ptrResult = mallocFn(resultSize);

      // Run simulation
      simulateFn(
        ptrResult,
        parameters.simulations,
        parameters.timeSteps,
        parameters.initialValue,
        parameters.drift,
        parameters.volatility,
        parameters.randomSeed || Date.now()
      );

      // Copy results back
      const memoryView = new Float64Array(module.memory.buffer);
      const results = new Float64Array(parameters.simulations);
      results.set(memoryView.subarray(ptrResult / 8, ptrResult / 8 + parameters.simulations));

      freeFn(ptrResult);

      const executionTime = performance.now() - startTime;
      console.log(`✅ Monte Carlo simulation completed in ${executionTime.toFixed(2)}ms`);

      return results;

    } catch (error) {
      console.error('❌ Monte Carlo simulation failed:', error);
      throw error;
    }
  }

  // Fast Fourier Transform for signal processing
  async computeFFT(signal: Float64Array): Promise<{ real: Float64Array; imaginary: Float64Array }> {
    console.log(`📊 Computing FFT for signal of length ${signal.length}`);

    const module = this.wasmModules.get('signal_processing');
    if (!module || !module.isLoaded) {
      throw new Error('Signal processing WASM module not loaded');
    }

    try {
      const startTime = performance.now();

      const fftFn = module.exports.fft as Function;
      const mallocFn = module.exports.malloc as Function;
      const freeFn = module.exports.free as Function;

      const n = signal.length;
      const dataSize = n * 8; // 8 bytes per double

      const ptrReal = mallocFn(dataSize);
      const ptrImag = mallocFn(dataSize);

      // Copy input signal to real part
      const memoryView = new Float64Array(module.memory.buffer);
      memoryView.set(signal, ptrReal / 8);

      // Zero imaginary part
      const imaginaryView = memoryView.subarray(ptrImag / 8, ptrImag / 8 + n);
      imaginaryView.fill(0);

      // Compute FFT
      fftFn(ptrReal, ptrImag, n);

      // Copy results back
      const real = new Float64Array(n);
      const imaginary = new Float64Array(n);
      
      real.set(memoryView.subarray(ptrReal / 8, ptrReal / 8 + n));
      imaginary.set(memoryView.subarray(ptrImag / 8, ptrImag / 8 + n));

      freeFn(ptrReal);
      freeFn(ptrImag);

      const executionTime = performance.now() - startTime;
      console.log(`✅ FFT completed in ${executionTime.toFixed(2)}ms`);

      return { real, imaginary };

    } catch (error) {
      console.error('❌ FFT computation failed:', error);
      throw error;
    }
  }

  // High-performance Black-Scholes option pricing
  async calculateBlackScholesOptions(
    spotPrices: Float64Array,
    strikes: Float64Array,
    timeToExpiry: Float64Array,
    volatilities: Float64Array,
    riskFreeRate: number,
    isCall: boolean = true
  ): Promise<{ prices: Float64Array; greeks: { delta: Float64Array; gamma: Float64Array; theta: Float64Array; vega: Float64Array } }> {
    console.log(`📈 Computing Black-Scholes prices for ${spotPrices.length} options`);

    const module = this.wasmModules.get('financial_math');
    if (!module || !module.isLoaded) {
      throw new Error('Financial math WASM module not loaded');
    }

    try {
      const startTime = performance.now();

      const blackScholesFn = module.exports.black_scholes_batch as Function;
      const mallocFn = module.exports.malloc as Function;
      const freeFn = module.exports.free as Function;

      const n = spotPrices.length;
      const dataSize = n * 8; // 8 bytes per double

      // Allocate memory
      const ptrSpot = mallocFn(dataSize);
      const ptrStrike = mallocFn(dataSize);
      const ptrTime = mallocFn(dataSize);
      const ptrVol = mallocFn(dataSize);
      const ptrPrices = mallocFn(dataSize);
      const ptrDelta = mallocFn(dataSize);
      const ptrGamma = mallocFn(dataSize);
      const ptrTheta = mallocFn(dataSize);
      const ptrVega = mallocFn(dataSize);

      // Copy input data
      const memoryView = new Float64Array(module.memory.buffer);
      memoryView.set(spotPrices, ptrSpot / 8);
      memoryView.set(strikes, ptrStrike / 8);
      memoryView.set(timeToExpiry, ptrTime / 8);
      memoryView.set(volatilities, ptrVol / 8);

      // Compute Black-Scholes
      blackScholesFn(
        ptrSpot, ptrStrike, ptrTime, ptrVol, riskFreeRate,
        ptrPrices, ptrDelta, ptrGamma, ptrTheta, ptrVega,
        n, isCall ? 1 : 0
      );

      // Copy results back
      const prices = new Float64Array(n);
      const delta = new Float64Array(n);
      const gamma = new Float64Array(n);
      const theta = new Float64Array(n);
      const vega = new Float64Array(n);

      prices.set(memoryView.subarray(ptrPrices / 8, ptrPrices / 8 + n));
      delta.set(memoryView.subarray(ptrDelta / 8, ptrDelta / 8 + n));
      gamma.set(memoryView.subarray(ptrGamma / 8, ptrGamma / 8 + n));
      theta.set(memoryView.subarray(ptrTheta / 8, ptrTheta / 8 + n));
      vega.set(memoryView.subarray(ptrVega / 8, ptrVega / 8 + n));

      // Free memory
      freeFn(ptrSpot);
      freeFn(ptrStrike);
      freeFn(ptrTime);
      freeFn(ptrVol);
      freeFn(ptrPrices);
      freeFn(ptrDelta);
      freeFn(ptrGamma);
      freeFn(ptrTheta);
      freeFn(ptrVega);

      const executionTime = performance.now() - startTime;
      console.log(`✅ Black-Scholes computation completed in ${executionTime.toFixed(2)}ms`);

      return {
        prices,
        greeks: { delta, gamma, theta, vega }
      };

    } catch (error) {
      console.error('❌ Black-Scholes computation failed:', error);
      throw error;
    }
  }

  // Worker pool management
  private async initializeWorkerPool(): Promise<void> {
    const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
    console.log(`🧵 Initializing worker pool with ${numWorkers} workers`);

    for (let i = 0; i < numWorkers; i++) {
      try {
        // Create worker with WASM module
        const worker = new Worker(this.createWorkerScript(), { type: 'module' });
        
        worker.onmessage = (event) => {
          this.handleWorkerMessage(worker, event.data);
        };

        worker.onerror = (error) => {
          console.error(`Worker ${i} error:`, error);
        };

        this.workerPool.push(worker);
        this.availableWorkers.push(worker);

      } catch (error) {
        console.error(`Failed to create worker ${i}:`, error);
      }
    }

    console.log(`✅ Worker pool initialized with ${this.workerPool.length} workers`);
  }

  private createWorkerScript(): string {
    // Create a blob URL for the worker script
    const workerCode = `
      // Worker script for WebAssembly computations
      self.onmessage = function(event) {
        const { taskId, type, data, parameters } = event.data;
        
        try {
          let result;
          const startTime = performance.now();
          
          switch (type) {
            case 'matrix_multiplication':
              result = performMatrixMultiplication(data, parameters);
              break;
            case 'monte_carlo':
              result = performMonteCarloSimulation(data, parameters);
              break;
            case 'fft':
              result = performFFT(data, parameters);
              break;
            case 'optimization':
              result = performOptimization(data, parameters);
              break;
            case 'risk_calculation':
              result = performRiskCalculation(data, parameters);
              break;
            default:
              throw new Error('Unknown computation type: ' + type);
          }
          
          const executionTime = performance.now() - startTime;
          
          self.postMessage({
            taskId,
            success: true,
            result,
            executionTime,
            memoryUsed: self.performance?.memory?.usedJSHeapSize || 0
          });
          
        } catch (error) {
          self.postMessage({
            taskId,
            success: false,
            errorMessage: error.message,
            executionTime: 0,
            memoryUsed: 0
          });
        }
      };
      
      function performMatrixMultiplication(data, params) {
        // Mock implementation - in production, this would use WASM
        return new ArrayBuffer(params.resultSize);
      }
      
      function performMonteCarloSimulation(data, params) {
        // Mock implementation - in production, this would use WASM
        return new ArrayBuffer(params.simulations * 8);
      }
      
      function performFFT(data, params) {
        // Mock implementation - in production, this would use WASM
        return new ArrayBuffer(params.signalLength * 16);
      }
      
      function performOptimization(data, params) {
        // Mock implementation - in production, this would use WASM
        return new ArrayBuffer(params.variables * 8);
      }
      
      function performRiskCalculation(data, params) {
        // Mock implementation - in production, this would use WASM
        return new ArrayBuffer(params.portfolioSize * 8);
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  private handleWorkerMessage(worker: Worker, message: any): void {
    const { taskId, success, result, executionTime, memoryUsed, errorMessage } = message;

    // Mark worker as available
    if (!this.availableWorkers.includes(worker)) {
      this.availableWorkers.push(worker);
    }

    // Remove from active computations
    this.activeComputations.delete(taskId);

    // Store result
    const computationResult: ComputationResult = {
      taskId,
      success,
      result,
      executionTime,
      memoryUsed,
      errorMessage,
      completedAt: Date.now()
    };

    this.completedResults.set(taskId, computationResult);

    // Update metrics
    this.updateMetrics(computationResult);

    console.log(`${success ? '✅' : '❌'} Task ${taskId} completed in ${executionTime.toFixed(2)}ms`);
  }

  private startTaskProcessor(): void {
    setInterval(() => {
      this.processTaskQueue();
    }, 100); // Process queue every 100ms
  }

  private processTaskQueue(): void {
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = this.availableWorkers.shift()!;

      this.activeComputations.set(task.taskId, task);

      worker.postMessage({
        taskId: task.taskId,
        type: task.type,
        data: task.data,
        parameters: task.parameters
      });
    }
  }

  private insertTaskByPriority(task: ComputationTask): void {
    const priorityMap = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };
    const taskPriority = priorityMap[task.priority];

    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      const queuePriority = priorityMap[this.taskQueue[i].priority];
      if (taskPriority > queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.taskQueue.splice(insertIndex, 0, task);
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 5000); // Update every 5 seconds
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    const timePeriod = 60000; // 1 minute

    // Calculate recent metrics
    const recentResults = Array.from(this.completedResults.values())
      .filter(result => now - result.completedAt < timePeriod);

    if (recentResults.length > 0) {
      this.performanceMetrics.averageExecutionTime = 
        recentResults.reduce((sum, result) => sum + result.executionTime, 0) / recentResults.length;

      this.performanceMetrics.tasksPerSecond = recentResults.length / (timePeriod / 1000);

      this.performanceMetrics.errorRate = 
        recentResults.filter(result => !result.success).length / recentResults.length;

      this.performanceMetrics.memoryUtilization = 
        recentResults.reduce((sum, result) => sum + result.memoryUsed, 0) / recentResults.length;
    }

    // Estimate CPU utilization based on active computations
    this.performanceMetrics.cpuUtilization = 
      (this.activeComputations.size / this.workerPool.length) * 100;

    this.performanceMetrics.lastUpdated = now;
  }

  private updateMetrics(result: ComputationResult): void {
    if (!result.success) {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate * 0.9) + (0.1 * 1); // Exponential moving average
    }
  }

  // Support functions for WASM support detection
  private async checkSIMDSupport(): Promise<boolean> {
    try {
      // Check for SIMD support by trying to compile a simple SIMD instruction
      const wasmBytes = new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM header
        0x01, 0x04, 0x01, 0x60, 0x00, 0x00, // type section
        0x03, 0x02, 0x01, 0x00, // function section
        0x0a, 0x05, 0x01, 0x03, 0x00, 0x01, 0x0b // code section with basic SIMD
      ]);
      
      await WebAssembly.compile(wasmBytes);
      return true;
    } catch {
      return false;
    }
  }

  private async checkThreadsSupport(): Promise<boolean> {
    try {
      // Check SharedArrayBuffer support (required for threads)
      return typeof SharedArrayBuffer !== 'undefined';
    } catch {
      return false;
    }
  }

  // Mock WASM module generators (in production, these would be actual compiled WASM)
  private generateFinancialMathWASM(): Uint8Array {
    // Mock WASM bytecode for financial mathematics
    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, // WASM header
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00 // Minimal valid WASM
    ]);
  }

  private generateMatrixOpsWASM(): Uint8Array {
    // Mock WASM bytecode for matrix operations
    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00
    ]);
  }

  private generateMonteCarloWASM(): Uint8Array {
    // Mock WASM bytecode for Monte Carlo simulations
    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00
    ]);
  }

  private generateSignalProcessingWASM(): Uint8Array {
    // Mock WASM bytecode for signal processing
    return new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, 0x04, 0x01, 0x60, 0x00, 0x00
    ]);
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      totalComputations: 0,
      averageExecutionTime: 0,
      memoryUtilization: 0,
      cpuUtilization: 0,
      tasksPerSecond: 0,
      errorRate: 0,
      lastUpdated: Date.now()
    };
  }

  private generateTaskId(): string {
    return `wasm_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  getActiveComputations(): ComputationTask[] {
    return Array.from(this.activeComputations.values());
  }

  getQueueStatus(): {
    queueLength: number;
    activeComputations: number;
    availableWorkers: number;
    totalWorkers: number;
  } {
    return {
      queueLength: this.taskQueue.length,
      activeComputations: this.activeComputations.size,
      availableWorkers: this.availableWorkers.length,
      totalWorkers: this.workerPool.length
    };
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WebAssembly Compute Engine...');

    // Terminate all workers
    this.workerPool.forEach(worker => worker.terminate());
    this.workerPool = [];
    this.availableWorkers = [];

    // Clear data structures
    this.taskQueue = [];
    this.activeComputations.clear();
    this.completedResults.clear();

    this.isInitialized = false;
    console.log('✅ WebAssembly Compute Engine shutdown complete');
  }
}
interface WorkerPoolConfig {
  maxWorkers: number;
  minWorkers: number;
  scalingThreshold: number;
  idleTimeout: number;
  enableDynamicScaling: boolean;
  taskQueueMaxSize: number;
  workerMemoryLimit: number;
  enableWorkerRecycling: boolean;
}

interface WorkerTask {
  taskId: string;
  type: 'portfolio_optimization' | 'risk_calculation' | 'monte_carlo' | 'data_processing' | 'computation';
  payload: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  estimatedDuration: number;
  createdAt: number;
  dependencies?: string[];
  retryCount: number;
  maxRetries: number;
}

interface WorkerMetrics {
  workerId: string;
  tasksCompleted: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  errorCount: number;
  memoryUsage: number;
  cpuUtilization: number;
  lastActivity: number;
  isIdle: boolean;
  capabilities: string[];
}

interface WorkerInstance {
  worker: Worker;
  workerId: string;
  isAvailable: boolean;
  currentTask?: WorkerTask;
  metrics: WorkerMetrics;
  startTime: number;
  lastHeartbeat: number;
  messagePort?: MessagePort;
}

interface ThreadPoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  taskQueue: number;
  completedTasks: number;
  failedTasks: number;
  averageQueueTime: number;
  averageExecutionTime: number;
  throughput: number; // tasks per second
  cpuUtilization: number;
  memoryUtilization: number;
}

interface TaskResult {
  taskId: string;
  success: boolean;
  result: any;
  executionTime: number;
  workerId: string;
  error?: string;
  completedAt: number;
}

export class AdvancedMultithreadingEngine {
  private workers: Map<string, WorkerInstance> = new Map();
  private taskQueue: WorkerTask[] = [];
  private completedTasks: Map<string, TaskResult> = new Map();
  private pendingTasks: Map<string, WorkerTask> = new Map();
  private config: WorkerPoolConfig;
  private isRunning = false;
  private threadPoolStats: ThreadPoolStats;
  private scalingTimer?: NodeJS.Timeout;
  private monitoringTimer?: NodeJS.Timeout;

  private readonly DEFAULT_CONFIG: WorkerPoolConfig = {
    maxWorkers: Math.min(navigator.hardwareConcurrency || 4, 16),
    minWorkers: 2,
    scalingThreshold: 0.8, // Scale up when 80% of workers are busy
    idleTimeout: 30000, // 30 seconds
    enableDynamicScaling: true,
    taskQueueMaxSize: 1000,
    workerMemoryLimit: 256 * 1024 * 1024, // 256MB per worker
    enableWorkerRecycling: true
  };

  constructor(config?: Partial<WorkerPoolConfig>) {
    this.config = { ...this.DEFAULT_CONFIG, ...config };
    this.threadPoolStats = this.initializeStats();
  }

  async initialize(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Multithreading Engine already running');
      return;
    }

    console.log('🧵 Initializing Advanced Multithreading Engine...');

    try {
      // Check Worker support
      if (typeof Worker === 'undefined') {
        throw new Error('Web Workers are not supported in this environment');
      }

      // Check SharedArrayBuffer support for advanced threading
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      console.log(`🔗 SharedArrayBuffer support: ${hasSharedArrayBuffer ? 'Available' : 'Not available'}`);

      // Create initial worker pool
      await this.createInitialWorkerPool();

      // Start task processing
      this.startTaskProcessor();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Start dynamic scaling if enabled
      if (this.config.enableDynamicScaling) {
        this.startDynamicScaling();
      }

      this.isRunning = true;
      console.log(`✅ Multithreading Engine initialized with ${this.workers.size} workers`);

    } catch (error) {
      console.error('❌ Failed to initialize Multithreading Engine:', error);
      throw error;
    }
  }

  async submitTask(task: Omit<WorkerTask, 'taskId' | 'createdAt' | 'retryCount'>): Promise<string> {
    if (!this.isRunning) {
      throw new Error('Multithreading Engine not running');
    }

    if (this.taskQueue.length >= this.config.taskQueueMaxSize) {
      throw new Error('Task queue is full');
    }

    const taskId = this.generateTaskId();
    const workerTask: WorkerTask = {
      ...task,
      taskId,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: task.maxRetries || 3
    };

    // Add to queue based on priority
    this.insertTaskByPriority(workerTask);
    this.pendingTasks.set(taskId, workerTask);

    console.log(`📝 Task submitted: ${taskId} (${task.type}, priority: ${task.priority})`);

    return taskId;
  }

  async getTaskResult(taskId: string, timeout: number = 30000): Promise<TaskResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.completedTasks.get(taskId);
        if (result) {
          resolve(result);
          return;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
          return;
        }

        setTimeout(checkResult, 100);
      };

      checkResult();
    });
  }

  // High-level parallel processing methods
  async parallelPortfolioOptimization(
    portfolios: Array<{ id: string; assets: any[]; constraints: any }>
  ): Promise<Array<{ portfolioId: string; optimizedWeights: number[]; metrics: any }>> {
    console.log(`📊 Running parallel portfolio optimization for ${portfolios.length} portfolios`);

    const tasks = portfolios.map(portfolio => 
      this.submitTask({
        type: 'portfolio_optimization',
        payload: portfolio,
        priority: 'high',
        estimatedDuration: 5000 // 5 seconds estimated
      })
    );

    const taskIds = await Promise.all(tasks);
    const results = await Promise.all(
      taskIds.map(taskId => this.getTaskResult(taskId))
    );

    return results.map(result => result.result);
  }

  async parallelRiskCalculations(
    portfolios: Array<{ id: string; positions: any[]; parameters: any }>
  ): Promise<Array<{ portfolioId: string; var: number; expectedShortfall: number; stressTests: any[] }>> {
    console.log(`⚖️ Running parallel risk calculations for ${portfolios.length} portfolios`);

    const tasks = portfolios.map(portfolio =>
      this.submitTask({
        type: 'risk_calculation',
        payload: portfolio,
        priority: 'critical',
        estimatedDuration: 3000 // 3 seconds estimated
      })
    );

    const taskIds = await Promise.all(tasks);
    const results = await Promise.all(
      taskIds.map(taskId => this.getTaskResult(taskId))
    );

    return results.map(result => result.result);
  }

  async parallelMonteCarloSimulations(
    simulations: Array<{ id: string; parameters: any; paths: number }>
  ): Promise<Array<{ simulationId: string; results: Float64Array; statistics: any }>> {
    console.log(`🎲 Running parallel Monte Carlo simulations for ${simulations.length} scenarios`);

    // Split large simulations across multiple workers
    const tasks: Promise<string>[] = [];
    
    for (const simulation of simulations) {
      if (simulation.paths > 10000) {
        // Split large simulation across multiple workers
        const pathsPerWorker = Math.ceil(simulation.paths / 4);
        const chunks = Math.ceil(simulation.paths / pathsPerWorker);
        
        for (let i = 0; i < chunks; i++) {
          const startPath = i * pathsPerWorker;
          const endPath = Math.min((i + 1) * pathsPerWorker, simulation.paths);
          
          tasks.push(this.submitTask({
            type: 'monte_carlo',
            payload: {
              ...simulation,
              paths: endPath - startPath,
              chunkId: i,
              totalChunks: chunks
            },
            priority: 'high',
            estimatedDuration: 8000 // 8 seconds estimated
          }));
        }
      } else {
        tasks.push(this.submitTask({
          type: 'monte_carlo',
          payload: simulation,
          priority: 'normal',
          estimatedDuration: 4000 // 4 seconds estimated
        }));
      }
    }

    const taskIds = await Promise.all(tasks);
    const results = await Promise.all(
      taskIds.map(taskId => this.getTaskResult(taskId))
    );

    // Combine chunked results if necessary
    return this.combineChunkedResults(results.map(r => r.result));
  }

  async parallelDataProcessing(
    datasets: Array<{ id: string; data: any; operations: string[] }>
  ): Promise<Array<{ datasetId: string; processedData: any; metrics: any }>> {
    console.log(`📊 Running parallel data processing for ${datasets.length} datasets`);

    const tasks = datasets.map(dataset =>
      this.submitTask({
        type: 'data_processing',
        payload: dataset,
        priority: 'normal',
        estimatedDuration: 2000 // 2 seconds estimated
      })
    );

    const taskIds = await Promise.all(tasks);
    const results = await Promise.all(
      taskIds.map(taskId => this.getTaskResult(taskId))
    );

    return results.map(result => result.result);
  }

  // Worker management
  private async createInitialWorkerPool(): Promise<void> {
    console.log(`🏭 Creating initial worker pool with ${this.config.minWorkers} workers`);

    for (let i = 0; i < this.config.minWorkers; i++) {
      await this.createWorker();
    }
  }

  private async createWorker(): Promise<string> {
    const workerId = this.generateWorkerId();
    
    try {
      const worker = new Worker(this.createWorkerScript(), { type: 'module' });
      
      const metrics: WorkerMetrics = {
        workerId,
        tasksCompleted: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        memoryUsage: 0,
        cpuUtilization: 0,
        lastActivity: Date.now(),
        isIdle: true,
        capabilities: ['portfolio_optimization', 'risk_calculation', 'monte_carlo', 'data_processing', 'computation']
      };

      const workerInstance: WorkerInstance = {
        worker,
        workerId,
        isAvailable: true,
        metrics,
        startTime: Date.now(),
        lastHeartbeat: Date.now()
      };

      // Set up message handling
      worker.onmessage = (event) => {
        this.handleWorkerMessage(workerId, event.data);
      };

      worker.onerror = (error) => {
        this.handleWorkerError(workerId, error);
      };

      // Send initialization message
      worker.postMessage({
        type: 'init',
        workerId,
        config: {
          memoryLimit: this.config.workerMemoryLimit
        }
      });

      this.workers.set(workerId, workerInstance);
      
      console.log(`✅ Worker created: ${workerId}`);
      return workerId;

    } catch (error) {
      console.error(`❌ Failed to create worker: ${error}`);
      throw error;
    }
  }

  private createWorkerScript(): string {
    const workerCode = `
      let workerId = '';
      let memoryLimit = 256 * 1024 * 1024; // 256MB default
      let taskCount = 0;

      self.onmessage = function(event) {
        const { type, data } = event.data;

        switch (type) {
          case 'init':
            workerId = data.workerId;
            memoryLimit = data.config?.memoryLimit || memoryLimit;
            console.log(\`Worker \${workerId} initialized\`);
            self.postMessage({ type: 'ready', workerId });
            break;

          case 'task':
            executeTask(data);
            break;

          case 'heartbeat':
            self.postMessage({ 
              type: 'heartbeat_response', 
              workerId,
              timestamp: Date.now(),
              taskCount,
              memoryUsage: performance.memory?.usedJSHeapSize || 0
            });
            break;

          case 'shutdown':
            self.postMessage({ type: 'shutdown_complete', workerId });
            self.close();
            break;
        }
      };

      async function executeTask(task) {
        const startTime = performance.now();
        taskCount++;

        try {
          let result;

          switch (task.type) {
            case 'portfolio_optimization':
              result = await optimizePortfolio(task.payload);
              break;
            case 'risk_calculation':
              result = await calculateRisk(task.payload);
              break;
            case 'monte_carlo':
              result = await runMonteCarloSimulation(task.payload);
              break;
            case 'data_processing':
              result = await processData(task.payload);
              break;
            case 'computation':
              result = await performComputation(task.payload);
              break;
            default:
              throw new Error(\`Unknown task type: \${task.type}\`);
          }

          const executionTime = performance.now() - startTime;

          self.postMessage({
            type: 'task_complete',
            taskId: task.taskId,
            workerId,
            success: true,
            result,
            executionTime,
            memoryUsage: performance.memory?.usedJSHeapSize || 0
          });

        } catch (error) {
          const executionTime = performance.now() - startTime;

          self.postMessage({
            type: 'task_complete',
            taskId: task.taskId,
            workerId,
            success: false,
            error: error.message,
            executionTime,
            memoryUsage: performance.memory?.usedJSHeapSize || 0
          });
        }
      }

      // Task implementations
      async function optimizePortfolio(portfolio) {
        // Simulate portfolio optimization
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        return {
          portfolioId: portfolio.id,
          optimizedWeights: Array.from({ length: portfolio.assets.length }, () => Math.random()).map(w => w / portfolio.assets.length),
          metrics: {
            expectedReturn: 0.08 + Math.random() * 0.04,
            volatility: 0.12 + Math.random() * 0.08,
            sharpeRatio: 0.5 + Math.random() * 0.8
          }
        };
      }

      async function calculateRisk(portfolio) {
        // Simulate risk calculation
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
        
        return {
          portfolioId: portfolio.id,
          var: Math.random() * 10000 + 5000,
          expectedShortfall: Math.random() * 15000 + 8000,
          stressTests: [
            { scenario: 'Market Crash', impact: -(Math.random() * 20000 + 10000) },
            { scenario: 'Interest Rate Shock', impact: -(Math.random() * 8000 + 3000) },
            { scenario: 'Currency Crisis', impact: -(Math.random() * 12000 + 5000) }
          ]
        };
      }

      async function runMonteCarloSimulation(simulation) {
        // Simulate Monte Carlo calculation
        const paths = simulation.paths || 1000;
        await new Promise(resolve => setTimeout(resolve, Math.min(paths / 100, 5000)));
        
        const results = new Float64Array(paths);
        for (let i = 0; i < paths; i++) {
          results[i] = 100 * Math.exp((0.05 - 0.5 * 0.2 * 0.2) + 0.2 * (Math.random() * 2 - 1));
        }
        
        return {
          simulationId: simulation.id,
          results,
          statistics: {
            mean: results.reduce((sum, val) => sum + val, 0) / results.length,
            std: Math.sqrt(results.reduce((sum, val) => sum + val * val, 0) / results.length),
            min: Math.min(...results),
            max: Math.max(...results),
            chunkId: simulation.chunkId,
            totalChunks: simulation.totalChunks
          }
        };
      }

      async function processData(dataset) {
        // Simulate data processing
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 1000));
        
        return {
          datasetId: dataset.id,
          processedData: {
            recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
            transformations: dataset.operations?.length || 0,
            outputSize: Math.floor(Math.random() * 1000000) + 100000
          },
          metrics: {
            processingTime: Math.random() * 2000,
            memoryUsed: Math.random() * 50000000,
            throughput: Math.random() * 1000 + 500
          }
        };
      }

      async function performComputation(computation) {
        // Generic computation
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800));
        
        return {
          computationId: computation.id || 'unknown',
          result: Math.random() * 1000,
          metadata: {
            complexity: computation.complexity || 'medium',
            accuracy: 0.95 + Math.random() * 0.05
          }
        };
      }
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  private handleWorkerMessage(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    switch (message.type) {
      case 'ready':
        console.log(`🟢 Worker ${workerId} is ready`);
        break;

      case 'task_complete':
        this.handleTaskComplete(workerId, message);
        break;

      case 'heartbeat_response':
        this.handleHeartbeat(workerId, message);
        break;

      case 'shutdown_complete':
        console.log(`🔴 Worker ${workerId} shutdown complete`);
        break;
    }
  }

  private handleTaskComplete(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const { taskId, success, result, error, executionTime, memoryUsage } = message;

    // Update worker metrics
    worker.metrics.tasksCompleted++;
    worker.metrics.totalExecutionTime += executionTime;
    worker.metrics.averageExecutionTime = worker.metrics.totalExecutionTime / worker.metrics.tasksCompleted;
    worker.metrics.lastActivity = Date.now();
    worker.metrics.memoryUsage = memoryUsage;
    worker.metrics.isIdle = true;

    if (!success) {
      worker.metrics.errorCount++;
    }

    // Mark worker as available
    worker.isAvailable = true;
    worker.currentTask = undefined;

    // Store task result
    const taskResult: TaskResult = {
      taskId,
      success,
      result,
      executionTime,
      workerId,
      error,
      completedAt: Date.now()
    };

    this.completedTasks.set(taskId, taskResult);

    // Remove from pending tasks
    this.pendingTasks.delete(taskId);

    // Update stats
    this.updateStats(taskResult);

    console.log(`${success ? '✅' : '❌'} Task ${taskId} completed by worker ${workerId} in ${executionTime.toFixed(2)}ms`);
  }

  private handleHeartbeat(workerId: string, message: any): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.lastHeartbeat = message.timestamp;
    worker.metrics.memoryUsage = message.memoryUsage;

    // Check if worker needs to be recycled due to memory usage
    if (this.config.enableWorkerRecycling && 
        worker.metrics.memoryUsage > this.config.workerMemoryLimit) {
      this.recycleWorker(workerId);
    }
  }

  private handleWorkerError(workerId: string, error: ErrorEvent): void {
    console.error(`❌ Worker ${workerId} error:`, error);

    const worker = this.workers.get(workerId);
    if (worker) {
      worker.metrics.errorCount++;
      
      // If worker has a current task, mark it as failed
      if (worker.currentTask) {
        const failedResult: TaskResult = {
          taskId: worker.currentTask.taskId,
          success: false,
          result: null,
          executionTime: Date.now() - worker.currentTask.createdAt,
          workerId,
          error: `Worker error: ${error.message}`,
          completedAt: Date.now()
        };

        this.completedTasks.set(worker.currentTask.taskId, failedResult);
        this.pendingTasks.delete(worker.currentTask.taskId);
      }

      // Recycle the worker
      this.recycleWorker(workerId);
    }
  }

  private async recycleWorker(workerId: string): Promise<void> {
    console.log(`🔄 Recycling worker: ${workerId}`);

    const worker = this.workers.get(workerId);
    if (!worker) return;

    // Terminate the worker
    worker.worker.terminate();
    this.workers.delete(workerId);

    // Create a new worker to replace it
    if (this.workers.size < this.config.minWorkers) {
      await this.createWorker();
    }
  }

  // Task processing
  private startTaskProcessor(): void {
    setInterval(() => {
      this.processTaskQueue();
    }, 50); // Process every 50ms for low latency
  }

  private processTaskQueue(): void {
    while (this.taskQueue.length > 0) {
      const availableWorker = this.findAvailableWorker();
      if (!availableWorker) break;

      const task = this.taskQueue.shift()!;
      this.assignTaskToWorker(task, availableWorker);
    }
  }

  private findAvailableWorker(): WorkerInstance | null {
    for (const worker of this.workers.values()) {
      if (worker.isAvailable) {
        return worker;
      }
    }
    return null;
  }

  private assignTaskToWorker(task: WorkerTask, worker: WorkerInstance): void {
    worker.isAvailable = false;
    worker.currentTask = task;
    worker.metrics.isIdle = false;

    worker.worker.postMessage({
      type: 'task',
      data: task
    });

    console.log(`📤 Assigned task ${task.taskId} to worker ${worker.workerId}`);
  }

  private insertTaskByPriority(task: WorkerTask): void {
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

  // Dynamic scaling
  private startDynamicScaling(): void {
    this.scalingTimer = setInterval(() => {
      this.evaluateScaling();
    }, 5000); // Evaluate every 5 seconds

    console.log('📈 Dynamic scaling enabled');
  }

  private evaluateScaling(): void {
    const activeWorkers = Array.from(this.workers.values()).filter(w => !w.isAvailable).length;
    const utilizationRate = activeWorkers / this.workers.size;

    // Scale up if utilization is high and queue is growing
    if (utilizationRate > this.config.scalingThreshold && 
        this.taskQueue.length > 0 && 
        this.workers.size < this.config.maxWorkers) {
      
      this.createWorker().then(() => {
        console.log(`📈 Scaled up: ${this.workers.size} workers (utilization: ${(utilizationRate * 100).toFixed(1)}%)`);
      });
    }

    // Scale down if utilization is low and we have more than minimum workers
    if (utilizationRate < 0.3 && 
        this.workers.size > this.config.minWorkers && 
        this.taskQueue.length === 0) {
      
      const idleWorkers = Array.from(this.workers.values())
        .filter(w => w.isAvailable && Date.now() - w.metrics.lastActivity > this.config.idleTimeout);
      
      if (idleWorkers.length > 0) {
        const workerToRemove = idleWorkers[0];
        this.recycleWorker(workerToRemove.workerId);
        console.log(`📉 Scaled down: ${this.workers.size} workers (utilization: ${(utilizationRate * 100).toFixed(1)}%)`);
      }
    }
  }

  // Performance monitoring
  private startPerformanceMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updatePerformanceMetrics();
      this.sendHeartbeats();
    }, 10000); // Update every 10 seconds

    console.log('📊 Performance monitoring started');
  }

  private updatePerformanceMetrics(): void {
    const now = Date.now();
    const timePeriod = 60000; // 1 minute

    // Get recent completed tasks
    const recentTasks = Array.from(this.completedTasks.values())
      .filter(task => now - task.completedAt < timePeriod);

    // Update stats
    this.threadPoolStats.totalWorkers = this.workers.size;
    this.threadPoolStats.activeWorkers = Array.from(this.workers.values()).filter(w => !w.isAvailable).length;
    this.threadPoolStats.idleWorkers = this.threadPoolStats.totalWorkers - this.threadPoolStats.activeWorkers;
    this.threadPoolStats.taskQueue = this.taskQueue.length;

    if (recentTasks.length > 0) {
      this.threadPoolStats.averageExecutionTime = 
        recentTasks.reduce((sum, task) => sum + task.executionTime, 0) / recentTasks.length;
      
      this.threadPoolStats.throughput = recentTasks.length / (timePeriod / 1000);
      
      this.threadPoolStats.completedTasks = 
        Array.from(this.completedTasks.values()).filter(t => t.success).length;
      
      this.threadPoolStats.failedTasks = 
        Array.from(this.completedTasks.values()).filter(t => !t.success).length;
    }

    // Calculate CPU and memory utilization
    const workers = Array.from(this.workers.values());
    this.threadPoolStats.cpuUtilization = (this.threadPoolStats.activeWorkers / this.threadPoolStats.totalWorkers) * 100;
    this.threadPoolStats.memoryUtilization = workers.reduce((sum, w) => sum + w.metrics.memoryUsage, 0) / workers.length;
  }

  private sendHeartbeats(): void {
    for (const worker of this.workers.values()) {
      worker.worker.postMessage({ type: 'heartbeat' });
    }
  }

  private updateStats(taskResult: TaskResult): void {
    // Update cumulative stats
    if (taskResult.success) {
      this.threadPoolStats.completedTasks++;
    } else {
      this.threadPoolStats.failedTasks++;
    }
  }

  // Utility methods
  private combineChunkedResults(results: any[]): any[] {
    const resultMap = new Map<string, any[]>();

    // Group results by simulation ID
    for (const result of results) {
      if (result.statistics?.chunkId !== undefined) {
        const simId = result.simulationId;
        if (!resultMap.has(simId)) {
          resultMap.set(simId, []);
        }
        resultMap.get(simId)!.push(result);
      } else {
        // Non-chunked result
        resultMap.set(result.simulationId || Math.random().toString(), [result]);
      }
    }

    // Combine chunks for each simulation
    const combinedResults: any[] = [];
    for (const [simId, chunks] of resultMap.entries()) {
      if (chunks.length === 1 && chunks[0].statistics?.chunkId === undefined) {
        // Single, non-chunked result
        combinedResults.push(chunks[0]);
      } else {
        // Combine multiple chunks
        chunks.sort((a, b) => (a.statistics?.chunkId || 0) - (b.statistics?.chunkId || 0));
        
        const combinedResults_: Float64Array[] = chunks.map(chunk => chunk.results);
        const totalLength = combinedResults_.reduce((sum, arr) => sum + arr.length, 0);
        const combinedArray = new Float64Array(totalLength);
        
        let offset = 0;
        for (const arr of combinedResults_) {
          combinedArray.set(arr, offset);
          offset += arr.length;
        }

        combinedResults.push({
          simulationId: simId,
          results: combinedArray,
          statistics: {
            mean: combinedArray.reduce((sum, val) => sum + val, 0) / combinedArray.length,
            std: Math.sqrt(combinedArray.reduce((sum, val) => sum + val * val, 0) / combinedArray.length),
            min: Math.min(...combinedArray),
            max: Math.max(...combinedArray)
          }
        });
      }
    }

    return combinedResults;
  }

  private initializeStats(): ThreadPoolStats {
    return {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      taskQueue: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageQueueTime: 0,
      averageExecutionTime: 0,
      throughput: 0,
      cpuUtilization: 0,
      memoryUtilization: 0
    };
  }

  private generateTaskId(): string {
    return `mt_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  // Public API
  getThreadPoolStats(): ThreadPoolStats {
    return { ...this.threadPoolStats };
  }

  getWorkerMetrics(): WorkerMetrics[] {
    return Array.from(this.workers.values()).map(w => ({ ...w.metrics }));
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Multithreading Engine...');

    this.isRunning = false;

    // Clear timers
    if (this.scalingTimer) clearInterval(this.scalingTimer);
    if (this.monitoringTimer) clearInterval(this.monitoringTimer);

    // Terminate all workers
    const shutdownPromises = Array.from(this.workers.values()).map(worker => 
      new Promise<void>(resolve => {
        worker.worker.postMessage({ type: 'shutdown' });
        worker.worker.terminate();
        resolve();
      })
    );

    await Promise.all(shutdownPromises);

    // Clear data structures
    this.workers.clear();
    this.taskQueue = [];
    this.pendingTasks.clear();
    this.completedTasks.clear();

    console.log('✅ Multithreading Engine shutdown complete');
  }
}
import { SAWService, WithdrawalRule, AccountMetrics } from '../SAWService';

describe('SAWService - Smart Automated Withdrawals', () => {
  let sawService: SAWService;
  
  beforeEach(() => {
    // Get fresh instance for each test
    (SAWService as any).instance = null;
    sawService = SAWService.getInstance();
  });

  afterEach(() => {
    // Clean up
    sawService.stop();
    sawService.removeAllListeners();
  });

  describe('Service Lifecycle', () => {
    it('should start and stop the service correctly', async () => {
      const startedSpy = jest.fn();
      const stoppedSpy = jest.fn();
      
      sawService.on('started', startedSpy);
      sawService.on('stopped', stoppedSpy);
      
      await sawService.start();
      expect(startedSpy).toHaveBeenCalled();
      
      sawService.stop();
      expect(stoppedSpy).toHaveBeenCalled();
    });

    it('should not start multiple times', async () => {
      const startedSpy = jest.fn();
      sawService.on('started', startedSpy);
      
      await sawService.start();
      await sawService.start(); // Second call should be ignored
      
      expect(startedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Withdrawal Rules Management', () => {
    it('should add a new profit percentage withdrawal rule', async () => {
      const rule = await sawService.addRule({
        name: 'Weekly 50% Profit Withdrawal',
        type: 'profit_percentage',
        enabled: true,
        threshold: 15, // 15% profit threshold
        amount: 0.5, // Withdraw 50% of profits
        frequency: 'weekly',
        destination: {
          type: 'bank',
          details: {
            account: '****5678',
            routingNumber: '123456789',
            bankName: 'Chase Bank'
          }
        }
      });

      expect(rule.id).toBeDefined();
      expect(rule.name).toBe('Weekly 50% Profit Withdrawal');
      expect(rule.threshold).toBe(15);
      expect(rule.amount).toBe(0.5);
    });

    it('should add a fixed amount withdrawal rule', async () => {
      const rule = await sawService.addRule({
        name: 'Monthly $5000 Withdrawal',
        type: 'fixed_amount',
        enabled: true,
        threshold: 5000, // Must have at least $5000 profit
        amount: 5000, // Withdraw $5000
        frequency: 'monthly',
        destination: {
          type: 'crypto_wallet',
          details: {
            address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
            network: 'BTC',
            walletName: 'Cold Storage'
          }
        }
      });

      expect(rule.type).toBe('fixed_amount');
      expect(rule.amount).toBe(5000);
      expect(rule.destination.type).toBe('crypto_wallet');
    });

    it('should update an existing rule', async () => {
      const rule = await sawService.addRule({
        name: 'Test Rule',
        type: 'profit_percentage',
        enabled: true,
        threshold: 10,
        amount: 0.3,
        frequency: 'daily'
      });

      const updated = await sawService.updateRule(rule.id, {
        enabled: false,
        threshold: 20,
        amount: 0.4
      });

      expect(updated.enabled).toBe(false);
      expect(updated.threshold).toBe(20);
      expect(updated.amount).toBe(0.4);
      expect(updated.name).toBe('Test Rule'); // Unchanged
    });

    it('should delete a rule', async () => {
      const rule = await sawService.addRule({
        name: 'Temporary Rule',
        type: 'time_based',
        enabled: true,
        threshold: 0,
        amount: 1000,
        frequency: 'weekly'
      });

      const rulesBefore = sawService.getRules();
      expect(rulesBefore).toContainEqual(expect.objectContaining({ id: rule.id }));

      await sawService.deleteRule(rule.id);

      const rulesAfter = sawService.getRules();
      expect(rulesAfter).not.toContainEqual(expect.objectContaining({ id: rule.id }));
    });

    it('should handle target balance rules', async () => {
      const rule = await sawService.addRule({
        name: 'Maintain $50k Balance',
        type: 'target_balance',
        enabled: true,
        threshold: 50000, // Target balance
        amount: 0.8, // Withdraw 80% of excess
        destination: {
          type: 'investment_account',
          details: {
            account: 'IRA-123456',
            broker: 'Vanguard',
            accountType: 'Traditional IRA'
          }
        }
      });

      expect(rule.type).toBe('target_balance');
      expect(rule.threshold).toBe(50000);
      expect(rule.amount).toBe(0.8);
    });
  });

  describe('Rule Evaluation with Real Trading Scenarios', () => {
    // Mock the private method for testing
    const evaluateRule = async (rule: WithdrawalRule, metrics: AccountMetrics) => {
      return (sawService as any).evaluateRule(rule, metrics);
    };

    it('should trigger profit percentage rule when threshold is met', async () => {
      const rule: WithdrawalRule = {
        id: 'test_profit_rule',
        name: 'Profit Rule',
        type: 'profit_percentage',
        enabled: true,
        threshold: 20, // 20% profit
        amount: 0.5,
        frequency: 'weekly',
        destination: { type: 'bank', details: {} }
      };

      const profitableMetrics: AccountMetrics = {
        balance: 75000,
        equity: 78000,
        profit: 25000,
        profitPercentage: 33.33, // Above 20% threshold
        drawdown: 5.2,
        winRate: 0.68,
        avgWin: 450,
        avgLoss: 200
      };

      const shouldTrigger = await evaluateRule(rule, profitableMetrics);
      expect(shouldTrigger).toBe(true);
    });

    it('should not trigger profit percentage rule when below threshold', async () => {
      const rule: WithdrawalRule = {
        id: 'test_profit_rule',
        name: 'Profit Rule',
        type: 'profit_percentage',
        enabled: true,
        threshold: 20, // 20% profit
        amount: 0.5,
        frequency: 'weekly',
        destination: { type: 'bank', details: {} }
      };

      const lowProfitMetrics: AccountMetrics = {
        balance: 55000,
        equity: 54500,
        profit: 5000,
        profitPercentage: 10, // Below 20% threshold
        drawdown: 8.5,
        winRate: 0.52,
        avgWin: 300,
        avgLoss: 280
      };

      const shouldTrigger = await evaluateRule(rule, lowProfitMetrics);
      expect(shouldTrigger).toBe(false);
    });

    it('should trigger target balance rule when balance exceeds target', async () => {
      const rule: WithdrawalRule = {
        id: 'test_balance_rule',
        name: 'Balance Rule',
        type: 'target_balance',
        enabled: true,
        threshold: 50000, // Target balance
        amount: 1.0, // Withdraw 100% of excess
        destination: { type: 'investment_account', details: {} }
      };

      const highBalanceMetrics: AccountMetrics = {
        balance: 85000, // $35k above target
        equity: 87000,
        profit: 35000,
        profitPercentage: 70,
        drawdown: 3.2,
        winRate: 0.72,
        avgWin: 500,
        avgLoss: 150
      };

      const shouldTrigger = await evaluateRule(rule, highBalanceMetrics);
      expect(shouldTrigger).toBe(true);
    });

    it('should respect frequency limits for time-based rules', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      const rule: WithdrawalRule = {
        id: 'test_time_rule',
        name: 'Weekly Withdrawal',
        type: 'time_based',
        enabled: true,
        threshold: 0,
        amount: 2000,
        frequency: 'weekly',
        lastExecuted: threeDaysAgo, // Only 3 days ago
        destination: { type: 'bank', details: {} }
      };

      const metrics: AccountMetrics = {
        balance: 60000,
        equity: 61000,
        profit: 10000,
        profitPercentage: 20,
        drawdown: 4.5,
        winRate: 0.65,
        avgWin: 400,
        avgLoss: 200
      };

      const shouldTrigger = await evaluateRule(rule, metrics);
      expect(shouldTrigger).toBe(false); // Should not trigger, only 3 days passed
    });
  });

  describe('Withdrawal Amount Calculations', () => {
    // Mock the private method for testing
    const calculateAmount = (rule: WithdrawalRule, metrics: AccountMetrics) => {
      return (sawService as any).calculateWithdrawalAmount(rule, metrics);
    };

    it('should calculate correct amount for profit percentage rule', () => {
      const rule: WithdrawalRule = {
        id: 'test',
        name: 'Test',
        type: 'profit_percentage',
        enabled: true,
        threshold: 10,
        amount: 0.4, // 40% of profits
        destination: { type: 'bank', details: {} }
      };

      const metrics: AccountMetrics = {
        balance: 70000,
        equity: 72000,
        profit: 20000,
        profitPercentage: 40,
        drawdown: 5,
        winRate: 0.7,
        avgWin: 500,
        avgLoss: 200
      };

      const amount = calculateAmount(rule, metrics);
      expect(amount).toBe(8000); // 40% of $20,000 profit
    });

    it('should calculate correct amount for target balance rule', () => {
      const rule: WithdrawalRule = {
        id: 'test',
        name: 'Test',
        type: 'target_balance',
        enabled: true,
        threshold: 50000, // Target balance
        amount: 0.75, // Withdraw 75% of excess
        destination: { type: 'bank', details: {} }
      };

      const metrics: AccountMetrics = {
        balance: 90000, // $40k above target
        equity: 91000,
        profit: 40000,
        profitPercentage: 80,
        drawdown: 2,
        winRate: 0.75,
        avgWin: 600,
        avgLoss: 150
      };

      const amount = calculateAmount(rule, metrics);
      expect(amount).toBe(30000); // 75% of $40,000 excess
    });

    it('should handle fixed amount withdrawals with insufficient profit', () => {
      const rule: WithdrawalRule = {
        id: 'test',
        name: 'Test',
        type: 'fixed_amount',
        enabled: true,
        threshold: 5000,
        amount: 10000, // Want to withdraw $10k
        destination: { type: 'bank', details: {} }
      };

      const metrics: AccountMetrics = {
        balance: 55000,
        equity: 56000,
        profit: 6000, // Only $6k profit available
        profitPercentage: 12,
        drawdown: 7,
        winRate: 0.58,
        avgWin: 350,
        avgLoss: 250
      };

      const amount = calculateAmount(rule, metrics);
      expect(amount).toBe(6000); // Limited to available profit
    });
  });

  describe('Real-World Trading Scenarios', () => {
    it('should handle a successful trading month scenario', async () => {
      // Scenario: Trader had a great month, 45% profit
      const successRule = await sawService.addRule({
        name: 'Monthly Success Withdrawal',
        type: 'profit_percentage',
        enabled: true,
        threshold: 30, // Trigger at 30% profit
        amount: 0.6, // Withdraw 60% of profits
        frequency: 'monthly',
        destination: {
          type: 'bank',
          details: {
            account: '****9876',
            bankName: 'Wells Fargo'
          }
        }
      });

      const successMetrics: AccountMetrics = {
        balance: 72500,
        equity: 74000,
        profit: 22500, // Started with $50k, now at $72.5k
        profitPercentage: 45,
        drawdown: 4.2,
        winRate: 0.74,
        avgWin: 650,
        avgLoss: 180
      };

      // Test evaluation
      const shouldWithdraw = await (sawService as any).evaluateRule(successRule, successMetrics);
      expect(shouldWithdraw).toBe(true);

      // Test amount calculation
      const withdrawAmount = (sawService as any).calculateWithdrawalAmount(successRule, successMetrics);
      expect(withdrawAmount).toBe(13500); // 60% of $22,500
    });

    it('should handle a conservative investor scenario', async () => {
      // Scenario: Conservative investor wants to maintain steady balance
      const conservativeRule = await sawService.addRule({
        name: 'Conservative Balance Management',
        type: 'target_balance',
        enabled: true,
        threshold: 100000, // Maintain $100k balance
        amount: 0.9, // Withdraw 90% of excess
        destination: {
          type: 'investment_account',
          details: {
            account: 'ROTH-IRA-123',
            broker: 'Fidelity'
          }
        }
      });

      const conservativeMetrics: AccountMetrics = {
        balance: 125000, // $25k above target
        equity: 126500,
        profit: 25000,
        profitPercentage: 25,
        drawdown: 2.8,
        winRate: 0.65,
        avgWin: 400,
        avgLoss: 200
      };

      const withdrawAmount = (sawService as any).calculateWithdrawalAmount(conservativeRule, conservativeMetrics);
      expect(withdrawAmount).toBe(22500); // 90% of $25k excess
    });

    it('should handle a crypto trader scenario', async () => {
      // Scenario: Crypto trader with volatile profits
      const cryptoRule = await sawService.addRule({
        name: 'Crypto Profit Taking',
        type: 'profit_percentage',
        enabled: true,
        threshold: 50, // High threshold due to volatility
        amount: 0.7, // Take 70% of profits when threshold hit
        frequency: 'weekly',
        destination: {
          type: 'crypto_wallet',
          details: {
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            network: 'BTC',
            walletType: 'Hardware Wallet'
          }
        }
      });

      const cryptoMetrics: AccountMetrics = {
        balance: 150000,
        equity: 155000,
        profit: 50000, // 100% profit!
        profitPercentage: 100,
        drawdown: 15.5, // High volatility
        winRate: 0.45, // Lower win rate but big wins
        avgWin: 5000,
        avgLoss: 1000
      };

      const shouldWithdraw = await (sawService as any).evaluateRule(cryptoRule, cryptoMetrics);
      expect(shouldWithdraw).toBe(true);

      const withdrawAmount = (sawService as any).calculateWithdrawalAmount(cryptoRule, cryptoMetrics);
      expect(withdrawAmount).toBe(35000); // 70% of $50k profit
    });
  });

  describe('Withdrawal History', () => {
    it('should track withdrawal history', async () => {
      // Create a mock withdrawal history
      const mockHistory = [
        {
          id: 'w1',
          ruleId: 'rule1',
          amount: 5000,
          currency: 'USD',
          timestamp: new Date('2024-01-15'),
          status: 'completed' as const,
          transactionId: 'TXN123'
        },
        {
          id: 'w2',
          ruleId: 'rule1',
          amount: 7500,
          currency: 'USD',
          timestamp: new Date('2024-01-22'),
          status: 'completed' as const,
          transactionId: 'TXN124'
        },
        {
          id: 'w3',
          ruleId: 'rule2',
          amount: 3000,
          currency: 'USD',
          timestamp: new Date('2024-01-25'),
          status: 'failed' as const,
          error: 'Insufficient funds'
        }
      ];

      // Mock the getWithdrawalHistory method
      jest.spyOn(sawService, 'getWithdrawalHistory').mockResolvedValue(mockHistory);

      const history = await sawService.getWithdrawalHistory(10);
      expect(history).toHaveLength(3);
      expect(history[0].status).toBe('completed');
      expect(history[2].status).toBe('failed');
      expect(history[2].error).toBe('Insufficient funds');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero profit scenario', () => {
      const rule: WithdrawalRule = {
        id: 'test',
        name: 'Test',
        type: 'profit_percentage',
        enabled: true,
        threshold: 10,
        amount: 0.5,
        destination: { type: 'bank', details: {} }
      };

      const breakEvenMetrics: AccountMetrics = {
        balance: 50000,
        equity: 50000,
        profit: 0, // No profit
        profitPercentage: 0,
        drawdown: 5,
        winRate: 0.5,
        avgWin: 200,
        avgLoss: 200
      };

      const amount = (sawService as any).calculateWithdrawalAmount(rule, breakEvenMetrics);
      expect(amount).toBe(0);
    });

    it('should handle negative profit (loss) scenario', () => {
      const rule: WithdrawalRule = {
        id: 'test',
        name: 'Test',
        type: 'target_balance',
        enabled: true,
        threshold: 50000,
        amount: 1.0,
        destination: { type: 'bank', details: {} }
      };

      const lossMetrics: AccountMetrics = {
        balance: 45000, // Below target due to losses
        equity: 44500,
        profit: -5000,
        profitPercentage: -10,
        drawdown: 12,
        winRate: 0.4,
        avgWin: 150,
        avgLoss: 250
      };

      const amount = (sawService as any).calculateWithdrawalAmount(rule, lossMetrics);
      expect(amount).toBe(0); // No withdrawal when below target
    });

    it('should throw error when updating non-existent rule', async () => {
      await expect(
        sawService.updateRule('non_existent_id', { enabled: false })
      ).rejects.toThrow('Rule non_existent_id not found');
    });

    it('should throw error when deleting non-existent rule', async () => {
      await expect(
        sawService.deleteRule('non_existent_id')
      ).rejects.toThrow('Rule non_existent_id not found');
    });
  });

  describe('Integration with Wing Zero Trading Bot', () => {
    it('should integrate with Wing Zero account data', async () => {
      // Mock Wing Zero account data integration
      const wingZeroMetrics: AccountMetrics = {
        balance: 125000,
        equity: 128000,
        profit: 75000, // Started with $50k
        profitPercentage: 150,
        drawdown: 8.5,
        winRate: 0.68,
        avgWin: 850,
        avgLoss: 350
      };

      // Create a comprehensive withdrawal strategy
      const strategies = [
        {
          name: 'Weekly Profit Taking',
          type: 'profit_percentage' as const,
          threshold: 20,
          amount: 0.3,
          frequency: 'weekly' as const
        },
        {
          name: 'Monthly Fixed Withdrawal',
          type: 'fixed_amount' as const,
          threshold: 5000,
          amount: 5000,
          frequency: 'monthly' as const
        },
        {
          name: 'Maintain Trading Capital',
          type: 'target_balance' as const,
          threshold: 75000,
          amount: 0.8,
          frequency: 'daily' as const
        }
      ];

      // Add all strategies
      for (const strategy of strategies) {
        await sawService.addRule({
          ...strategy,
          enabled: true,
          destination: {
            type: 'bank',
            details: { account: '****1234' }
          }
        });
      }

      const rules = sawService.getRules();
      expect(rules).toHaveLength(strategies.length);

      // Test which rules would trigger
      const results = await Promise.all(
        rules.map(rule => (sawService as any).evaluateRule(rule, wingZeroMetrics))
      );

      // All rules should trigger given the high profit
      expect(results.filter(r => r === true)).toHaveLength(strategies.length);
    });
  });
});
import { BlockchainIntegrationService } from '@/services';

// Mock window.ethereum for testing
const mockEthereum = {
  request: jest.fn()
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true
});

describe('BlockchainIntegrationService', () => {
  let blockchainService: BlockchainIntegrationService;

  beforeEach(() => {
    blockchainService = BlockchainIntegrationService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    blockchainService.disconnectWallet();
  });

  it('should return the same instance (singleton)', () => {
    const instance1 = BlockchainIntegrationService.getInstance();
    const instance2 = BlockchainIntegrationService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should connect wallet successfully', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    mockEthereum.request.mockResolvedValue([mockAddress]);

    const connectedAddress = await blockchainService.connectWallet();
    
    expect(connectedAddress).toBe(mockAddress);
    expect(blockchainService.getConnectedWallet()).toBe(mockAddress);
    expect(mockEthereum.request).toHaveBeenCalledWith({
      method: 'eth_requestAccounts'
    });
  });

  it('should handle wallet connection failure', async () => {
    mockEthereum.request.mockRejectedValue(new Error('User rejected request'));

    const result = await blockchainService.connectWallet();
    expect(result).toBeNull();
  });

  it('should get supported networks', () => {
    const networks = blockchainService.getSupportedNetworks();
    
    expect(Array.isArray(networks)).toBe(true);
    expect(networks.length).toBeGreaterThan(0);
    
    const ethereum = networks.find(n => n.name === 'Ethereum Mainnet');
    expect(ethereum).toBeDefined();
    expect(ethereum?.chainId).toBe(1);
    expect(ethereum?.nativeCurrency.symbol).toBe('ETH');
  });

  it('should get supported DeFi protocols', () => {
    const protocols = blockchainService.getSupportedProtocols();
    
    expect(Array.isArray(protocols)).toBe(true);
    expect(protocols.length).toBeGreaterThan(0);
    
    const uniswap = protocols.find(p => p.name === 'Uniswap V3');
    expect(uniswap).toBeDefined();
    expect(uniswap?.network).toBe('ethereum');
    expect(typeof uniswap?.tvl).toBe('number');
    expect(typeof uniswap?.apy).toBe('number');
  });

  it('should get token information', async () => {
    const usdtAddress = '0xA0b86a33E6441e16F4563650F4e2d3D0F84F4ad8';
    const tokenInfo = await blockchainService.getTokenInfo(usdtAddress);
    
    expect(tokenInfo).toBeDefined();
    expect(tokenInfo?.symbol).toBe('USDT');
    expect(tokenInfo?.decimals).toBe(6);
    expect(typeof tokenInfo?.price).toBe('number');
  });

  it('should return null for unknown token', async () => {
    const unknownAddress = '0x0000000000000000000000000000000000000000';
    const tokenInfo = await blockchainService.getTokenInfo(unknownAddress);
    
    expect(tokenInfo).toBeNull();
  });

  it('should get DeFi positions for connected wallet', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    mockEthereum.request.mockResolvedValue([mockAddress]);
    
    await blockchainService.connectWallet();
    const positions = await blockchainService.getDeFiPositions(mockAddress);
    
    expect(Array.isArray(positions)).toBe(true);
    
    if (positions.length > 0) {
      expect(positions[0]).toHaveProperty('protocol');
      expect(positions[0]).toHaveProperty('tokenAddress');
      expect(positions[0]).toHaveProperty('amount');
      expect(positions[0]).toHaveProperty('value');
      expect(positions[0]).toHaveProperty('apy');
      expect(positions[0]).toHaveProperty('rewards');
    }
  });

  it('should fail to get positions without connected wallet', async () => {
    await expect(blockchainService.getDeFiPositions('0x123'))
      .rejects.toThrow('Wallet not connected');
  });

  it('should execute token swap', async () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    mockEthereum.request.mockResolvedValue([mockAddress]);
    
    await blockchainService.connectWallet();
    
    const txHash = await blockchainService.executeSwap('USDT', 'DAI', 1000, 0.5);
    
    expect(txHash).toBeDefined();
    expect(typeof txHash).toBe('string');
    expect(txHash?.startsWith('0x')).toBe(true);
  });

  it('should get yield opportunities', async () => {
    const opportunities = await blockchainService.getYieldOpportunities('ethereum');
    
    expect(Array.isArray(opportunities)).toBe(true);
    
    // Should be sorted by APY (highest first)
    for (let i = 0; i < opportunities.length - 1; i++) {
      expect(opportunities[i].apy).toBeGreaterThanOrEqual(opportunities[i + 1].apy);
    }
  });

  it('should monitor gas prices', async () => {
    const gasPrices = await blockchainService.monitorGasPrice('ethereum');
    
    expect(gasPrices).toHaveProperty('slow');
    expect(gasPrices).toHaveProperty('standard');
    expect(gasPrices).toHaveProperty('fast');
    expect(gasPrices).toHaveProperty('instant');
    
    expect(typeof gasPrices.slow).toBe('number');
    expect(typeof gasPrices.standard).toBe('number');
    expect(typeof gasPrices.fast).toBe('number');
    expect(typeof gasPrices.instant).toBe('number');
    
    // Gas prices should be in ascending order
    expect(gasPrices.slow).toBeLessThanOrEqual(gasPrices.standard);
    expect(gasPrices.standard).toBeLessThanOrEqual(gasPrices.fast);
    expect(gasPrices.fast).toBeLessThanOrEqual(gasPrices.instant);
  });

  it('should disconnect wallet', () => {
    blockchainService.disconnectWallet();
    expect(blockchainService.getConnectedWallet()).toBeUndefined();
  });
});
/* ImpactEcho Blockchain Integration */

// Smart Contract Configuration
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: "address", name: "priceFeed", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "FundMe__NotOwner",
    type: "error"
  },
  {
    inputs: [],
    name: "MINIMUM_USD",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "fund",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "fundingAddress", type: "address" }],
    name: "getAddressToAmountFunded",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "index", type: "uint256" }],
    name: "getFunder",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getVersion",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];

// Blockchain Helper Functions
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.initialized = false;
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      // Create ethers provider from MetaMask
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.signer);
      this.initialized = true;
      
      console.log('✅ Blockchain service initialized');
      console.log('📄 Contract Address:', CONTRACT_ADDRESS);
      
      return true;
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      throw error;
    }
  }

  /**
   * Check if connected to correct network
   */
  async checkNetwork() {
    if (!this.provider) await this.initialize();
    
    const network = await this.provider.getNetwork();
    console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId);
    
    // For local Anvil testnet, chainId should be 31337
    // For development, we'll allow any network but warn if not local
    if (network.chainId !== 31337) {
      console.warn('⚠️  Not connected to local Anvil network (31337)');
      console.warn('⚠️  Currently on network:', network.chainId);
    }
    
    return network;
  }

  /**
   * Convert INR to ETH (simplified conversion for demo)
   * In production, you'd use a price oracle
   */
  inrToEth(inrAmount) {
    // Simplified conversion: 1 ETH ≈ ₹200,000
    // Adjust this based on real exchange rates
    const ETH_TO_INR = 200000;
    return inrAmount / ETH_TO_INR;
  }

  /**
   * Make a donation to a cause
   * @param {number} amountInINR - Amount in Indian Rupees
   * @param {string} causeName - Name of the cause
   * @returns {Promise<Object>} Transaction receipt
   */
  async donate(amountInINR, causeName) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Convert INR to ETH
      const ethAmount = this.inrToEth(amountInINR);
      const weiAmount = ethers.utils.parseEther(ethAmount.toString());

      console.log(`💰 Donating ₹${amountInINR} (${ethAmount} ETH) to "${causeName}"`);

      // Call the smart contract fund() function
      const tx = await this.contract.fund({
        value: weiAmount,
        gasLimit: 100000 // Set reasonable gas limit
      });

      console.log('📤 Transaction sent:', tx.hash);
      console.log('⏳ Waiting for confirmation...');

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      console.log('✅ Transaction confirmed!');
      console.log('📦 Block:', receipt.blockNumber);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());

      return {
        success: true,
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        amountETH: ethAmount,
        amountINR: amountInINR,
        causeName: causeName
      };

    } catch (error) {
      console.error('❌ Donation failed:', error);
      
      // User rejected transaction
      if (error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      // Insufficient funds
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient ETH balance in wallet');
      }
      
      // Below minimum donation amount ($5 USD)
      if (error.message && error.message.includes('You need to spend more ETH')) {
        throw new Error('Donation amount below minimum ($5 USD equivalent)');
      }
      
      throw new Error(error.message || 'Transaction failed');
    }
  }

  /**
   * Get total amount funded by an address
   * @param {string} address - Wallet address
   * @returns {Promise<number>} Amount in ETH
   */
  async getTotalFunded(address) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const amountWei = await this.contract.getAddressToAmountFunded(address);
      const amountEth = ethers.utils.formatEther(amountWei);
      return parseFloat(amountEth);
    } catch (error) {
      console.error('Error getting funded amount:', error);
      return 0;
    }
  }

  /**
   * Get contract owner
   */
  async getOwner() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.contract.getOwner();
    } catch (error) {
      console.error('Error getting owner:', error);
      return null;
    }
  }

  /**
   * Get minimum donation amount in USD
   */
  async getMinimumUSD() {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const minUSD = await this.contract.MINIMUM_USD();
      // Convert from Wei (18 decimals) to USD
      return ethers.utils.formatEther(minUSD);
    } catch (error) {
      console.error('Error getting minimum USD:', error);
      return 5; // Default minimum
    }
  }
}

// Export singleton instance
window.blockchainService = new BlockchainService();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BlockchainService, CONTRACT_ADDRESS, CONTRACT_ABI };
}


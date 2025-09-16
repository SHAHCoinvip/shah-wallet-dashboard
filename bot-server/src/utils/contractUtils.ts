import { ethers } from 'ethers';
import { ShahSwapABI } from '../contracts/ShahSwapABI';
import { ShahStakingABI } from '../contracts/ShahStakingABI';
import { ERC20ABI } from '../contracts/ERC20ABI';

// Contract addresses - Updated for DEX V3
const SHAH_TOKEN_ADDRESS = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8';
const SHAHSWAP_CONTRACT = '0x791c34Df045071eB9896DAfA57e3db46CBEBA11b';
const SHAH_STAKING_CONTRACT = '0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00';
const SHAH_GOLD_NFT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual NFT contract
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo');

// Initialize contracts
const shahTokenContract = new ethers.Contract(SHAH_TOKEN_ADDRESS, ERC20ABI, provider);
const shahSwapContract = new ethers.Contract(SHAHSWAP_CONTRACT, ShahSwapABI, provider);
const shahStakingContract = new ethers.Contract(SHAH_STAKING_CONTRACT, ShahStakingABI, provider);
const shahGoldNftContract = new ethers.Contract(SHAH_GOLD_NFT_ADDRESS, ERC20ABI, provider);

// Tier definitions
const TIERS = {
  0: { name: 'No Tier', minAmount: 0, apy: 0 },
  1: { name: 'Bronze', minAmount: 100, apy: 10 },
  2: { name: 'Silver', minAmount: 1000, apy: 15 },
  3: { name: 'Gold', minAmount: 5000, apy: 20 }
};

export async function getSHAHBalance(walletAddress: string): Promise<string> {
  try {
    const balance = await shahTokenContract.balanceOf(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching SHAH balance:', error);
    return '0';
  }
}

export async function getSwapPreview(walletAddress: string): Promise<{
  shahBalance: string;
  estimatedEth: string;
  slippage: string;
}> {
  try {
    const shahBalance = await getSHAHBalance(walletAddress);
    const shahBalanceWei = ethers.parseEther(shahBalance);
    
    if (parseFloat(shahBalance) <= 0) {
      return {
        shahBalance: '0',
        estimatedEth: '0',
        slippage: '1%'
      };
    }

    // Get swap estimate from ShahSwap
    const path = [SHAH_TOKEN_ADDRESS, WETH_ADDRESS];
    const amounts = await shahSwapContract.getAmountsOut(shahBalanceWei, path);
    const estimatedEth = ethers.formatEther(amounts[1]);
    
    // Calculate slippage (simplified - in real scenario you'd get this from the contract)
    const slippage = '1%';

    return {
      shahBalance,
      estimatedEth,
      slippage
    };
  } catch (error) {
    console.error('Error getting swap preview:', error);
    return {
      shahBalance: '0',
      estimatedEth: '0',
      slippage: '1%'
    };
  }
}

export async function getStakePreview(walletAddress: string): Promise<{
  shahBalance: string;
  currentTier: string;
  tierAPY: number;
  hasNftBoost: boolean;
  effectiveAPY: number;
  currentStaked: string;
  currentRewards: string;
}> {
  try {
    const shahBalance = await getSHAHBalance(walletAddress);
    const balanceNum = parseFloat(shahBalance);

    // Determine tier based on balance
    let tier = 0;
    if (balanceNum >= 5000) tier = 3;
    else if (balanceNum >= 1000) tier = 2;
    else if (balanceNum >= 100) tier = 1;

    const tierInfo = TIERS[tier as keyof typeof TIERS];
    
    // Check NFT boost
    let hasNftBoost = false;
    try {
      const nftBalance = await shahGoldNftContract.balanceOf(walletAddress);
      hasNftBoost = nftBalance > 0n;
    } catch (error) {
      console.log('NFT contract not available, skipping NFT boost check');
    }

    // Get current staking info
    let currentStaked = '0';
    let currentRewards = '0';
    try {
      const stakeInfo = await shahStakingContract.getStakeInfo(walletAddress);
      currentStaked = ethers.formatEther(stakeInfo[0]);
      currentRewards = ethers.formatEther(stakeInfo[1]);
    } catch (error) {
      console.log('Staking contract not available, using default values');
    }

    const effectiveAPY = hasNftBoost ? tierInfo.apy + 5 : tierInfo.apy;

    return {
      shahBalance,
      currentTier: tierInfo.name,
      tierAPY: tierInfo.apy,
      hasNftBoost,
      effectiveAPY,
      currentStaked,
      currentRewards
    };
  } catch (error) {
    console.error('Error getting stake preview:', error);
    return {
      shahBalance: '0',
      currentTier: 'No Tier',
      tierAPY: 0,
      hasNftBoost: false,
      effectiveAPY: 0,
      currentStaked: '0',
      currentRewards: '0'
    };
  }
} 
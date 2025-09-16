import { formatEther, parseEther } from "viem";

// Farming contract address
export const SHAH_FARM_ADDRESS = "0xB63A61874636669C0D71C20CBfE0DcB3E00aFafD";

// LP Token addresses
export const LP_ADDRESSES = {
  SHAH_ETH: "0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e",
  SHAH_USDT: "0x4c741106D435a6167d1117B1f37f1Eb584639C66",
  SHAH_DAI: "0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048",
};

// Pool configuration
export const POOLS = [
  {
    id: 0,
    name: "SHAH/ETH",
    token1: "SHAH",
    token2: "ETH",
    lpTokenAddress: LP_ADDRESSES.SHAH_ETH,
    color: "from-blue-500 to-purple-600",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0xedf16bAeC9e63ce65e52d986AB7e583FeDD9374e?embed=1&info=0"
  },
  {
    id: 1,
    name: "SHAH/USDT",
    token1: "SHAH",
    token2: "USDT",
    lpTokenAddress: LP_ADDRESSES.SHAH_USDT,
    color: "from-green-500 to-teal-600",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0x4c741106D435a6167d1117B1f37f1Eb584639C66?embed=1&info=0"
  },
  {
    id: 2,
    name: "SHAH/DAI",
    token1: "SHAH",
    token2: "DAI",
    lpTokenAddress: LP_ADDRESSES.SHAH_DAI,
    color: "from-yellow-500 to-orange-600",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0x07Dc3fBff2969E3F2c2a438B3D560c9149C3A048?embed=1&info=0"
  }
];

// Calculate APY for a pool
export const calculateAPY = (
  rewardRate: number,
  poolAllocation: number,
  totalAllocation: number,
  poolTVL: number
): number => {
  const blocksPerYear = 2300000; // Ethereum blocks per year
  const poolRewardRate = (rewardRate * poolAllocation) / totalAllocation;
  const apy = ((poolRewardRate * blocksPerYear) / poolTVL) * 100;
  return isFinite(apy) ? apy : 0;
};

// Format LP token amount
export const formatLPAmount = (amount: bigint | string): string => {
  try {
    const formatted = formatEther(amount);
    return parseFloat(formatted).toFixed(4);
  } catch {
    return "0.0000";
  }
};

// Format SHAH amount
export const formatSHAHAmount = (amount: bigint | string): string => {
  try {
    const formatted = formatEther(amount);
    return parseFloat(formatted).toFixed(4);
  } catch {
    return "0.0000";
  }
};

// Get pool by ID
export const getPoolById = (id: number) => {
  return POOLS.find(pool => pool.id === id);
};

// Get pool by LP token address
export const getPoolByLPAddress = (lpAddress: string) => {
  return POOLS.find(pool => pool.lpTokenAddress.toLowerCase() === lpAddress.toLowerCase());
};

// Validate amount for staking/unstaking
export const validateAmount = (amount: string): boolean => {
  try {
    const num = parseFloat(amount);
    return num > 0 && isFinite(num);
  } catch {
    return false;
  }
};

// Parse amount for contract calls
export const parseAmount = (amount: string): bigint => {
  return parseEther(amount);
};


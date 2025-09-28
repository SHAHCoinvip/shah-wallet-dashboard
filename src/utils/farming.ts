import { parseEther, formatEther } from "viem";
import { ShahFarmAddress } from "@/ABI/ShahFarmABI";

// Export the farm address for use in components
export const SHAH_FARM_ADDRESS = ShahFarmAddress;

// Pool configuration
export const POOLS = [
  {
    id: 0,
    name: "SHAH/ETH LP",
    token1: "SHAH",
    token2: "ETH",
    lpTokenAddress: "0x85F618962C57E0420128388b45Fae9a9C5f989d0", // SHAH/ETH pair
    color: "from-blue-500 to-purple-500",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0x85F618962C57E0420128388b45Fae9a9C5f989d0"
  },
  {
    id: 1,
    name: "SHAH/USDT LP",
    token1: "SHAH",
    token2: "USDT",
    lpTokenAddress: "0x35582bc7582a5E4950f8A239709dcc1356719ca0", // SHAH/USDT pair
    color: "from-green-500 to-teal-500",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0x35582bc7582a5E4950f8A239709dcc1356719ca0"
  },
  {
    id: 2,
    name: "SHAH/DAI LP",
    token1: "SHAH",
    token2: "DAI",
    lpTokenAddress: "0x3948CfA4f3d2d637D", // SHAH/DAI pair (placeholder)
    color: "from-yellow-500 to-orange-500",
    geckoTerminalUrl: "https://www.geckoterminal.com/eth/pools/0x3948CfA4f3d2d637D"
  }
];

// Utility functions for formatting amounts
export function formatLPAmount(amount: bigint): string {
  return formatEther(amount);
}

export function formatSHAHAmount(amount: bigint): string {
  return formatEther(amount);
}

export function parseAmount(amount: string): bigint {
  return parseEther(amount);
}

export function validateAmount(amount: string): boolean {
  if (!amount || amount === "") return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

// Calculate APY based on reward rate, allocation points, and TVL
export function calculateAPY(
  rewardRate: number,
  poolAllocPoint: number,
  totalAllocPoint: number,
  poolTVL: number
): number {
  if (poolTVL === 0 || totalAllocPoint === 0) return 0;
  
  // Calculate pool's share of rewards
  const poolShare = poolAllocPoint / totalAllocPoint;
  const poolRewardRate = rewardRate * poolShare;
  
  // Calculate APY (simplified calculation)
  // Assuming 1 block = 12 seconds, 1 year = 365 days
  const blocksPerYear = (365 * 24 * 60 * 60) / 12; // ~2,628,000 blocks per year
  const annualRewards = poolRewardRate * blocksPerYear;
  
  // APY = (annual rewards / TVL) * 100
  const apy = (annualRewards / poolTVL) * 100;
  
  return apy;
}

// Get pool by ID
export function getPoolById(id: number) {
  return POOLS.find(pool => pool.id === id);
}

// Get pool by LP token address
export function getPoolByLpToken(lpTokenAddress: string) {
  return POOLS.find(pool => pool.lpTokenAddress.toLowerCase() === lpTokenAddress.toLowerCase());
}
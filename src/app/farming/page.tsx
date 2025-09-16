"use client";

import { useState, useEffect } from "react";

// Force dynamic rendering
export const dynamic = 'force-dynamic'
import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { ShahFarmABI } from "@/ABI/ShahFarmABI";
import { SHAH_FARM_ADDRESS, POOLS, calculateAPY, formatLPAmount, formatSHAHAmount, validateAmount, parseAmount } from "@/utils/farming";

// Portfolio Summary Component
const PortfolioSummary = ({ 
  totalStaked, 
  totalPendingRewards, 
  onHarvestAll, 
  isLoading 
}: {
  totalStaked: string;
  totalPendingRewards: string;
  onHarvestAll: () => void;
  isLoading: boolean;
}) => {
  return (
    <div className="bg-gradient-to-r from-green-500 to-yellow-500 rounded-xl shadow-lg p-6 mb-8">
      <div className="text-white">
        <h2 className="text-2xl font-bold mb-4">🌾 Your Farming Portfolio</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">Total Value Staked</p>
            <p className="text-2xl font-bold">{totalStaked} LP</p>
            <p className="text-sm opacity-75">≈ $0.00 USD</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm opacity-90">Total Pending Rewards</p>
            <p className="text-2xl font-bold text-green-200">
              {parseFloat(totalPendingRewards).toFixed(4)} SHAH
            </p>
            <p className="text-sm opacity-75">≈ $0.00 USD</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-4 flex items-center justify-center">
            <button
              onClick={onHarvestAll}
              disabled={isLoading || parseFloat(totalPendingRewards) === 0}
              className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Processing..." : "Harvest All"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal component for staking/unstaking
const ActionModal = ({ 
  isOpen, 
  onClose, 
  action, 
  poolName, 
  maxAmount, 
  onSubmit, 
  isLoading 
}: {
  isOpen: boolean;
  onClose: () => void;
  action: "stake" | "unstake";
  poolName: string;
  maxAmount: string;
  onSubmit: (amount: string) => void;
  isLoading: boolean;
}) => {
  const [amount, setAmount] = useState("");

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
        <h3 className="text-xl font-bold mb-4">
          {action === "stake" ? "Stake" : "Unstake"} {poolName} LP Tokens
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Max: {maxAmount}</span>
            <button
              onClick={() => setAmount(maxAmount)}
              className="text-blue-500 hover:text-blue-700"
            >
              Max
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(amount)}
            disabled={isLoading || !validateAmount(amount)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : action === "stake" ? "Stake" : "Unstake"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Pool card component
const PoolCard = ({ 
  pool, 
  onStake, 
  onUnstake, 
  onHarvest,
  isLoading 
}: {
  pool: typeof POOLS[0];
  onStake: (pid: number) => void;
  onUnstake: (pid: number) => void;
  onHarvest: (pid: number) => void;
  isLoading: boolean;
}) => {
  const { address } = useAccount();

  // Contract reads for this specific pool
  const { data: poolInfo } = useContractRead({
    address: SHAH_FARM_ADDRESS,
    abi: ShahFarmABI,
    functionName: "getPoolInfo",
    args: [BigInt(pool.id)],
    enabled: !!address,
  });

  const { data: userInfo } = useContractRead({
    address: SHAH_FARM_ADDRESS,
    abi: ShahFarmABI,
    functionName: "getUserInfo",
    args: [BigInt(pool.id), address!],
    enabled: !!address,
  });

  const { data: pendingReward } = useContractRead({
    address: SHAH_FARM_ADDRESS,
    abi: ShahFarmABI,
    functionName: "pendingReward",
    args: [BigInt(pool.id), address!],
    enabled: !!address,
  });

  const stakedAmount = userInfo ? formatLPAmount(userInfo.amount) : "0.0000";
  const totalStaked = poolInfo ? formatLPAmount(poolInfo.totalStaked) : "0.0000";
  const pendingRewardFormatted = pendingReward ? formatSHAHAmount(pendingReward) : "0.0000";
  
  // Calculate APY using utility function
  const rewardRate = 1; // 1 SHAH per block
  const poolAlloc = poolInfo ? Number(poolInfo.allocPoint) : 0;
  const totalAlloc = 1500; // SHAH/ETH (1000) + SHAH/USDT (500) = 1500
  const poolTVL = parseFloat(totalStaked) || 1; // Avoid division by zero
  
  const apy = calculateAPY(rewardRate, poolAlloc, totalAlloc, poolTVL);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${pool.color} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{pool.name}</h3>
            <p className="text-sm opacity-90">Pool ID: {pool.id}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">S</span>
            </div>
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">{pool.token2 === "ETH" ? "Ξ" : pool.token2 === "USDT" ? "T" : "D"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-500 text-sm">Loading chart...</div>
          </div>
          <iframe
            src={pool.geckoTerminalUrl}
            width="100%"
            height="200"
            frameBorder="0"
            allowFullScreen
            className="rounded-lg relative z-10"
            onLoad={(e) => {
              // Hide loading state when iframe loads
              const target = e.target as HTMLIFrameElement;
              const parent = target.parentElement;
              if (parent) {
                const loadingDiv = parent.querySelector('div');
                if (loadingDiv) {
                  loadingDiv.style.display = 'none';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* LP Token Address */}
        <div>
          <p className="text-sm text-gray-500">LP Token</p>
          <p className="text-sm font-mono text-gray-700 truncate">
            {pool.lpTokenAddress}
          </p>
        </div>

        {/* User's Staked Balance */}
        <div>
          <p className="text-sm text-gray-500">Your Staked</p>
          <p className="text-lg font-semibold">{parseFloat(stakedAmount).toFixed(4)} LP</p>
        </div>

        {/* Pending Rewards */}
        <div>
          <p className="text-sm text-gray-500">Pending SHAH</p>
          <p className="text-lg font-semibold text-green-600">
            {parseFloat(pendingRewardFormatted).toFixed(4)} SHAH
          </p>
        </div>

        {/* Total Staked */}
        <div>
          <p className="text-sm text-gray-500">Total Staked</p>
          <p className="text-lg font-semibold">{parseFloat(totalStaked).toFixed(2)} LP</p>
        </div>

        {/* APY */}
        <div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-500">Estimated APY</p>
            <div className="relative group">
              <span className="text-gray-400 cursor-help">ⓘ</span>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                APY is estimated based on reward rate and current liquidity
              </div>
            </div>
          </div>
          <p className="text-lg font-semibold text-blue-600">
            {apy.toFixed(2)}%
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => onStake(pool.id)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Stake
          </button>
          <button
            onClick={() => onUnstake(pool.id)}
            disabled={isLoading || parseFloat(stakedAmount) === 0}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unstake
          </button>
          <button
            onClick={() => onHarvest(pool.id)}
            disabled={isLoading || parseFloat(pendingRewardFormatted) === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Harvest
          </button>
        </div>
      </div>
    </div>
  );
};

export default function FarmingPage() {
  const { address, isConnected } = useAccount();
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "stake" | "unstake";
    poolId: number;
  }>({ isOpen: false, action: "stake", poolId: 0 });
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Contract reads for pool data
  const { data: poolLength } = useContractRead({
    address: SHAH_FARM_ADDRESS,
    abi: ShahFarmABI,
    functionName: "poolLength",
  });

  const { data: rewardRate } = useContractRead({
    address: SHAH_FARM_ADDRESS,
    abi: ShahFarmABI,
    functionName: "rewardRate",
  });

  // Contract writes
  const { writeContract: deposit, data: depositData } = useWriteContract();

  const { writeContract: withdraw, data: withdrawData } = useWriteContract();

  const { writeContract: harvest, data: harvestData } = useWriteContract();

  // Wait for transactions
  const { isLoading: isDepositLoading, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositData,
  });

  const { isLoading: isWithdrawLoading, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawData,
  });

  const { isLoading: isHarvestLoading, isSuccess: isHarvestSuccess } = useWaitForTransactionReceipt({
    hash: harvestData,
  });

  // Show success notifications
  useEffect(() => {
    if (isDepositSuccess) {
      setNotification({ show: true, message: "Successfully staked LP tokens!", type: "success" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    }
  }, [isDepositSuccess]);

  useEffect(() => {
    if (isWithdrawSuccess) {
      setNotification({ show: true, message: "Successfully unstaked LP tokens!", type: "success" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    }
  }, [isWithdrawSuccess]);

  useEffect(() => {
    if (isHarvestSuccess) {
      setNotification({ show: true, message: "Successfully harvested SHAH rewards!", type: "success" });
      setTimeout(() => setNotification({ show: false, message: "", type: "success" }), 5000);
    }
  }, [isHarvestSuccess]);

  const isLoading = isDepositLoading || isWithdrawLoading || isHarvestLoading;

  // Calculate portfolio totals (simplified for now)
  const portfolioData = {
    totalStaked: "0.0000", // Will be calculated from individual pool data
    totalPendingRewards: "0.0000" // Will be calculated from individual pool data
  };

  // Get user's LP token balance for the modal
  const getMaxAmount = () => {
    if (modalState.action === "stake") {
      // For staking, we need the user's LP token balance
      // This would require reading the LP token contract balance
      return "1000"; // Placeholder - would need to implement LP token balance reading
    } else {
      // For unstaking, we need the user's staked amount
      // This would require reading the user's staked amount for the specific pool
      return "500"; // Placeholder - would need to implement staked amount reading
    }
  };

  // Handle modal actions
  const handleStake = (pid: number) => {
    setModalState({ isOpen: true, action: "stake", poolId: pid });
  };

  const handleUnstake = (pid: number) => {
    setModalState({ isOpen: true, action: "unstake", poolId: pid });
  };

  const handleHarvest = (pid: number) => {
    harvest({
      address: SHAH_FARM_ADDRESS,
      abi: ShahFarmABI,
      functionName: "harvest",
      args: [BigInt(pid)],
    });
  };

  const handleHarvestAll = () => {
    // Harvest from all pools
    POOLS.forEach((pool) => {
      harvest({
        address: SHAH_FARM_ADDRESS,
        abi: ShahFarmABI,
        functionName: "harvest",
        args: [BigInt(pool.id)],
      });
    });
  };

  const handleModalSubmit = (amount: string) => {
    const parsedAmount = parseAmount(amount);
    
    if (modalState.action === "stake") {
      deposit({
        address: SHAH_FARM_ADDRESS,
        abi: ShahFarmABI,
        functionName: "deposit",
        args: [BigInt(modalState.poolId), parsedAmount],
      });
    } else {
      withdraw({
        address: SHAH_FARM_ADDRESS,
        abi: ShahFarmABI,
        functionName: "withdraw",
        args: [BigInt(modalState.poolId), parsedAmount],
      });
    }
    
    setModalState({ isOpen: false, action: "stake", poolId: 0 });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, action: "stake", poolId: 0 });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🌾 SHAH Farming Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Please connect your wallet to access the farming dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      {/* Success Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === "success" ? "✅" : "❌"}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌾 SHAH Farming Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Stake LP tokens, harvest SHAH rewards, and earn yield.
          </p>
        </div>

        {/* Portfolio Summary */}
        <PortfolioSummary
          totalStaked={portfolioData.totalStaked}
          totalPendingRewards={portfolioData.totalPendingRewards}
          onHarvestAll={handleHarvestAll}
          isLoading={isLoading}
        />
          
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-sm text-gray-500">Total Pools</p>
            <p className="text-2xl font-bold text-blue-600">
              {poolLength ? Number(poolLength) : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-sm text-gray-500">Reward Rate</p>
            <p className="text-2xl font-bold text-green-600">
              {rewardRate ? formatEther(rewardRate) : "0"} SHAH/sec
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-sm text-gray-500">Connected Wallet</p>
            <p className="text-sm font-mono text-gray-700 truncate">
              {address}
            </p>
          </div>
        </div>

        {/* Pool Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {POOLS.map((pool) => (
            <PoolCard
              key={pool.id}
              pool={pool}
              onStake={handleStake}
              onUnstake={handleUnstake}
              onHarvest={handleHarvest}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Action Modal */}
        <ActionModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          action={modalState.action}
          poolName={POOLS.find(p => p.id === modalState.poolId)?.name || ""}
          maxAmount={getMaxAmount()}
          onSubmit={handleModalSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
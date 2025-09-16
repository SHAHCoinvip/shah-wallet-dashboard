import { useAccount, useContractRead } from 'wagmi'
import { SHAH_STAKING_ABI } from '@/abi/ShahStakingABI'

const STAKING_CONTRACT = '0xe6D1B29CCfd7b65C94d30cc22Db8Ebe88692CCC0'

export const useStakingInfo = () => {
  const { address } = useAccount()

  const { data: stakeInfo } = useContractRead({
    address: STAKING_CONTRACT,
    abi: SHAH_STAKING_ABI,
    functionName: 'getStakeInfo',
    args: [address],
    enabled: !!address,
  })

  const { data: currentTier } = useContractRead({
    address: STAKING_CONTRACT,
    abi: SHAH_STAKING_ABI,
    functionName: 'getCurrentTier',
    args: [address],
    enabled: !!address,
  })

  const { data: hasNftBoost } = useContractRead({
    address: STAKING_CONTRACT,
    abi: SHAH_STAKING_ABI,
    functionName: 'hasNftBoost',
    args: [address],
    enabled: !!address,
  })

  return {
    amountStaked: stakeInfo?.[0]?.toString() || '0',
    rewards: stakeInfo?.[1]?.toString() || '0',
    tier: currentTier ?? null,
    hasNftBoost: hasNftBoost ?? false,
  }
}


import { useWriteContract } from 'wagmi'
import { SHAH_STAKING_ABI } from '@/abi/ShahStakingABI'

const contractAddress = '0xe6D1B29CCfd7b65C94d30cc22Db8Ebe88692CCC0'

export const useShahStakingActions = () => {
  const { writeContract } = useWriteContract()

  const stake = async (amount: bigint) => {
    return await writeContract({
      address: contractAddress as `0x${string}`,
      abi: SHAH_STAKING_ABI,
      functionName: 'stake',
      args: [amount],
    })
  }

  const unstake = async (amount: bigint) => {
    return await writeContract({
      address: contractAddress as `0x${string}`,
      abi: SHAH_STAKING_ABI,
      functionName: 'unstake',
      args: [amount],
    })
  }

  const claimRewards = async () => {
    return await writeContract({
      address: contractAddress as `0x${string}`,
      abi: SHAH_STAKING_ABI,
      functionName: 'claimRewards',
    })
  }

  return { stake, unstake, claimRewards }
}

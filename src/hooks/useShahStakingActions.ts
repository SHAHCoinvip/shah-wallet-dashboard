import { useContractWrite, usePrepareContractWrite } from 'wagmi'
import ShahStakingABI from '@/abi/ShahStaking.json'

const contractAddress = '0xe6D1B29CCfd7b65C94d30cc22Db8Ebe88692CCC0'

export const useShahStakingActions = () => {
  const { config: stakeConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: ShahStakingABI,
    functionName: 'stake',
    args: [], // Pass amount if needed
  })

  const { config: unstakeConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: ShahStakingABI,
    functionName: 'unstake',
    args: [],
  })

  const { config: claimConfig } = usePrepareContractWrite({
    address: contractAddress,
    abi: ShahStakingABI,
    functionName: 'claimRewards',
  })

  const stake = useContractWrite(stakeConfig)
  const unstake = useContractWrite(unstakeConfig)
  const claim = useContractWrite(claimConfig)

  return { stake, unstake, claim }
}


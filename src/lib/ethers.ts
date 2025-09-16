import { ethers } from "ethers"
import FactoryAbi from "@/abi/Factory.json"
import RegistryAbi from "@/abi/Registry.json"
import OracleAbi from "@/abi/Oracle.json"

export const ADDRS = {
  factory: process.env.NEXT_PUBLIC_SHAH_FACTORY!,
  registry: process.env.NEXT_PUBLIC_SHAH_REGISTRY!,
  oracle: process.env.NEXT_PUBLIC_SHAH_PRICE_ORACLE!,
  shah: process.env.NEXT_PUBLIC_SHAH!,
}

export function getProvider() {
  const rpcUrl = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-rpc.publicnode.com"
  return new ethers.JsonRpcProvider(rpcUrl)
}

export function factoryContract() {
  return new ethers.Contract(ADDRS.factory, FactoryAbi, getProvider())
}

export function registryContract() {
  return new ethers.Contract(ADDRS.registry, RegistryAbi, getProvider())
}

export function oracleContract() {
  return new ethers.Contract(ADDRS.oracle, OracleAbi, getProvider())
}

// Helper to get current block number
export async function getCurrentBlock(): Promise<number> {
  const provider = getProvider()
  return await provider.getBlockNumber()
}

// Helper to get logs with retry logic
export async function getLogs(filter: ethers.EventFilter, maxRetries = 3): Promise<ethers.Log[]> {
  const provider = getProvider()
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await provider.getLogs(filter)
    } catch (error) {
      console.error(`Get logs attempt ${i + 1} failed:`, error)
      if (i === maxRetries - 1) throw error
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  
  return []
}
// Minimal discovery utilities for go-live
export function linkToSwap(tokenAddress: string): string {
  return `/swap?token=${tokenAddress}`
}

export function linkToEtherscan(txHash: string): string {
  return `https://etherscan.io/tx/${txHash}`
}

export function linkToEtherscanAddress(address: string): string {
  return `https://etherscan.io/address/${address}`
}

export function shortenAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

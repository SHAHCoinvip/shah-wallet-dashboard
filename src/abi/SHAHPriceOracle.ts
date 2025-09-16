export const SHAHPriceOracleABI = [
  {
    "type": "function",
    "name": "getLatestPrice",
    "inputs": [],
    "outputs": [
      { "name": "price", "type": "int256" },
      { "name": "decimals", "type": "uint8" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPriceInUSD",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  }
] as const;
export const SHAHFactoryABI = [
  {
    "type": "function",
    "name": "createToken",
    "inputs": [
      { "name": "name", "type": "string" },
      { "name": "symbol", "type": "string" },
      { "name": "decimals", "type": "uint8" },
      { "name": "initialSupply", "type": "uint256" },
      { "name": "owner", "type": "address" },
      { "name": "features", "type": "uint256" },
      { "name": "maxSupply", "type": "uint256" }
    ],
    "outputs": [
      { "name": "token", "type": "address" }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getCreationFeeInSHAH",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TokenCreated",
    "inputs": [
      { "name": "token", "type": "address", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "name", "type": "string", "indexed": false },
      { "name": "symbol", "type": "string", "indexed": false },
      { "name": "features", "type": "uint256", "indexed": false }
    ]
  }
] as const;
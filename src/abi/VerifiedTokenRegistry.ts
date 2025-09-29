export const VerifiedTokenRegistryABI = [
  {
    "type": "function",
    "name": "isVerified",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "requestVerification",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getVerificationFeeInSHAH",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "markVerified",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "unverifyToken",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address" }
    ],
    "stateMutability": "view"
  }
] as const;
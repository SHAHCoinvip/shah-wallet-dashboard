require("@nomicfoundation/hardhat-toolbox");
// Load dotenv from .env.local (legacy) and optionally override with .env.hardhat if present
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });
const hardhatEnvPath = path.join(__dirname, ".env.hardhat");
if (fs.existsSync(hardhatEnvPath)) {
  require("dotenv").config({ path: hardhatEnvPath, override: true });
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mainnet: {
      url: process.env.NEXT_PUBLIC_RPC_MAINNET || "https://rpc.ankr.com/eth",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      timeout: 30000,
    },
    mainnet2: {
      url: "https://eth.llamarpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      timeout: 30000,
    },
    mainnet3: {
      url: "https://ethereum.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      timeout: 30000,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: "V9QZCAZYNB8RA2VV9FE9PMQCMNZFWTTJFP",
      mainnet2: "V9QZCAZYNB8RA2VV9FE9PMQCMNZFWTTJFP",
      mainnet3: "V9QZCAZYNB8RA2VV9FE9PMQCMNZFWTTJFP",
    },
  },
}; 
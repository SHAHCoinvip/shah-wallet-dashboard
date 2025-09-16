require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: __dirname + '/.env' });

const { PRIVATE_KEY, RPC_URL, ETHERSCAN_API_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    mainnet: {
      url: RPC_URL,
      accounts: [PRIVATE_KEY], // ✅ no extra 0x
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

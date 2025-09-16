const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const shahTokenAddress = process.env.SHAH_TOKEN_ADDRESS;
  const shahGoldNFTAddress = process.env.SHAH_GOLD_NFT_CONTRACT;

  if (!shahTokenAddress || !shahGoldNFTAddress) {
    throw new Error("Missing TOKEN_ADDRESS or SHAH_GOLD_NFT_CONTRACT in .env");
  }

  console.log("Deploying ShahStaking with:", deployer.address);
  console.log("SHAH Token:", shahTokenAddress);
  console.log("SHAH GOLD NFT:", shahGoldNFTAddress);

  const ShahStaking = await hre.ethers.getContractFactory("ShahStaking");
  const staking = await ShahStaking.deploy(shahTokenAddress, shahGoldNFTAddress);

  await staking.waitForDeployment();

  console.log("✅ ShahStaking deployed at:", await staking.getAddress());
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});

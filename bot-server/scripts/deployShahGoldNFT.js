const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying ShahGoldNFT with account:", deployer.address);

  const ShahGoldNFT = await hre.ethers.getContractFactory("ShahGoldNFT");
  const contract = await ShahGoldNFT.deploy(deployer.address);

  await contract.waitForDeployment();
  console.log("ShahGoldNFT deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

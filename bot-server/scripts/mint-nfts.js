const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = process.env.SHAH_GOLD_NFT_CONTRACT;

  const ShahGoldNFT = await hre.ethers.getContractAt("ShahGoldNFT", contractAddress);

  console.log(`👑 Minting NFTs to: ${deployer.address}`);
  console.log(`🔗 Contract: ${contractAddress}`);

  for (let i = 8; i <= 61; i++) {
    const tokenURI = `https://raw.githubusercontent.com/shahcoinvip/shah-nft-metadata/main/public/metadata/${i}.json`;

    try {
      const mintTx = await ShahGoldNFT.mint(deployer.address, tokenURI);
      await mintTx.wait();
      console.log(`✅ Minted token #${i} with URI: ${tokenURI}`);
    } catch (err) {
      console.error(`⚠️ Token #${i} failed:`, err.message);
    }
  }

  console.log("🚀 All 61 NFTs minted!");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exitCode = 1;
});

const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🚀 Manual Oracle Deployment...\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`WETH: ${WETH_ADDRESS}\n`);

    // Deploy Oracle
    const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
    const oracle = await ShahSwapOracle.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
    
    console.log("Deployment transaction sent!");
    console.log(`Transaction Hash: ${oracle.deploymentTransaction().hash}`);
    console.log(`Oracle will be deployed to: ${await oracle.getAddress()}`);
    
    // Don't wait for confirmation - just exit
    console.log("\n✅ Deployment initiated. Check Etherscan for confirmation.");
    console.log(`🔗 https://etherscan.io/tx/${oracle.deploymentTransaction().hash}`);
}

main().catch(console.error);

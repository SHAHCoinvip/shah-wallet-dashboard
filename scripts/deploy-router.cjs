const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🚀 Deploying ShahSwap Router V2...\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52"; // From previous deployment
    
    console.log(`Factory: ${FACTORY_ADDRESS}`);
    console.log(`WETH: ${WETH_ADDRESS}`);
    console.log(`Oracle: ${ORACLE_ADDRESS}\n`);

    // Deploy Router V2
    const ShahSwapRouterV2 = await ethers.getContractFactory("ShahSwapRouterV2");
    const routerV2 = await ShahSwapRouterV2.deploy(FACTORY_ADDRESS, WETH_ADDRESS);
    
    console.log("Router deployment transaction sent!");
    console.log(`Transaction Hash: ${routerV2.deploymentTransaction().hash}`);
    console.log(`Router will be deployed to: ${await routerV2.getAddress()}`);
    
    console.log("\n✅ Router deployment initiated. Check Etherscan for confirmation.");
    console.log(`🔗 https://etherscan.io/tx/${routerV2.deploymentTransaction().hash}`);
    
    // Save addresses for later use
    const fs = require("fs");
    const deploymentInfo = {
        oracle: ORACLE_ADDRESS,
        router: await routerV2.getAddress(),
        factory: FACTORY_ADDRESS,
        weth: WETH_ADDRESS,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString()
    };
    
    fs.writeFileSync("shahswap-deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to shahswap-deployment.json");
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * AutoClaimExecutor Deployment Script
 * Deploys the AutoClaimExecutor contract and updates environment variables
 */

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying AutoClaimExecutor contract...");
  console.log("=============================================");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // Load environment variables
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found. Please run setup first.');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });

  // Required contract addresses
  const SHAH_TOKEN = envVars.NEXT_PUBLIC_SHAH;
  const STAKING_CONTRACT = envVars.NEXT_PUBLIC_STAKING;
  const TREASURY = envVars.TREASURY_ADDRESS || deployer.address; // Default to deployer if not set

  if (!SHAH_TOKEN || !STAKING_CONTRACT) {
    throw new Error('Missing required contract addresses in .env.local');
  }

  console.log(`🔗 SHAH Token: ${SHAH_TOKEN}`);
  console.log(`🔗 Staking Contract: ${STAKING_CONTRACT}`);
  console.log(`🔗 Treasury: ${TREASURY}`);

  // Execution fee: 0.1 SHAH (with 18 decimals)
  const EXECUTION_FEE = ethers.parseEther("0.1");
  console.log(`💰 Execution Fee: ${ethers.formatEther(EXECUTION_FEE)} SHAH`);

  // Deploy AutoClaimExecutor
  console.log("\n📦 Deploying AutoClaimExecutor...");
  const AutoClaimExecutor = await ethers.getContractFactory("AutoClaimExecutor");
  
  const autoClaimExecutor = await AutoClaimExecutor.deploy(
    SHAH_TOKEN,
    STAKING_CONTRACT,
    TREASURY,
    EXECUTION_FEE
  );

  await autoClaimExecutor.waitForDeployment();
  const deployedAddress = await autoClaimExecutor.getAddress();

  console.log(`✅ AutoClaimExecutor deployed to: ${deployedAddress}`);

  // Verify contract on Etherscan
  console.log("\n🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: deployedAddress,
      constructorArguments: [
        SHAH_TOKEN,
        STAKING_CONTRACT,
        TREASURY,
        EXECUTION_FEE
      ],
    });
    console.log("✅ Contract verified on Etherscan");
  } catch (error) {
    console.log("⚠️  Verification failed (this is normal if already verified):", error.message);
  }

  // Update .env.local with deployed address
  console.log("\n📝 Updating .env.local...");
  const newEnvContent = envContent
    .replace(/AUTOCLAIM_EXECUTOR_ADDRESS=.*/, `AUTOCLAIM_EXECUTOR_ADDRESS=${deployedAddress}`)
    .replace(/NEXT_PUBLIC_ENABLE_STAKING_AUTOCLAIM=.*/, 'NEXT_PUBLIC_ENABLE_STAKING_AUTOCLAIM=true')
    .replace(/TREASURY_ADDRESS=.*/, `TREASURY_ADDRESS=${TREASURY}`);

  fs.writeFileSync(envPath, newEnvContent);
  console.log("✅ .env.local updated with deployed contract address");

  // Create deployment info file
  const deploymentInfo = {
    contract: "AutoClaimExecutor",
    address: deployedAddress,
    network: hre.network.name,
    deployer: deployer.address,
    constructorArgs: {
      shahToken: SHAH_TOKEN,
      stakingContract: STAKING_CONTRACT,
      treasury: TREASURY,
      executionFee: EXECUTION_FEE.toString()
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await autoClaimExecutor.deploymentTransaction().blockNumber,
    transactionHash: autoClaimExecutor.deploymentTransaction().hash
  };

  const deploymentPath = path.join(process.cwd(), 'deployment-info.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);

  // Test contract functions
  console.log("\n🧪 Testing contract functions...");
  
  // Test owner functions
  const owner = await autoClaimExecutor.owner();
  console.log(`👑 Contract owner: ${owner}`);
  
  const executionFee = await autoClaimExecutor.executionFee();
  console.log(`💰 Execution fee: ${ethers.formatEther(executionFee)} SHAH`);
  
  const treasury = await autoClaimExecutor.treasury();
  console.log(`🏦 Treasury: ${treasury}`);

  console.log("\n🎉 AutoClaimExecutor deployment completed successfully!");
  console.log("=============================================");
  console.log(`📋 Contract Address: ${deployedAddress}`);
  console.log(`🔗 Etherscan: https://etherscan.io/address/${deployedAddress}`);
  console.log(`💰 Execution Fee: ${ethers.formatEther(EXECUTION_FEE)} SHAH per claim`);
  console.log(`🏦 Treasury: ${TREASURY}`);
  console.log("\n📝 Next steps:");
  console.log("1. Update your Supabase database with the new auto_claim_jobs table");
  console.log("2. Set up the Vercel cron job for automatic claiming");
  console.log("3. Test the auto-claim functionality in the UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

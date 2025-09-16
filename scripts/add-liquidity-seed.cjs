const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🌱 Adding seed liquidity to ShahSwap pairs...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    
    if (!fs.existsSync(deploymentPath) || !fs.existsSync(pairPath)) {
        throw new Error("Deployment files not found. Run deploy-dex-v3.cjs and create-pairs.cjs first.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    
    const routerAddress = deploymentInfo.contracts.ShahSwapRouterV3.address;
    const pairs = pairInfo.pairs;
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    // Connect to router
    const router = await ethers.getContractAt("ShahSwapRouterV3", routerAddress);
    
    // Token addresses
    const SHAH = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    
    // Seed amounts (small amounts for initial price anchor)
    const seedAmounts = {
        "SHAH/USDT": {
            shahAmount: ethers.parseEther("1"), // 1 SHAH
            usdtAmount: ethers.parseUnits("3", 6), // 3 USDT (targeting $3/SHAH)
            slippage: 0.99 // 1% slippage tolerance
        },
        "SHAH/WETH": {
            shahAmount: ethers.parseEther("1"), // 1 SHAH
            ethAmount: ethers.parseEther("0.001"), // 0.001 ETH (~$3 at $3000/ETH)
            slippage: 0.99
        },
        "SHAH/DAI": {
            shahAmount: ethers.parseEther("1"), // 1 SHAH
            daiAmount: ethers.parseEther("3"), // 3 DAI (targeting $3/SHAH)
            slippage: 0.99
        }
    };
    
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    console.log("\n📋 Seed Configuration:");
    console.log("Deadline:", new Date(deadline * 1000).toISOString());
    
    for (const pair of pairs) {
        const config = seedAmounts[pair.name];
        if (!config) {
            console.log(`⚠️  No seed config for ${pair.name}, skipping...`);
            continue;
        }
        
        console.log(`\n🌱 Adding seed liquidity to ${pair.name}...`);
        
        try {
            // Check balances first
            const shahBalance = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH);
            const shahBal = await shahBalance.balanceOf(deployer.address);
            console.log("SHAH balance:", ethers.formatEther(shahBal));
            
            if (shahBal < config.shahAmount) {
                console.log(`❌ Insufficient SHAH balance. Need ${ethers.formatEther(config.shahAmount)}, have ${ethers.formatEther(shahBal)}`);
                continue;
            }
            
            if (pair.name === "SHAH/USDT") {
                // Check USDT balance
                const usdtBalance = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT);
                const usdtBal = await usdtBalance.balanceOf(deployer.address);
                console.log("USDT balance:", ethers.formatUnits(usdtBal, 6));
                
                if (usdtBal < config.usdtAmount) {
                    console.log(`❌ Insufficient USDT balance. Need ${ethers.formatUnits(config.usdtAmount, 6)}, have ${ethers.formatUnits(usdtBal, 6)}`);
                    continue;
                }
                
                // Approve USDT
                console.log("🔐 Approving USDT...");
                const usdtApproveTx = await usdtBalance.approve(routerAddress, config.usdtAmount);
                await usdtApproveTx.wait();
                console.log("✅ USDT approved");
                
                // Approve SHAH
                console.log("🔐 Approving SHAH...");
                const shahApproveTx = await shahBalance.approve(routerAddress, config.shahAmount);
                await shahApproveTx.wait();
                console.log("✅ SHAH approved");
                
                // Add liquidity
                console.log("💧 Adding liquidity...");
                const tx = await router.addLiquidity(
                    SHAH,
                    USDT,
                    config.shahAmount,
                    config.usdtAmount,
                    config.shahAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    config.usdtAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    deployer.address,
                    deadline
                );
                
                const receipt = await tx.wait();
                console.log("✅ Liquidity added! TX:", tx.hash);
                console.log("Gas used:", receipt.gasUsed.toString());
                
            } else if (pair.name === "SHAH/WETH") {
                // Check ETH balance
                const ethBalance = await deployer.provider.getBalance(deployer.address);
                console.log("ETH balance:", ethers.formatEther(ethBalance));
                
                if (ethBalance < config.ethAmount) {
                    console.log(`❌ Insufficient ETH balance. Need ${ethers.formatEther(config.ethAmount)}, have ${ethers.formatEther(ethBalance)}`);
                    continue;
                }
                
                // Approve SHAH
                console.log("🔐 Approving SHAH...");
                const shahApproveTx = await shahBalance.approve(routerAddress, config.shahAmount);
                await shahApproveTx.wait();
                console.log("✅ SHAH approved");
                
                // Add liquidity with ETH
                console.log("💧 Adding liquidity with ETH...");
                const tx = await router.addLiquidityETH(
                    SHAH,
                    config.shahAmount,
                    config.shahAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    config.ethAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    deployer.address,
                    deadline,
                    { value: config.ethAmount }
                );
                
                const receipt = await tx.wait();
                console.log("✅ Liquidity added! TX:", tx.hash);
                console.log("Gas used:", receipt.gasUsed.toString());
                
            } else if (pair.name === "SHAH/DAI") {
                // Check DAI balance
                const daiBalance = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", DAI);
                const daiBal = await daiBalance.balanceOf(deployer.address);
                console.log("DAI balance:", ethers.formatEther(daiBal));
                
                if (daiBal < config.daiAmount) {
                    console.log(`❌ Insufficient DAI balance. Need ${ethers.formatEther(config.daiAmount)}, have ${ethers.formatEther(daiBal)}`);
                    continue;
                }
                
                // Approve DAI
                console.log("🔐 Approving DAI...");
                const daiApproveTx = await daiBalance.approve(routerAddress, config.daiAmount);
                await daiApproveTx.wait();
                console.log("✅ DAI approved");
                
                // Approve SHAH
                console.log("🔐 Approving SHAH...");
                const shahApproveTx = await shahBalance.approve(routerAddress, config.shahAmount);
                await shahApproveTx.wait();
                console.log("✅ SHAH approved");
                
                // Add liquidity
                console.log("💧 Adding liquidity...");
                const tx = await router.addLiquidity(
                    SHAH,
                    DAI,
                    config.shahAmount,
                    config.daiAmount,
                    config.shahAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    config.daiAmount * BigInt(Math.floor(config.slippage * 1000)) / 1000n,
                    deployer.address,
                    deadline
                );
                
                const receipt = await tx.wait();
                console.log("✅ Liquidity added! TX:", tx.hash);
                console.log("Gas used:", receipt.gasUsed.toString());
            }
            
        } catch (error) {
            console.error(`❌ Failed to add liquidity to ${pair.name}:`, error.message);
        }
    }
    
    console.log("\n🎉 Seed liquidity addition complete!");
    console.log("\nNext steps:");
    console.log("1. npm run dex:oracle");
    console.log("2. npm run dex:check");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Seed liquidity addition failed:", error);
        process.exit(1);
    });
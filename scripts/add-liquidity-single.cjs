const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🌱 Adding liquidity to SHAH/USDT pair...");
    
    // Load deployment info
    const deploymentPath = path.join(__dirname, "../deployment/dex-v3.json");
    const pairPath = path.join(__dirname, "../deployment/pairs.json");
    
    if (!fs.existsSync(deploymentPath) || !fs.existsSync(pairPath)) {
        throw new Error("Deployment files not found.");
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const pairInfo = JSON.parse(fs.readFileSync(pairPath, "utf8"));
    
    const routerAddress = deploymentInfo.contracts.ShahSwapRouterV3.address;
    const shahUsdtPair = pairInfo.pairs.find(p => p.name === "SHAH/USDT");
    
    if (!shahUsdtPair) {
        throw new Error("SHAH/USDT pair not found");
    }
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    // Connect to router
    const router = await ethers.getContractAt("ShahSwapRouterV3", routerAddress);
    
    // Token addresses
    const SHAH = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    
    // Small amounts for testing
    const shahAmount = ethers.parseEther("0.1"); // 0.1 SHAH
    const usdtAmount = ethers.parseUnits("0.3", 6); // 0.3 USDT
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    console.log("\n📋 Liquidity Configuration:");
    console.log("SHAH amount:", ethers.formatEther(shahAmount));
    console.log("USDT amount:", ethers.formatUnits(usdtAmount, 6));
    console.log("Deadline:", new Date(deadline * 1000).toISOString());
    
    try {
        // Check balances
        const shahBalance = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SHAH);
        const usdtBalance = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", USDT);
        
        const shahBal = await shahBalance.balanceOf(deployer.address);
        const usdtBal = await usdtBalance.balanceOf(deployer.address);
        
        console.log("\n💰 Current balances:");
        console.log("SHAH balance:", ethers.formatEther(shahBal));
        console.log("USDT balance:", ethers.formatUnits(usdtBal, 6));
        
        if (shahBal < shahAmount) {
            throw new Error(`Insufficient SHAH balance. Need ${ethers.formatEther(shahAmount)}, have ${ethers.formatEther(shahBal)}`);
        }
        
        if (usdtBal < usdtAmount) {
            throw new Error(`Insufficient USDT balance. Need ${ethers.formatUnits(usdtAmount, 6)}, have ${ethers.formatUnits(usdtBal, 6)}`);
        }
        
        // Approve tokens
        console.log("\n🔐 Approving tokens...");
        const usdtApproveTx = await usdtBalance.approve(routerAddress, usdtAmount);
        await usdtApproveTx.wait();
        console.log("✅ USDT approved");
        
        const shahApproveTx = await shahBalance.approve(routerAddress, shahAmount);
        await shahApproveTx.wait();
        console.log("✅ SHAH approved");
        
        // Add liquidity
        console.log("\n💧 Adding liquidity...");
        const tx = await router.addLiquidity(
            SHAH,
            USDT,
            shahAmount,
            usdtAmount,
            shahAmount * 99n / 100n, // 1% slippage
            usdtAmount * 99n / 100n, // 1% slippage
            deployer.address,
            deadline
        );
        
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Liquidity added successfully!");
        console.log("Block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check the pair reserves
        console.log("\n📊 Checking pair reserves...");
        const pairContract = await ethers.getContractAt("contracts/shahswap/ShahSwapPair.sol:ShahSwapPair", shahUsdtPair.address);
        const reserves = await pairContract.getReserves();
        const totalSupply = await pairContract.totalSupply();
        
        console.log("Reserve0:", ethers.formatEther(reserves.reserve0));
        console.log("Reserve1:", ethers.formatUnits(reserves.reserve1, 6));
        console.log("Total supply:", ethers.formatEther(totalSupply));
        
    } catch (error) {
        console.error("❌ Failed to add liquidity:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

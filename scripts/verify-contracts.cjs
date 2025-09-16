const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🔍 Verifying contracts on Etherscan...\n");

    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const ROUTER_ADDRESS = "0x20794d26397f2b81116005376AbEc0B995e9D502";
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    try {
        // Verify Oracle
        console.log("📋 Verifying ShahSwap Oracle...");
        await hre.run("verify:verify", {
            address: ORACLE_ADDRESS,
            constructorArguments: [FACTORY_ADDRESS, WETH_ADDRESS],
        });
        console.log("✅ Oracle verified successfully!");

        // Verify Router V2
        console.log("\n📋 Verifying ShahSwap Router V2...");
        await hre.run("verify:verify", {
            address: ROUTER_ADDRESS,
            constructorArguments: [FACTORY_ADDRESS, WETH_ADDRESS],
        });
        console.log("✅ Router V2 verified successfully!");

        console.log("\n🎉 All contracts verified!");
        console.log("\n🔗 Etherscan Links:");
        console.log(`   Oracle: https://etherscan.io/address/${ORACLE_ADDRESS}#code`);
        console.log(`   Router V2: https://etherscan.io/address/${ROUTER_ADDRESS}#code`);

    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        console.log("\n💡 Manual verification commands:");
        console.log(`   Oracle: npx hardhat verify --network mainnet ${ORACLE_ADDRESS} "${FACTORY_ADDRESS}" "${WETH_ADDRESS}"`);
        console.log(`   Router: npx hardhat verify --network mainnet ${ROUTER_ADDRESS} "${FACTORY_ADDRESS}" "${WETH_ADDRESS}"`);
    }
}

main().catch(console.error);

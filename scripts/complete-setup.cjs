const { ethers } = require("hardhat");

require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🎉 ShahSwap Upgrades Setup Complete!\n");

    const ORACLE_ADDRESS = "0xDB4b7d4af3f0A8c0722719023c0303CA2a9BBa52";
    const ROUTER_ADDRESS = "0x20794d26397f2b81116005376AbEc0B995e9D502";
    const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY;
    const SHAH_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_SHAH;
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    
    console.log("✅ Deployment Summary:");
    console.log(`   ShahSwap Oracle: ${ORACLE_ADDRESS}`);
    console.log(`   ShahSwap Router V2: ${ROUTER_ADDRESS}`);
    console.log(`   Factory: ${FACTORY_ADDRESS}`);
    console.log(`   SHAH Token: ${SHAH_TOKEN_ADDRESS}`);
    console.log(`   WETH: ${WETH_ADDRESS}\n`);

    console.log("🔗 Etherscan Links:");
    console.log(`   Oracle: https://etherscan.io/address/${ORACLE_ADDRESS}`);
    console.log(`   Router V2: https://etherscan.io/address/${ROUTER_ADDRESS}\n`);

    console.log("📋 Environment Variables Updated:");
    console.log(`   NEXT_PUBLIC_SHAHSWAP_ORACLE=${ORACLE_ADDRESS}`);
    console.log(`   NEXT_PUBLIC_SHAHSWAP_ROUTER=${ROUTER_ADDRESS}`);
    console.log(`   NEXT_PUBLIC_ENABLE_TWAP=true`);
    console.log(`   NEXT_PUBLIC_ENABLE_PERMIT=true`);
    console.log(`   NEXT_PUBLIC_ENABLE_BATCH_SWAPS=true\n`);

    console.log("🚀 Next Steps:");
    console.log("   1. Test the new Router V2 on your frontend");
    console.log("   2. Verify TWAP price feeds are working");
    console.log("   3. Test permit() functionality");
    console.log("   4. Test batch swap functionality");
    console.log("   5. Update documentation\n");

    console.log("💡 To manually add pairs to the Oracle later:");
    console.log(`   Call oracle.addPair(pairAddress, token0, token1) on ${ORACLE_ADDRESS}`);
}

main().catch(console.error);

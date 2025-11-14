const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔧 Updating Environment Variables...\n");

  // Load deployment info
  if (!fs.existsSync('shahswap-deployment.json')) {
    console.log("❌ shahswap-deployment.json not found. Please run deployShahSwapFactory.cjs first.");
    process.exit(1);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync('shahswap-deployment.json', 'utf8'));
  const newFactoryAddress = deploymentInfo.contracts.ShahSwapFactory;
  
  console.log(`🏭 New Factory Address: ${newFactoryAddress}`);
  console.log("");

  // Check if .env.local exists
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = "";
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log("✅ Found existing .env.local file");
  } else {
    console.log("📝 Creating new .env.local file");
  }

  // Define the updates
  const updates = {
    "NEXT_PUBLIC_SHAHSWAP_FACTORY": newFactoryAddress,
    "NEXT_PUBLIC_SHAHSWAP_ROUTER": "0x20794d26397f2b81116005376AbEc0B995e9D502",
    "NEXT_PUBLIC_SHAHSWAP_ORACLE": "0x608475033ac2c8B779043FB6F9B53d0633C7c79a"
  };

  console.log("📝 Updating environment variables:");
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*`, "m");
    
    if (regex.test(envContent)) {
      // Update existing variable
      envContent = envContent.replace(regex, `${key}=${value}`);
      console.log(`   ✅ Updated ${key}=${value}`);
    } else {
      // Add new variable
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
      console.log(`   ➕ Added ${key}=${value}`);
    }
  }

  // Write the updated content
  fs.writeFileSync(envPath, envContent);
  console.log(`\n💾 Environment file updated: ${envPath}`);

  // Also update the example file for reference
  const examplePath = path.join(__dirname, '..', 'env.example');
  if (fs.existsSync(examplePath)) {
    let exampleContent = fs.readFileSync(examplePath, 'utf8');
    
    // Update the factory address in the example
    const factoryRegex = /^NEXT_PUBLIC_FACTORY=.*/m;
    if (factoryRegex.test(exampleContent)) {
      exampleContent = exampleContent.replace(factoryRegex, `NEXT_PUBLIC_FACTORY=${newFactoryAddress}`);
    }
    
    // Add ShahSwap specific variables if they don't exist
    const shahswapVars = [
      `NEXT_PUBLIC_SHAHSWAP_FACTORY=${newFactoryAddress}`,
      `NEXT_PUBLIC_SHAHSWAP_ROUTER=0x20794d26397f2b81116005376AbEc0B995e9D502`,
      `NEXT_PUBLIC_SHAHSWAP_ORACLE=0x608475033ac2c8B779043FB6F9B53d0633C7c79a`
    ];
    
    for (const varLine of shahswapVars) {
      const key = varLine.split('=')[0];
      const regex = new RegExp(`^${key}=.*`, "m");
      
      if (!regex.test(exampleContent)) {
        if (exampleContent && !exampleContent.endsWith('\n')) {
          exampleContent += '\n';
        }
        exampleContent += `${varLine}\n`;
      }
    }
    
    fs.writeFileSync(examplePath, exampleContent);
    console.log("📝 Updated env.example with new addresses");
  }

  // Summary
  console.log("\n📊 Environment Update Summary:");
  console.log(`🏭 ShahSwap Factory: ${newFactoryAddress}`);
  console.log(`🔗 ShahSwap Router: 0x20794d26397f2b81116005376AbEc0B995e9D502`);
  console.log(`🔮 ShahSwap Oracle: 0x608475033ac2c8B779043FB6F9B53d0633C7c79a`);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("1. Restart your development server");
  console.log("2. Test the new factory with the farming system");
  console.log("3. Add initial liquidity to the new pairs");
  console.log("4. Register pairs with the Oracle for price feeds");

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });






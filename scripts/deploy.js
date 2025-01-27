const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment of UserRoleManager contract...");

    // Get the contract factory with the new name
    const UserRoleManager = await hre.ethers.getContractFactory("UserRoleManager");
    const roleManager = await UserRoleManager.deploy();
    await roleManager.waitForDeployment();
    
    const roleManagerAddress = await roleManager.getAddress();
    
    // Save contract address with new contract name
    const contractAddresses = {
      UserRoleManager: roleManagerAddress
    };

    fs.writeFileSync(
      path.join(__dirname, "../frontend/contracts/contract-address.json"),
      JSON.stringify(contractAddresses, null, 2)
    );

    // Save contract artifacts (ABI) with new name
    const artifacts = await hre.artifacts.readArtifact("UserRoleManager");
    fs.writeFileSync(
      path.join(__dirname, "../frontend/contracts/UserRoleManager.json"),
      JSON.stringify(artifacts, null, 2)
    );

    console.log(`UserRoleManager deployed to: ${roleManagerAddress}`);
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
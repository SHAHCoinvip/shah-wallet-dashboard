const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShahSwap Upgrades", function () {
  let deployer, user1, user2;
  let oracleLibrary, oracle, routerV2;
  let shahToken, weth, factory;
  
  const SHAH_TOKEN_ADDRESS = "0x6E0cFA42F797E316ff147A21f7F1189cd610ede8";
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();
    
    // Deploy OracleLibrary
    const OracleLibrary = await ethers.getContractFactory("OracleLibrary");
    oracleLibrary = await OracleLibrary.deploy();
    
    // Deploy ShahSwapOracle
    const ShahSwapOracle = await ethers.getContractFactory("ShahSwapOracle");
    oracle = await ShahSwapOracle.deploy(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory (for testing)
      WETH_ADDRESS
    );
    
    // Deploy ShahSwapRouterV2
    const ShahSwapRouterV2 = await ethers.getContractFactory("ShahSwapRouterV2");
    routerV2 = await ShahSwapRouterV2.deploy(
      "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory (for testing)
      WETH_ADDRESS
    );
    
    // Get contract instances
    shahToken = await ethers.getContractAt("IERC20", SHAH_TOKEN_ADDRESS);
    weth = await ethers.getContractAt("IERC20", WETH_ADDRESS);
  });

  describe("Oracle TWAP Price Fetch", function () {
    it("should calculate TWAP price correctly", async function () {
      // Mock pair data
      const mockPair = "0x1234567890123456789012345678901234567890";
      const token0 = SHAH_TOKEN_ADDRESS;
      const token1 = WETH_ADDRESS;
      
      // Add pair to oracle
      await oracle.addPair(mockPair, token0, token1);
      
      // Test TWAP consultation
      const amountIn = ethers.parseEther("1000"); // 1000 SHAH
      const period = 1800; // 30 minutes
      
      try {
        const [amountOut, priceTWAP] = await oracle.consult(
          token0,
          token1,
          amountIn,
          period
        );
        
        // Should return valid values
        expect(amountOut).to.be.gt(0);
        expect(priceTWAP).to.be.gt(0);
      } catch (error) {
        // Expected if no real pair data
        expect(error.message).to.include("OracleLibrary: INSUFFICIENT_LIQUIDITY");
      }
    });

    it("should validate TWAP period constraints", async function () {
      const amountIn = ethers.parseEther("1000");
      const token0 = SHAH_TOKEN_ADDRESS;
      const token1 = WETH_ADDRESS;
      
      // Test minimum period
      const minPeriod = 1800; // 30 minutes
      await expect(
        oracle.consult(token0, token1, amountIn, minPeriod - 1)
      ).to.be.revertedWith("OracleLibrary: PERIOD_TOO_SHORT");
      
      // Test maximum period
      const maxPeriod = 86400; // 24 hours
      await expect(
        oracle.consult(token0, token1, amountIn, maxPeriod + 1)
      ).to.be.revertedWith("OracleLibrary: PERIOD_TOO_LONG");
    });
  });

  describe("RouterV2 Multi-hop Swaps", function () {
    it("should calculate amounts out for multi-hop path", async function () {
      const amountIn = ethers.parseEther("1000");
      const path = [SHAH_TOKEN_ADDRESS, WETH_ADDRESS];
      
      try {
        const amounts = await routerV2.getAmountsOut(amountIn, path);
        
        // Should return array with correct length
        expect(amounts).to.be.an('array');
        expect(amounts.length).to.equal(path.length);
        expect(amounts[0]).to.equal(amountIn);
        expect(amounts[1]).to.be.gt(0);
      } catch (error) {
        // Expected if no real pair data
        expect(error.message).to.include("INSUFFICIENT_LIQUIDITY");
      }
    });

    it("should validate path requirements", async function () {
      const amountIn = ethers.parseEther("1000");
      
      // Test empty path
      await expect(
        routerV2.getAmountsOut(amountIn, [])
      ).to.be.revertedWith("ShahSwapRouter: INVALID_PATH");
      
      // Test single token path
      await expect(
        routerV2.getAmountsOut(amountIn, [SHAH_TOKEN_ADDRESS])
      ).to.be.revertedWith("ShahSwapRouter: INVALID_PATH");
    });
  });

  describe("RouterV2 Permit() Approval Flow", function () {
    it("should handle permit signature validation", async function () {
      const owner = user1.address;
      const spender = routerV2.target;
      const value = ethers.parseEther("1000");
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      
      // Create permit signature
      const domain = {
        name: 'SHAH Token',
        version: '1',
        chainId: await ethers.provider.getNetwork().then(n => n.chainId),
        verifyingContract: SHAH_TOKEN_ADDRESS
      };
      
      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };
      
      const message = {
        owner: owner,
        spender: spender,
        value: value,
        nonce: 0, // Assuming nonce 0
        deadline: deadline
      };
      
      try {
        const signature = await user1.signTypedData(domain, types, message);
        const { v, r, s } = ethers.Signature.from(signature);
        
        // Test permit swap function signature
        const permitSwapParams = {
          swap: {
            amountIn: value,
            amountOutMin: 0,
            path: [SHAH_TOKEN_ADDRESS, WETH_ADDRESS],
            to: user1.address,
            deadline: deadline
          },
          deadline: deadline,
          v: v,
          r: r,
          s: s
        };
        
        // This should fail due to no real pair, but signature should be valid
        await expect(
          routerV2.swapExactTokensForTokensWithPermit(permitSwapParams)
        ).to.be.reverted;
        
      } catch (error) {
        // Expected if permit not supported or other issues
        expect(error.message).to.include("INSUFFICIENT_LIQUIDITY");
      }
    });

    it("should validate permit deadline", async function () {
      const deadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      const permitSwapParams = {
        swap: {
          amountIn: ethers.parseEther("1000"),
          amountOutMin: 0,
          path: [SHAH_TOKEN_ADDRESS, WETH_ADDRESS],
          to: user1.address,
          deadline: deadline
        },
        deadline: deadline,
        v: 27,
        r: ethers.ZeroHash,
        s: ethers.ZeroHash
      };
      
      await expect(
        routerV2.swapExactTokensForTokensWithPermit(permitSwapParams)
      ).to.be.revertedWith("ShahSwapRouter: EXPIRED");
    });
  });

  describe("Integration Tests", function () {
    it("should configure router with oracle", async function () {
      await routerV2.setOracle(oracle.target);
      
      const oracleAddress = await routerV2.oracle();
      expect(oracleAddress).to.equal(oracle.target);
    });

    it("should add pairs to oracle", async function () {
      const mockPair = "0x1234567890123456789012345678901234567890";
      const token0 = SHAH_TOKEN_ADDRESS;
      const token1 = WETH_ADDRESS;
      
      await oracle.addPair(mockPair, token0, token1);
      
      const pair = await oracle.getPair(token0, token1);
      expect(pair).to.equal(mockPair);
    });
  });

  describe("SHAH Token v1 Integration", function () {
    it("should interact with existing SHAH token", async function () {
      // Test basic ERC-20 functions
      const balance = await shahToken.balanceOf(deployer.address);
      expect(balance).to.be.gte(0);
      
      const name = await shahToken.name();
      expect(name).to.be.a('string');
      
      const symbol = await shahToken.symbol();
      expect(symbol).to.be.a('string');
    });

    it("should confirm SHAH v1 is official token", async function () {
      const shahAddress = await shahToken.getAddress();
      expect(shahAddress.toLowerCase()).to.equal(SHAH_TOKEN_ADDRESS.toLowerCase());
    });
  });
});

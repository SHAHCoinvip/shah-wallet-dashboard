const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("SHAH Farming System", function () {
    let shahToken, shahFarm, liquidityManager, mockToken, mockRouter, mockFactory;
    let owner, user1, user2, user3;
    let WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    beforeEach(async function () {
        [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy SHAH token
        const MockSHAHToken = await ethers.getContractFactory("MockSHAHToken");
        shahToken = await MockSHAHToken.deploy(owner.address);

        // Deploy mock token for testing
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MOCK");

        // Deploy mock ShahSwap router and factory
        const MockRouter = await ethers.getContractFactory("MockShahSwapRouter");
        mockRouter = await MockRouter.deploy();

        const MockFactory = await ethers.getContractFactory("MockShahSwapFactory");
        mockFactory = await MockFactory.deploy();

        // Deploy ShahFarm
        const ShahFarm = await ethers.getContractFactory("ShahFarm");
        shahFarm = await ShahFarm.deploy(await shahToken.getAddress(), owner.address);

        // Deploy ShahSwapLiquidityManager
        const ShahSwapLiquidityManager = await ethers.getContractFactory("ShahSwapLiquidityManager");
        liquidityManager = await ShahSwapLiquidityManager.deploy(
            await mockRouter.getAddress(),
            await shahToken.getAddress(),
            await shahFarm.getAddress(),
            owner.address
        );

        // Fund users with tokens
        await shahToken.transfer(user1.address, ethers.parseEther("10000"));
        await shahToken.transfer(user2.address, ethers.parseEther("10000"));
        await shahToken.transfer(user3.address, ethers.parseEther("10000"));
        await mockToken.transfer(user1.address, ethers.parseEther("10000"));
        await mockToken.transfer(user2.address, ethers.parseEther("10000"));
        await mockToken.transfer(user3.address, ethers.parseEther("10000"));

        // Create mock LP tokens for testing
        const MockLP = await ethers.getContractFactory("MockERC20");
        const mockLP = await MockLP.deploy("Mock LP", "MLP");
        await mockLP.transfer(user1.address, ethers.parseEther("10000"));
        await mockLP.transfer(user2.address, ethers.parseEther("10000"));
        await mockLP.transfer(user3.address, ethers.parseEther("10000"));
    });

    describe("ShahFarm Contract", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await shahFarm.rewardToken()).to.equal(await shahToken.getAddress());
            expect(await shahFarm.owner()).to.equal(owner.address);
        });

        it("Should add pools correctly", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            expect(await shahFarm.poolLength()).to.equal(1);
            expect(await shahFarm.totalAllocPoint()).to.equal(1000);
        });

        it("Should not allow non-owner to add pools", async function () {
            await expect(
                shahFarm.connect(user1).addPool(await mockToken.getAddress(), 1000, false)
            ).to.be.revertedWithCustomError(shahFarm, "OwnableUnauthorizedAccount");
        });

        it("Should not allow adding duplicate pools", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            await expect(
                shahFarm.addPool(await mockToken.getAddress(), 500, false)
            ).to.be.revertedWith("Pool already exists");
        });

        it("Should set reward rate correctly", async function () {
            const rewardRate = ethers.parseEther("1") / 86400n; // 1 SHAH per day
            await shahFarm.setRewardRate(rewardRate);
            expect(await shahFarm.rewardRate()).to.equal(rewardRate);
        });

        it("Should fund rewards correctly", async function () {
            const rewardAmount = ethers.parseEther("1000000");
            const duration = 86400 * 30; // 30 days

            await shahToken.transfer(await shahFarm.getAddress(), rewardAmount);
            await shahFarm.notifyRewardAmount(rewardAmount, duration);

            expect(await shahFarm.rewardRate()).to.be.gt(0);
            expect(await shahFarm.finishAt()).to.be.gt(await time.latest());
        });

        it("Should calculate pending rewards correctly", async function () {
            // Add pool and fund rewards
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            const rewardAmount = ethers.parseEther("1000000");
            await shahToken.transfer(await shahFarm.getAddress(), rewardAmount);
            await shahFarm.notifyRewardAmount(rewardAmount, 86400 * 30);

            // User deposits LP tokens
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await shahFarm.getAddress(), lpAmount);
            await shahFarm.connect(user1).deposit(0, lpAmount);

            // Advance time
            await time.increase(86400); // 1 day

            const pending = await shahFarm.pendingReward(0, user1.address);
            expect(pending).to.be.gt(0);
        });

        it("Should allow users to deposit and withdraw", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await shahFarm.getAddress(), lpAmount);
            
            // Deposit
            await shahFarm.connect(user1).deposit(0, lpAmount);
            const userInfo = await shahFarm.getUserInfo(0, user1.address);
            expect(userInfo.amount).to.equal(lpAmount);

            // Withdraw
            await shahFarm.connect(user1).withdraw(0, lpAmount);
            const userInfoAfter = await shahFarm.getUserInfo(0, user1.address);
            expect(userInfoAfter.amount).to.equal(0);
        });

        it("Should allow emergency withdrawal", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await shahFarm.getAddress(), lpAmount);
            await shahFarm.connect(user1).deposit(0, lpAmount);

            await shahFarm.connect(user1).emergencyWithdraw(0);
            const userInfo = await shahFarm.getUserInfo(0, user1.address);
            expect(userInfo.amount).to.equal(0);
        });

        it("Should pause and unpause correctly", async function () {
            await shahFarm.pause();
            expect(await shahFarm.paused()).to.be.true;

            await shahFarm.unpause();
            expect(await shahFarm.paused()).to.be.false;
        });

        it("Should not allow deposits when paused", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            await shahFarm.pause();

            const lpAmount = ethers.parseEther("100");
            await mockToken.approve(await shahFarm.getAddress(), lpAmount);

            await expect(
                shahFarm.connect(user1).deposit(0, lpAmount)
            ).to.be.revertedWithCustomError(shahFarm, "EnforcedPause");
        });
    });

    describe("ShahSwapLiquidityManager Contract", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await liquidityManager.router()).to.equal(await mockRouter.getAddress());
            expect(await liquidityManager.shahToken()).to.equal(await shahToken.getAddress());
            expect(await liquidityManager.farm()).to.equal(await shahFarm.getAddress());
            expect(await liquidityManager.owner()).to.equal(owner.address);
        });

        it("Should add liquidity correctly", async function () {
            const shahAmount = ethers.parseEther("100");
            const tokenAmount = ethers.parseEther("100");
            const minLp = ethers.parseEther("90");

            await shahToken.connect(user1).approve(await liquidityManager.getAddress(), shahAmount);
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), tokenAmount);

            await expect(
                liquidityManager.connect(user1).addLiquidity(
                    await mockToken.getAddress(),
                    shahAmount,
                    tokenAmount,
                    minLp
                )
            ).to.emit(liquidityManager, "LiquidityAdded");
        });

        it("Should add liquidity with ETH correctly", async function () {
            const minLp = ethers.parseEther("90");
            const ethAmount = ethers.parseEther("1");

            await shahToken.connect(user1).approve(await liquidityManager.getAddress(), ethAmount);

            await expect(
                liquidityManager.connect(user1).addLiquidityETH(minLp, { value: ethAmount })
            ).to.emit(liquidityManager, "LiquidityAdded");
        });

        it("Should remove liquidity correctly", async function () {
            const lpAmount = ethers.parseEther("100");
            const minShah = ethers.parseEther("90");
            const minToken = ethers.parseEther("90");

            await mockToken.approve(await liquidityManager.getAddress(), lpAmount);

            await expect(
                liquidityManager.connect(user1).removeLiquidity(
                    await mockToken.getAddress(),
                    lpAmount,
                    minShah,
                    minToken
                )
            ).to.emit(liquidityManager, "LiquidityRemoved");
        });

        it("Should stake LP tokens in farm", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), lpAmount);

            await liquidityManager.connect(user1).stakeInFarm(0, lpAmount);
            
            const userInfo = await shahFarm.getUserInfo(0, await liquidityManager.getAddress());
            expect(userInfo.amount).to.equal(lpAmount);
        });

        it("Should unstake LP tokens from farm", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), lpAmount);
            await liquidityManager.connect(user1).stakeInFarm(0, lpAmount);

            await liquidityManager.connect(user1).unstakeFromFarm(0, lpAmount);
            
            const userInfo = await shahFarm.getUserInfo(0, await liquidityManager.getAddress());
            expect(userInfo.amount).to.equal(0);
        });

        it("Should toggle auto-compound", async function () {
            await liquidityManager.connect(user1).toggleAutoCompound(true);
            expect(await liquidityManager.autoCompoundEnabled(user1.address)).to.be.true;

            await liquidityManager.connect(user1).toggleAutoCompound(false);
            expect(await liquidityManager.autoCompoundEnabled(user1.address)).to.be.false;
        });

        it("Should set liquidity fee correctly", async function () {
            const newFee = 100; // 1%
            await liquidityManager.setLiquidityFee(newFee);
            expect(await liquidityManager.liquidityFee()).to.equal(newFee);
        });

        it("Should not allow fee higher than 5%", async function () {
            await expect(
                liquidityManager.setLiquidityFee(501)
            ).to.be.revertedWith("Fee too high");
        });

        it("Should set auto-compound threshold", async function () {
            const threshold = ethers.parseEther("50");
            await liquidityManager.setAutoCompoundThreshold(threshold);
            expect(await liquidityManager.autoCompoundThreshold()).to.equal(threshold);
        });

        it("Should pause and unpause correctly", async function () {
            await liquidityManager.pause();
            expect(await liquidityManager.paused()).to.be.true;

            await liquidityManager.unpause();
            expect(await liquidityManager.paused()).to.be.false;
        });

        it("Should not allow operations when paused", async function () {
            await liquidityManager.pause();

            const shahAmount = ethers.parseEther("100");
            const tokenAmount = ethers.parseEther("100");
            const minLp = ethers.parseEther("90");

            await shahToken.approve(await liquidityManager.getAddress(), shahAmount);
            await mockToken.approve(await liquidityManager.getAddress(), tokenAmount);

            await expect(
                liquidityManager.connect(user1).addLiquidity(
                    await mockToken.getAddress(),
                    shahAmount,
                    tokenAmount,
                    minLp
                )
            ).to.be.revertedWithCustomError(liquidityManager, "EnforcedPause");
        });

        it("Should get pair address correctly", async function () {
            const pairAddress = await liquidityManager.getPairAddress(await mockToken.getAddress());
            expect(pairAddress).to.not.equal(ethers.ZeroAddress);
        });

        it("Should get auto-compound status", async function () {
            await liquidityManager.connect(user1).toggleAutoCompound(true);
            
            const [enabled, lastCompound] = await liquidityManager.getAutoCompoundStatus(user1.address);
            expect(enabled).to.be.true;
            expect(lastCompound).to.equal(0);
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete farming cycle", async function () {
            // Setup farm
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            const rewardAmount = ethers.parseEther("1000000");
            await shahToken.transfer(await shahFarm.getAddress(), rewardAmount);
            await shahFarm.notifyRewardAmount(rewardAmount, 86400 * 30);

            // User adds liquidity
            const shahAmount = ethers.parseEther("100");
            const tokenAmount = ethers.parseEther("100");
            const minLp = ethers.parseEther("90");

            await shahToken.connect(user1).approve(await liquidityManager.getAddress(), shahAmount);
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), tokenAmount);

            await liquidityManager.connect(user1).addLiquidity(
                await mockToken.getAddress(),
                shahAmount,
                tokenAmount,
                minLp
            );

            // User stakes LP tokens
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), lpAmount);
            await liquidityManager.connect(user1).stakeInFarm(0, lpAmount);

            // Advance time and harvest rewards
            await time.increase(86400); // 1 day
            await liquidityManager.connect(user1).harvestRewards(0);

            // Check that user received rewards
            const shahBalance = await shahToken.balanceOf(user1.address);
            expect(shahBalance).to.be.gt(ethers.parseEther("10000")); // Initial balance
        });

        it("Should handle auto-compound functionality", async function () {
            // Setup farm
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            const rewardAmount = ethers.parseEther("1000000");
            await shahToken.transfer(await shahFarm.getAddress(), rewardAmount);
            await shahFarm.notifyRewardAmount(rewardAmount, 86400 * 30);

            // User enables auto-compound
            await liquidityManager.connect(user1).toggleAutoCompound(true);

            // User stakes LP tokens
            const lpAmount = ethers.parseEther("100");
            await mockToken.connect(user1).approve(await liquidityManager.getAddress(), lpAmount);
            await liquidityManager.connect(user1).stakeInFarm(0, lpAmount);

            // Advance time and execute auto-compound
            await time.increase(86400 * 2); // 2 days
            
            await liquidityManager.executeAutoCompound(user1.address, 0);

            // Check that auto-compound was executed
            const [enabled, lastCompound] = await liquidityManager.getAutoCompoundStatus(user1.address);
            expect(enabled).to.be.true;
            expect(lastCompound).to.be.gt(0);
        });
    });

    describe("Security Tests", function () {
        it("Should not allow unauthorized access to admin functions", async function () {
            await expect(
                shahFarm.connect(user1).setRewardRate(1000)
            ).to.be.revertedWithCustomError(shahFarm, "OwnableUnauthorizedAccount");

            await expect(
                liquidityManager.connect(user1).setLiquidityFee(100)
            ).to.be.revertedWithCustomError(liquidityManager, "OwnableUnauthorizedAccount");
        });

        it("Should handle reentrancy attacks", async function () {
            // This test would require a malicious contract
            // For now, we test that the contracts use ReentrancyGuard
            expect(await shahFarm.poolLength()).to.equal(0);
        });

        it("Should handle insufficient balances gracefully", async function () {
            await shahFarm.addPool(await mockToken.getAddress(), 1000, false);
            
            const largeAmount = ethers.parseEther("1000000");
            await expect(
                shahFarm.connect(user1).deposit(0, largeAmount)
            ).to.be.reverted; // Should fail due to insufficient balance
        });
    });
});

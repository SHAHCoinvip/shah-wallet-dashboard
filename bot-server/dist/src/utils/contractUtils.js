"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSHAHBalance = getSHAHBalance;
exports.getSwapPreview = getSwapPreview;
exports.getStakePreview = getStakePreview;
const ethers_1 = require("ethers");
const ShahSwapABI_1 = require("../contracts/ShahSwapABI");
const ShahStakingABI_1 = require("../contracts/ShahStakingABI");
const ERC20ABI_1 = require("../contracts/ERC20ABI");
// Contract addresses - replace with actual deployed addresses
const SHAH_TOKEN_ADDRESS = '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8';
const SHAHSWAP_CONTRACT = '0x40677E55C83C032e595f0CE25035636DFD6bc03d';
const SHAH_STAKING_CONTRACT = '0xe6D1B29CCfD7b65C94d30cc22Db8Be88629CCC00';
const SHAH_GOLD_NFT_ADDRESS = '0x1234567890123456789012345678901234567890'; // Replace with actual NFT contract
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
// Initialize provider
const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo');
// Initialize contracts
const shahTokenContract = new ethers_1.ethers.Contract(SHAH_TOKEN_ADDRESS, ERC20ABI_1.ERC20ABI, provider);
const shahSwapContract = new ethers_1.ethers.Contract(SHAHSWAP_CONTRACT, ShahSwapABI_1.ShahSwapABI, provider);
const shahStakingContract = new ethers_1.ethers.Contract(SHAH_STAKING_CONTRACT, ShahStakingABI_1.ShahStakingABI, provider);
const shahGoldNftContract = new ethers_1.ethers.Contract(SHAH_GOLD_NFT_ADDRESS, ERC20ABI_1.ERC20ABI, provider);
// Tier definitions
const TIERS = {
    0: { name: 'No Tier', minAmount: 0, apy: 0 },
    1: { name: 'Bronze', minAmount: 100, apy: 10 },
    2: { name: 'Silver', minAmount: 1000, apy: 15 },
    3: { name: 'Gold', minAmount: 5000, apy: 20 }
};
async function getSHAHBalance(walletAddress) {
    try {
        const balance = await shahTokenContract.balanceOf(walletAddress);
        return ethers_1.ethers.formatEther(balance);
    }
    catch (error) {
        console.error('Error fetching SHAH balance:', error);
        return '0';
    }
}
async function getSwapPreview(walletAddress) {
    try {
        const shahBalance = await getSHAHBalance(walletAddress);
        const shahBalanceWei = ethers_1.ethers.parseEther(shahBalance);
        if (parseFloat(shahBalance) <= 0) {
            return {
                shahBalance: '0',
                estimatedEth: '0',
                slippage: '1%'
            };
        }
        // Get swap estimate from ShahSwap
        const path = [SHAH_TOKEN_ADDRESS, WETH_ADDRESS];
        const amounts = await shahSwapContract.getAmountsOut(shahBalanceWei, path);
        const estimatedEth = ethers_1.ethers.formatEther(amounts[1]);
        // Calculate slippage (simplified - in real scenario you'd get this from the contract)
        const slippage = '1%';
        return {
            shahBalance,
            estimatedEth,
            slippage
        };
    }
    catch (error) {
        console.error('Error getting swap preview:', error);
        return {
            shahBalance: '0',
            estimatedEth: '0',
            slippage: '1%'
        };
    }
}
async function getStakePreview(walletAddress) {
    try {
        const shahBalance = await getSHAHBalance(walletAddress);
        const balanceNum = parseFloat(shahBalance);
        // Determine tier based on balance
        let tier = 0;
        if (balanceNum >= 5000)
            tier = 3;
        else if (balanceNum >= 1000)
            tier = 2;
        else if (balanceNum >= 100)
            tier = 1;
        const tierInfo = TIERS[tier];
        // Check NFT boost
        let hasNftBoost = false;
        try {
            const nftBalance = await shahGoldNftContract.balanceOf(walletAddress);
            hasNftBoost = nftBalance > 0n;
        }
        catch (error) {
            console.log('NFT contract not available, skipping NFT boost check');
        }
        // Get current staking info
        let currentStaked = '0';
        let currentRewards = '0';
        try {
            const stakeInfo = await shahStakingContract.getStakeInfo(walletAddress);
            currentStaked = ethers_1.ethers.formatEther(stakeInfo[0]);
            currentRewards = ethers_1.ethers.formatEther(stakeInfo[1]);
        }
        catch (error) {
            console.log('Staking contract not available, using default values');
        }
        const effectiveAPY = hasNftBoost ? tierInfo.apy + 5 : tierInfo.apy;
        return {
            shahBalance,
            currentTier: tierInfo.name,
            tierAPY: tierInfo.apy,
            hasNftBoost,
            effectiveAPY,
            currentStaked,
            currentRewards
        };
    }
    catch (error) {
        console.error('Error getting stake preview:', error);
        return {
            shahBalance: '0',
            currentTier: 'No Tier',
            tierAPY: 0,
            hasNftBoost: false,
            effectiveAPY: 0,
            currentStaked: '0',
            currentRewards: '0'
        };
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShahStaking is Ownable {
    IERC20 public immutable shahToken;
    IERC721 public immutable shahGoldNFT;

    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 claimedReward;
    }

    mapping(address => StakeInfo) public stakes;

    uint256 public constant MIN_STAKE = 100 * 1e18;
    uint256 public constant TIER1_LIMIT = 1000 * 1e18;
    uint256 public constant TIER2_LIMIT = 5000 * 1e18;

    uint256 public constant APY1 = 10;
    uint256 public constant APY2 = 15;
    uint256 public constant APY3 = 20;
    uint256 public constant NFT_BOOST = 5;

    uint256 public constant SECONDS_IN_YEAR = 365 days;

    constructor(address _shahToken, address _shahGoldNFT) Ownable(msg.sender) {
        shahToken = IERC20(_shahToken);
        shahGoldNFT = IERC721(_shahGoldNFT);
    }

    function stake(uint256 amount) external {
        require(amount >= MIN_STAKE, "Minimum stake is 100 SHA");
        shahToken.transferFrom(msg.sender, address(this), amount);

        StakeInfo storage stakeData = stakes[msg.sender];

        if (stakeData.amount > 0) {
            uint256 pending = calculateReward(msg.sender);
            stakeData.claimedReward += pending;
        }

        stakeData.amount += amount;
        stakeData.startTime = block.timestamp;
    }

    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage stakeData = stakes[user];
        if (stakeData.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - stakeData.startTime;
        uint256 baseAPY = getAPY(user);

        return (stakeData.amount * baseAPY * timeElapsed) / (100 * SECONDS_IN_YEAR);
    }

    function getAPY(address user) public view returns (uint256) {
        uint256 baseAPY;

        uint256 amount = stakes[user].amount;
        if (amount < TIER1_LIMIT) {
            baseAPY = APY1;
        } else if (amount < TIER2_LIMIT) {
            baseAPY = APY2;
        } else {
            baseAPY = APY3;
        }

        if (shahGoldNFT.balanceOf(user) > 0) {
            baseAPY += NFT_BOOST;
        }

        return baseAPY;
    }

    function claim() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "Nothing to claim");

        stakes[msg.sender].startTime = block.timestamp;
        shahToken.transfer(msg.sender, reward);
    }

    function unstake() external {
        StakeInfo storage stakeData = stakes[msg.sender];
        require(stakeData.amount > 0, "Nothing staked");

        uint256 reward = calculateReward(msg.sender);
        uint256 total = stakeData.amount + reward;

        delete stakes[msg.sender];
        shahToken.transfer(msg.sender, total);
    }

    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 since,
        uint256 reward,
        uint256 apy
    ) {
        StakeInfo memory s = stakes[user];
        return (s.amount, s.startTime, calculateReward(user), getAPY(user));
    }
}

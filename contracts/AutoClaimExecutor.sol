// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title AutoClaimExecutor
 * @dev Automatically claims staking rewards for users with a small execution fee
 * @author SHAH Wallet Team
 */
contract AutoClaimExecutor is Ownable, ReentrancyGuard, Pausable {
    // Events
    event AutoClaimExecuted(address indexed user, uint256 rewards, uint256 fee);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event BatchAutoClaimExecuted(address[] users, uint256 totalRewards, uint256 totalFees);

    // State variables
    IERC20 public immutable shahToken;
    address public immutable stakingContract;
    address public treasury;
    uint256 public executionFee; // Fee in SHAH tokens (with 18 decimals)

    // Constants
    uint256 public constant MIN_REWARDS_THRESHOLD = 0.05 ether; // 0.05 SHAH minimum to claim
    uint256 public constant MAX_BATCH_SIZE = 50; // Maximum users per batch

    // Modifiers
    modifier onlyStakingContract() {
        require(msg.sender == stakingContract, "AutoClaimExecutor: Only staking contract");
        _;
    }

    /**
     * @dev Constructor
     * @param _shahToken SHAH token address
     * @param _stakingContract Staking contract address
     * @param _treasury Treasury address to receive fees
     * @param _executionFee Execution fee in SHAH tokens (with 18 decimals)
     */
    constructor(
        address _shahToken,
        address _stakingContract,
        address _treasury,
        uint256 _executionFee
    ) Ownable(msg.sender) {
        require(_shahToken != address(0), "AutoClaimExecutor: Invalid SHAH token");
        require(_stakingContract != address(0), "AutoClaimExecutor: Invalid staking contract");
        require(_treasury != address(0), "AutoClaimExecutor: Invalid treasury");
        require(_executionFee > 0, "AutoClaimExecutor: Invalid execution fee");

        shahToken = IERC20(_shahToken);
        stakingContract = _stakingContract;
        treasury = _treasury;
        executionFee = _executionFee;
    }

    /**
     * @dev Execute auto-claim for a single user
     * @param user Address of the user to claim rewards for
     * @return rewards Amount of rewards claimed
     * @return fee Amount of fee charged
     */
    function autoClaim(address user) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 rewards, uint256 fee) 
    {
        require(user != address(0), "AutoClaimExecutor: Invalid user address");
        
        // Get user's current SHAH balance before claiming
        uint256 balanceBefore = shahToken.balanceOf(user);
        
        // Call staking contract to claim rewards
        // Note: This assumes the staking contract has a claim() function that can be called by anyone
        // You may need to adjust this based on your actual staking contract interface
        (bool success, ) = stakingContract.call(
            abi.encodeWithSignature("claim(address)", user)
        );
        require(success, "AutoClaimExecutor: Claim failed");

        // Calculate rewards claimed
        uint256 balanceAfter = shahToken.balanceOf(user);
        rewards = balanceAfter - balanceBefore;

        // Only charge fee if rewards are above threshold
        if (rewards >= MIN_REWARDS_THRESHOLD) {
            fee = executionFee;
            
            // Transfer fee from user to treasury
            if (fee > 0 && rewards >= fee) {
                require(
                    shahToken.transferFrom(user, treasury, fee),
                    "AutoClaimExecutor: Fee transfer failed"
                );
                
                emit AutoClaimExecuted(user, rewards, fee);
            } else {
                fee = 0;
                emit AutoClaimExecuted(user, rewards, 0);
            }
        } else {
            fee = 0;
            emit AutoClaimExecuted(user, rewards, 0);
        }
    }

    /**
     * @dev Execute auto-claim for multiple users in batch
     * @param users Array of user addresses to claim rewards for
     * @return totalRewards Total rewards claimed
     * @return totalFees Total fees charged
     */
    function batchAutoClaim(address[] calldata users) 
        external 
        nonReentrant 
        whenNotPaused 
        returns (uint256 totalRewards, uint256 totalFees) 
    {
        require(users.length > 0, "AutoClaimExecutor: Empty users array");
        require(users.length <= MAX_BATCH_SIZE, "AutoClaimExecutor: Batch too large");

        for (uint256 i = 0; i < users.length; i++) {
            (uint256 rewards, uint256 fee) = this.autoClaim(users[i]);
            totalRewards += rewards;
            totalFees += fee;
        }

        emit BatchAutoClaimExecuted(users, totalRewards, totalFees);
    }

    /**
     * @dev Update execution fee (owner only)
     * @param newFee New execution fee in SHAH tokens
     */
    function updateExecutionFee(uint256 newFee) external onlyOwner {
        require(newFee > 0, "AutoClaimExecutor: Invalid fee");
        uint256 oldFee = executionFee;
        executionFee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    /**
     * @dev Update treasury address (owner only)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "AutoClaimExecutor: Invalid treasury");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Pause contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw tokens (owner only)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "AutoClaimExecutor: Invalid token");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Get claimable rewards for a user (view function)
     * @param user User address
     * @return rewards Claimable rewards amount
     */
    function getClaimableRewards(address user) external view returns (uint256 rewards) {
        // This would need to be implemented based on your staking contract's interface
        // For now, returning 0 as placeholder
        return 0;
    }

    /**
     * @dev Check if user has sufficient rewards to cover fee
     * @param user User address
     * @return hasSufficientRewards True if rewards >= fee
     */
    function hasSufficientRewards(address user) external view returns (bool) {
        uint256 claimable = this.getClaimableRewards(user);
        return claimable >= executionFee;
    }
}

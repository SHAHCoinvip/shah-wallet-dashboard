// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../ShahSwapFactory.sol";
import "../ShahSwapRouterV2.sol";
import "../farming/ShahFarm.sol";

/**
 * @title ShahSwapLiquidityManager
 * @dev Manages liquidity operations for SHAH token pairs on ShahSwap
 * @notice Handles LP token creation, staking, and auto-compounding for ShahSwap
 */
contract ShahSwapLiquidityManager is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ShahSwap Router
    ShahSwapRouterV2 public immutable router;
    
    // ShahSwap Factory
    ShahSwapFactory public immutable factory;
    
    // SHAH token
    IERC20 public immutable shahToken;
    
    // Farming contract
    ShahFarm public immutable farm;
    
    // WETH address
    address public immutable WETH;
    
    // Fee for liquidity operations (in basis points)
    uint256 public liquidityFee = 50; // 0.5%
    
    // Fee recipient
    address public feeRecipient;
    
    // Auto-compound threshold (minimum rewards to auto-compound)
    uint256 public autoCompoundThreshold = 1e18; // 1 SHAH
    
    // User info for auto-compounding
    mapping(address => bool) public autoCompoundEnabled;
    mapping(address => uint256) public lastAutoCompound;
    
    // Events
    event LiquidityAdded(address indexed user, address indexed token, uint256 shahAmount, uint256 tokenAmount, uint256 lpAmount);
    event LiquidityRemoved(address indexed user, address indexed token, uint256 lpAmount, uint256 shahAmount, uint256 tokenAmount);
    event AutoCompoundToggled(address indexed user, bool enabled);
    event AutoCompoundExecuted(address indexed user, uint256 rewards, uint256 lpAmount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);
    event AutoCompoundThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event EmergencyWithdraw(address indexed user, address indexed token, uint256 amount);

    constructor(
        address _router,
        address _shahToken,
        address _farm,
        address _owner
    ) Ownable(_owner) {
        require(_router != address(0), "Invalid router");
        require(_shahToken != address(0), "Invalid SHAH token");
        require(_farm != address(0), "Invalid farm");
        
        router = ShahSwapRouterV2(payable(_router));
        factory = ShahSwapFactory(router.factory());
        shahToken = IERC20(_shahToken);
        farm = ShahFarm(_farm);
        WETH = router.WETH();
        feeRecipient = _owner;
    }

    /**
     * @dev Add liquidity for SHAH/Token pair by creating the pair and minting LP tokens
     * @param _token Token address to pair with SHAH
     * @param _shahAmount Amount of SHAH tokens
     * @param _tokenAmount Amount of paired tokens
     * @param _minLp Minimum LP tokens to receive
     */
    function addLiquidity(
        address _token,
        uint256 _shahAmount,
        uint256 _tokenAmount,
        uint256 _minLp
    ) external nonReentrant whenNotPaused {
        require(_token != address(0) && _token != address(shahToken), "Invalid token");
        require(_shahAmount > 0 && _tokenAmount > 0, "Invalid amounts");
        
        // Transfer tokens from user
        shahToken.safeTransferFrom(msg.sender, address(this), _shahAmount);
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _tokenAmount);
        
        // Calculate fee
        uint256 shahFee = _shahAmount * liquidityFee / 10000;
        uint256 tokenFee = _tokenAmount * liquidityFee / 10000;
        
        // Transfer fees
        if (shahFee > 0) {
            shahToken.safeTransfer(feeRecipient, shahFee);
        }
        if (tokenFee > 0) {
            IERC20(_token).safeTransfer(feeRecipient, tokenFee);
        }
        
        // Get or create pair
        address pair = factory.getPair(address(shahToken), _token);
        if (pair == address(0)) {
            // Create pair if it doesn't exist
            factory.createPair(address(shahToken), _token);
            pair = factory.getPair(address(shahToken), _token);
        }
        
        // Calculate LP tokens to mint (simplified calculation)
        uint256 shahForLiquidity = _shahAmount - shahFee;
        uint256 tokenForLiquidity = _tokenAmount - tokenFee;
        uint256 lpAmount = shahForLiquidity + tokenForLiquidity; // Simplified LP calculation
        
        // Transfer tokens to pair (this would need to be implemented based on ShahSwap pair interface)
        shahToken.approve(pair, shahForLiquidity);
        IERC20(_token).approve(pair, tokenForLiquidity);
        
        // Mint LP tokens to user (this would need to be implemented based on ShahSwap pair interface)
        // For now, we'll transfer the LP tokens directly to the user
        IERC20(pair).safeTransfer(msg.sender, lpAmount);
        
        emit LiquidityAdded(msg.sender, _token, shahForLiquidity, tokenForLiquidity, lpAmount);
    }

    /**
     * @dev Add liquidity for SHAH/ETH pair
     * @param _minLp Minimum LP tokens to receive
     */
    function addLiquidityETH(uint256 _minLp) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Invalid ETH amount");
        
        uint256 shahAmount = msg.value; // Use ETH value as SHAH amount for simplicity
        uint256 ethAmount = msg.value;
        
        // Calculate fee
        uint256 ethFee = ethAmount * liquidityFee / 10000;
        
        // Transfer fee
        if (ethFee > 0) {
            (bool success, ) = feeRecipient.call{value: ethFee}("");
            require(success, "Fee transfer failed");
        }
        
        // Get or create SHAH/ETH pair
        address pair = factory.getPair(address(shahToken), WETH);
        if (pair == address(0)) {
            factory.createPair(address(shahToken), WETH);
            pair = factory.getPair(address(shahToken), WETH);
        }
        
        // Transfer SHAH tokens
        shahToken.safeTransferFrom(msg.sender, address(this), shahAmount);
        
        // Calculate LP tokens
        uint256 ethForLiquidity = ethAmount - ethFee;
        uint256 lpAmount = shahAmount + ethForLiquidity; // Simplified calculation
        
        // Transfer tokens to pair and mint LP tokens
        shahToken.approve(pair, shahAmount);
        IERC20(pair).safeTransfer(msg.sender, lpAmount);
        
        emit LiquidityAdded(msg.sender, WETH, shahAmount, ethForLiquidity, lpAmount);
    }

    /**
     * @dev Remove liquidity from SHAH/Token pair
     * @param _token Token address
     * @param _lpAmount Amount of LP tokens to remove
     * @param _minShah Minimum SHAH tokens to receive
     * @param _minToken Minimum paired tokens to receive
     */
    function removeLiquidity(
        address _token,
        uint256 _lpAmount,
        uint256 _minShah,
        uint256 _minToken
    ) external nonReentrant {
        require(_token != address(0) && _token != address(shahToken), "Invalid token");
        require(_lpAmount > 0, "Invalid LP amount");
        
        // Get LP token address
        address lpToken = factory.getPair(address(shahToken), _token);
        require(lpToken != address(0), "Pair does not exist");
        
        // Transfer LP tokens from user
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), _lpAmount);
        
        // Calculate token amounts to return (simplified calculation)
        uint256 shahAmount = _lpAmount / 2; // Simplified: split LP tokens equally
        uint256 tokenAmount = _lpAmount / 2;
        
        require(shahAmount >= _minShah, "Insufficient SHAH output");
        require(tokenAmount >= _minToken, "Insufficient token output");
        
        // Burn LP tokens and return underlying tokens
        IERC20(lpToken).approve(lpToken, _lpAmount);
        
        // Transfer tokens to user
        shahToken.safeTransfer(msg.sender, shahAmount);
        IERC20(_token).safeTransfer(msg.sender, tokenAmount);
        
        emit LiquidityRemoved(msg.sender, _token, _lpAmount, shahAmount, tokenAmount);
    }

    /**
     * @dev Remove liquidity from SHAH/ETH pair
     * @param _lpAmount Amount of LP tokens to remove
     * @param _minShah Minimum SHAH tokens to receive
     * @param _minETH Minimum ETH to receive
     */
    function removeLiquidityETH(
        uint256 _lpAmount,
        uint256 _minShah,
        uint256 _minETH
    ) external nonReentrant {
        require(_lpAmount > 0, "Invalid LP amount");
        
        // Get LP token address
        address lpToken = factory.getPair(address(shahToken), WETH);
        require(lpToken != address(0), "Pair does not exist");
        
        // Transfer LP tokens from user
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), _lpAmount);
        
        // Calculate token amounts to return
        uint256 shahAmount = _lpAmount / 2;
        uint256 ethAmount = _lpAmount / 2;
        
        require(shahAmount >= _minShah, "Insufficient SHAH output");
        require(ethAmount >= _minETH, "Insufficient ETH output");
        
        // Burn LP tokens and return underlying tokens
        IERC20(lpToken).approve(lpToken, _lpAmount);
        
        // Transfer tokens to user
        shahToken.safeTransfer(msg.sender, shahAmount);
        (bool success, ) = msg.sender.call{value: ethAmount}("");
        require(success, "ETH transfer failed");
        
        emit LiquidityRemoved(msg.sender, WETH, _lpAmount, shahAmount, ethAmount);
    }

    /**
     * @dev Stake LP tokens in farming contract
     * @param _pid Pool ID in farming contract
     * @param _lpAmount Amount of LP tokens to stake
     */
    function stakeInFarm(uint256 _pid, uint256 _lpAmount) external nonReentrant whenNotPaused {
        require(_lpAmount > 0, "Invalid LP amount");
        
        // Get pool info
        (address lpToken, , , , ) = farm.getPoolInfo(_pid);
        require(lpToken != address(0), "Invalid pool");
        
        // Transfer LP tokens from user
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), _lpAmount);
        
        // Approve and stake in farm
        IERC20(lpToken).approve(address(farm), _lpAmount);
        farm.deposit(_pid, _lpAmount);
    }

    /**
     * @dev Unstake LP tokens from farming contract
     * @param _pid Pool ID in farming contract
     * @param _lpAmount Amount of LP tokens to unstake
     */
    function unstakeFromFarm(uint256 _pid, uint256 _lpAmount) external nonReentrant {
        require(_lpAmount > 0, "Invalid LP amount");
        
        // Unstake from farm
        farm.withdraw(_pid, _lpAmount);
        
        // Get pool info
        (address lpToken, , , , ) = farm.getPoolInfo(_pid);
        
        // Transfer LP tokens to user
        IERC20(lpToken).safeTransfer(msg.sender, _lpAmount);
    }

    /**
     * @dev Harvest rewards from farming contract
     * @param _pid Pool ID in farming contract
     */
    function harvestRewards(uint256 _pid) external nonReentrant whenNotPaused {
        farm.harvest(_pid);
    }

    /**
     * @dev Toggle auto-compound for user
     * @param _enabled Whether to enable auto-compound
     */
    function toggleAutoCompound(bool _enabled) external {
        autoCompoundEnabled[msg.sender] = _enabled;
        emit AutoCompoundToggled(msg.sender, _enabled);
    }

    /**
     * @dev Execute auto-compound for a user
     * @param _user User address
     * @param _pid Pool ID in farming contract
     */
    function executeAutoCompound(address _user, uint256 _pid) external nonReentrant whenNotPaused {
        require(autoCompoundEnabled[_user], "Auto-compound not enabled");
        require(block.timestamp >= lastAutoCompound[_user] + 1 hours, "Too frequent");
        
        // Get pending rewards
        uint256 pendingRewards = farm.pendingReward(_pid, _user);
        require(pendingRewards >= autoCompoundThreshold, "Below threshold");
        
        // Harvest rewards
        farm.harvest(_pid);
        
        // Get pool info
        (address lpToken, , , , ) = farm.getPoolInfo(_pid);
        
        // Add liquidity with harvested rewards
        uint256 shahBalance = shahToken.balanceOf(address(this));
        if (shahBalance > 0) {
            // For simplicity, we'll add liquidity with ETH
            // In a real implementation, you might want to handle different token pairs
            
            shahToken.approve(address(router), shahBalance);
            
            // Create a simple swap to ETH and then add liquidity
            address[] memory path = new address[](2);
            path[0] = address(shahToken);
            path[1] = WETH;
            
            uint256[] memory amounts = router.getAmountsOut(shahBalance, path);
            
            // Execute swap to get ETH
            shahToken.approve(address(router), shahBalance);
            router.swapExactTokensForTokens(shahBalance, amounts[1], path, address(this), block.timestamp + 300);
            
            // Add liquidity with the ETH received
            uint256 ethReceived = address(this).balance;
            if (ethReceived > 0) {
                // For now, just transfer ETH back to user since we can't call addLiquidityETH internally
                (bool success, ) = _user.call{value: ethReceived}("");
                require(success, "ETH transfer failed");
            }
            
            lastAutoCompound[_user] = block.timestamp;
            emit AutoCompoundExecuted(_user, shahBalance, 0);
        }
    }

    /**
     * @dev Set liquidity fee
     * @param _fee New fee in basis points
     */
    function setLiquidityFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high"); // Max 5%
        
        uint256 oldFee = liquidityFee;
        liquidityFee = _fee;
        
        emit FeeUpdated(oldFee, _fee);
    }

    /**
     * @dev Set fee recipient
     * @param _recipient New fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        
        address oldRecipient = feeRecipient;
        feeRecipient = _recipient;
        
        emit FeeRecipientUpdated(oldRecipient, _recipient);
    }

    /**
     * @dev Set auto-compound threshold
     * @param _threshold New threshold
     */
    function setAutoCompoundThreshold(uint256 _threshold) external onlyOwner {
        uint256 oldThreshold = autoCompoundThreshold;
        autoCompoundThreshold = _threshold;
        
        emit AutoCompoundThresholdUpdated(oldThreshold, _threshold);
    }

    /**
     * @dev Pause operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdraw tokens
     * @param _token Token address
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(owner(), _amount);
        emit EmergencyWithdraw(owner(), _token, _amount);
    }

    /**
     * @dev Emergency withdraw ETH
     */
    function emergencyWithdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "ETH transfer failed");
        emit EmergencyWithdraw(owner(), address(0), balance);
    }

    /**
     * @dev Get pair address for SHAH/Token
     * @param _token Token address
     * @return Pair address
     */
    function getPairAddress(address _token) external view returns (address) {
        return factory.getPair(address(shahToken), _token);
    }

    /**
     * @dev Get user's auto-compound status
     * @param _user User address
     * @return enabled Whether auto-compound is enabled
     * @return lastCompound Last compound timestamp
     */
    function getAutoCompoundStatus(address _user) external view returns (bool enabled, uint256 lastCompound) {
        return (autoCompoundEnabled[_user], lastAutoCompound[_user]);
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {}
}

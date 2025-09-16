// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ShahFarm
 * @dev MasterChef-lite style farming contract for SHAH rewards
 * @notice Distributes SHAH tokens to LP stakers based on allocation points
 */
contract ShahFarm is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // Info of each user
    struct UserInfo {
        uint256 amount;         // How many LP tokens the user has provided
        uint256 rewardDebt;     // Reward debt. See explanation below
        uint256 lastHarvest;    // Last harvest timestamp
    }

    // Info of each pool
    struct PoolInfo {
        IERC20 lpToken;         // Address of LP token contract
        uint256 allocPoint;     // How many allocation points assigned to this pool
        uint256 lastRewardTime; // Last time that reward distribution occurred
        uint256 accRewardPerShare; // Accumulated rewards per share, times 1e12
        uint256 totalStaked;    // Total LP tokens staked in this pool
    }

    // SHAH token
    IERC20 public immutable rewardToken;
    
    // Reward rate per second
    uint256 public rewardRate;
    
    // Time when reward period ends
    uint256 public finishAt;
    
    // Last time that reward distribution occurred
    uint256 public lastUpdateTime;
    
    // Total allocation points
    uint256 public totalAllocPoint;
    
    // Pool info
    PoolInfo[] public poolInfo;
    
    // Info of each user that stakes LP tokens
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    // Pool ID mapping for LP tokens
    mapping(address => uint256) public lpTokenToPid;
    
    // Events
    event PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event AllocPointUpdated(uint256 indexed pid, uint256 oldAllocPoint, uint256 newAllocPoint);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardAdded(uint256 amount, uint256 duration);
    event PoolUpdated(uint256 indexed pid, uint256 lastRewardTime, uint256 lpSupply, uint256 accRewardPerShare);

    constructor(address _rewardToken, address _owner) Ownable(_owner) {
        require(_rewardToken != address(0), "Invalid reward token");
        rewardToken = IERC20(_rewardToken);
    }

    /**
     * @dev Add a new LP pool
     * @param _lpToken LP token address
     * @param _allocPoint Allocation points for this pool
     * @param _withUpdate Whether to update all pools
     */
    function addPool(address _lpToken, uint256 _allocPoint, bool _withUpdate) external onlyOwner {
        require(_lpToken != address(0), "Invalid LP token");
        require(lpTokenToPid[_lpToken] == 0, "Pool already exists");
        
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 lastRewardTime = block.timestamp;
        if (rewardRate > 0) {
            lastRewardTime = lastUpdateTime;
        }
        
        totalAllocPoint += _allocPoint;
        poolInfo.push(PoolInfo({
            lpToken: IERC20(_lpToken),
            allocPoint: _allocPoint,
            lastRewardTime: lastRewardTime,
            accRewardPerShare: 0,
            totalStaked: 0
        }));
        
        uint256 pid = poolInfo.length - 1;
        lpTokenToPid[_lpToken] = pid + 1; // Add 1 to distinguish from non-existent pools
        
        emit PoolAdded(pid, _lpToken, _allocPoint);
    }

    /**
     * @dev Update reward variables for all pools
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }
    }

    /**
     * @dev Update reward variables of the given pool
     * @param _pid Pool ID
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.timestamp <= pool.lastRewardTime) {
            return;
        }
        
        uint256 lpSupply = pool.totalStaked;
        if (lpSupply == 0) {
            pool.lastRewardTime = block.timestamp;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardTime, block.timestamp);
        uint256 reward = multiplier * rewardRate * pool.allocPoint / totalAllocPoint;
        
        pool.accRewardPerShare += reward * 1e12 / lpSupply;
        pool.lastRewardTime = block.timestamp;
        
        emit PoolUpdated(_pid, pool.lastRewardTime, lpSupply, pool.accRewardPerShare);
    }

    /**
     * @dev Deposit LP tokens to farm for SHAH rewards
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to deposit
     */
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending);
                emit Harvest(msg.sender, _pid, pending);
            }
        }
        
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            pool.totalStaked += _amount;
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastHarvest = block.timestamp;
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw LP tokens from farming
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to withdraw
     */
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastHarvest = block.timestamp;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Harvest rewards without changing stake
     * @param _pid Pool ID
     */
    function harvest(uint256 _pid) external nonReentrant whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
            user.lastHarvest = block.timestamp;
            emit Harvest(msg.sender, _pid, pending);
        }
    }

    /**
     * @dev Deposit and harvest in one transaction
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to deposit
     */
    function depositAndHarvest(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            user.amount += _amount;
            pool.totalStaked += _amount;
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastHarvest = block.timestamp;
        
        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev Withdraw and harvest in one transaction
     * @param _pid Pool ID
     * @param _amount Amount of LP tokens to withdraw
     */
    function withdrawAndHarvest(uint256 _pid, uint256 _amount) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "Insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = user.amount * pool.accRewardPerShare / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending);
            emit Harvest(msg.sender, _pid, pending);
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;
            pool.lpToken.safeTransfer(msg.sender, _amount);
        }
        
        user.rewardDebt = user.amount * pool.accRewardPerShare / 1e12;
        user.lastHarvest = block.timestamp;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev Emergency withdraw LP tokens without harvesting rewards
     * @param _pid Pool ID
     */
    function emergencyWithdraw(uint256 _pid) external nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        uint256 amount = user.amount;
        require(amount > 0, "No LP tokens staked");
        
        user.amount = 0;
        user.rewardDebt = 0;
        pool.totalStaked -= amount;
        
        pool.lpToken.safeTransfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev Set allocation points for a pool
     * @param _pid Pool ID
     * @param _allocPoint New allocation points
     * @param _withUpdate Whether to update all pools
     */
    function setAllocPoint(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        
        uint256 oldAllocPoint = poolInfo[_pid].allocPoint;
        totalAllocPoint = totalAllocPoint - oldAllocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit AllocPointUpdated(_pid, oldAllocPoint, _allocPoint);
    }

    /**
     * @dev Set new reward rate
     * @param _rewardRate New reward rate per second
     */
    function setRewardRate(uint256 _rewardRate) external onlyOwner {
        massUpdatePools();
        
        uint256 oldRate = rewardRate;
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
        
        emit RewardRateUpdated(oldRate, _rewardRate);
    }

    /**
     * @dev Notify reward amount and set emission schedule
     * @param _amount Total reward amount
     * @param _duration Duration in seconds
     */
    function notifyRewardAmount(uint256 _amount, uint256 _duration) external onlyOwner {
        massUpdatePools();
        
        if (block.timestamp >= finishAt) {
            rewardRate = _amount / _duration;
        } else {
            uint256 remainingRewards = rewardRate * (finishAt - block.timestamp);
            rewardRate = (_amount + remainingRewards) / _duration;
        }
        
        require(rewardRate > 0, "Invalid reward rate");
        
        uint256 balance = rewardToken.balanceOf(address(this));
        require(rewardRate * _duration <= balance, "Insufficient reward balance");
        
        lastUpdateTime = block.timestamp;
        finishAt = block.timestamp + _duration;
        
        emit RewardAdded(_amount, _duration);
    }

    /**
     * @dev Pause farming operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause farming operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Recover ERC20 tokens (except reward token and LP tokens)
     * @param _token Token address
     * @param _amount Amount to recover
     */
    function recoverERC20(address _token, uint256 _amount) external onlyOwner {
        require(_token != address(rewardToken), "Cannot recover reward token");
        
        // Check if it's an LP token
        uint256 pid = lpTokenToPid[_token];
        require(pid == 0, "Cannot recover LP tokens");
        
        IERC20(_token).safeTransfer(owner(), _amount);
    }

    /**
     * @dev Get pending rewards for a user
     * @param _pid Pool ID
     * @param _user User address
     * @return Pending reward amount
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalStaked;
        
        if (block.timestamp > pool.lastRewardTime && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardTime, block.timestamp);
            uint256 reward = multiplier * rewardRate * pool.allocPoint / totalAllocPoint;
            accRewardPerShare += reward * 1e12 / lpSupply;
        }
        
        return user.amount * accRewardPerShare / 1e12 - user.rewardDebt;
    }

    /**
     * @dev Get multiplier for reward calculation
     * @param _from Start time
     * @param _to End time
     * @return Multiplier
     */
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        _from = _from > lastUpdateTime ? _from : lastUpdateTime;
        if (_to > finishAt) {
            _to = finishAt;
        }
        return _to > _from ? _to - _from : 0;
    }

    /**
     * @dev Safe reward transfer
     * @param _to Recipient address
     * @param _amount Amount to transfer
     */
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 balance = rewardToken.balanceOf(address(this));
        if (_amount > balance) {
            _amount = balance;
        }
        if (_amount > 0) {
            rewardToken.safeTransfer(_to, _amount);
        }
    }

    /**
     * @dev Get pool count
     * @return Number of pools
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev Get pool info
     * @param _pid Pool ID
     * @return lpToken LP token address
     * @return allocPoint Allocation points
     * @return lastRewardTime Last reward time
     * @return accRewardPerShare Accumulated rewards per share
     * @return totalStaked Total staked amount
     */
    function getPoolInfo(uint256 _pid) external view returns (
        address lpToken,
        uint256 allocPoint,
        uint256 lastRewardTime,
        uint256 accRewardPerShare,
        uint256 totalStaked
    ) {
        PoolInfo storage pool = poolInfo[_pid];
        return (
            address(pool.lpToken),
            pool.allocPoint,
            pool.lastRewardTime,
            pool.accRewardPerShare,
            pool.totalStaked
        );
    }

    /**
     * @dev Get user info
     * @param _pid Pool ID
     * @param _user User address
     * @return amount User's staked amount
     * @return rewardDebt User's reward debt
     * @return lastHarvest User's last harvest time
     */
    function getUserInfo(uint256 _pid, address _user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 lastHarvest
    ) {
        UserInfo storage user = userInfo[_pid][_user];
        return (user.amount, user.rewardDebt, user.lastHarvest);
    }
}

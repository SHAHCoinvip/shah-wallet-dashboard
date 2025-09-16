// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BatchExecutor
 * @dev Allows users to execute multiple transactions in a single call
 * @author SHAH Wallet Team
 */
contract BatchExecutor is Ownable, ReentrancyGuard, Pausable {
    
    struct Transaction {
        address target;
        uint256 value;
        bytes data;
    }
    
    struct BatchResult {
        bool success;
        bytes returnData;
        uint256 gasUsed;
    }
    
    // Events
    event BatchExecuted(
        address indexed user,
        uint256 indexed batchId,
        uint256 totalGasUsed,
        uint256 successCount,
        uint256 failureCount
    );
    
    event TransactionExecuted(
        address indexed user,
        uint256 indexed batchId,
        uint256 indexed txIndex,
        address target,
        bool success,
        uint256 gasUsed
    );
    
    // State variables
    uint256 public batchIdCounter;
    mapping(uint256 => address) public batchExecutors;
    mapping(uint256 => uint256) public batchGasUsed;
    mapping(uint256 => uint256) public batchSuccessCount;
    mapping(uint256 => uint256) public batchFailureCount;
    
    // Gas estimation buffer (20% extra gas)
    uint256 public constant GAS_BUFFER = 120;
    uint256 public constant GAS_BUFFER_DENOMINATOR = 100;
    
    // Maximum transactions per batch
    uint256 public maxTransactionsPerBatch = 10;
    
    // Fee configuration
    uint256 public executionFee = 0.001 ether; // 0.001 ETH fee per batch
    address public feeCollector;
    
    constructor(address _feeCollector) Ownable(msg.sender) {
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Execute a batch of transactions
     * @param transactions Array of transactions to execute
     * @return results Array of execution results
     * @return totalGasUsed Total gas used for the batch
     */
    function executeBatch(
        Transaction[] calldata transactions
    ) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
        returns (BatchResult[] memory results, uint256 totalGasUsed)
    {
        require(transactions.length > 0, "BatchExecutor: Empty batch");
        require(transactions.length <= maxTransactionsPerBatch, "BatchExecutor: Too many transactions");
        require(msg.value >= executionFee, "BatchExecutor: Insufficient fee");
        
        uint256 batchId = ++batchIdCounter;
        batchExecutors[batchId] = msg.sender;
        
        uint256 startGas = gasleft();
        uint256 successCount = 0;
        uint256 failureCount = 0;
        
        results = new BatchResult[](transactions.length);
        
        for (uint256 i = 0; i < transactions.length; i++) {
            uint256 txStartGas = gasleft();
            
            Transaction calldata transaction = transactions[i];
            
            // Execute transaction
            (bool success, bytes memory returnData) = transaction.target.call{value: transaction.value}(transaction.data);
            
            uint256 txGasUsed = txStartGas - gasleft();
            
            results[i] = BatchResult({
                success: success,
                returnData: returnData,
                gasUsed: txGasUsed
            });
            
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }
            
            emit TransactionExecuted(
                msg.sender,
                batchId,
                i,
                transaction.target,
                success,
                txGasUsed
            );
        }
        
        totalGasUsed = startGas - gasleft();
        
        // Store batch statistics
        batchGasUsed[batchId] = totalGasUsed;
        batchSuccessCount[batchId] = successCount;
        batchFailureCount[batchId] = failureCount;
        
        // Transfer fee to collector
        if (msg.value > 0) {
            (bool feeSuccess, ) = feeCollector.call{value: msg.value}("");
            require(feeSuccess, "BatchExecutor: Fee transfer failed");
        }
        
        emit BatchExecuted(
            msg.sender,
            batchId,
            totalGasUsed,
            successCount,
            failureCount
        );
    }
    
    /**
     * @dev Estimate gas for a batch of transactions
     * @param transactions Array of transactions to estimate
     * @return estimatedGas Estimated gas usage
     */
    function estimateBatchGas(
        Transaction[] calldata transactions
    ) external view returns (uint256 estimatedGas) {
        require(transactions.length > 0, "BatchExecutor: Empty batch");
        require(transactions.length <= maxTransactionsPerBatch, "BatchExecutor: Too many transactions");
        
        uint256 baseGas = 21000; // Base transaction gas
        uint256 perTxGas = 5000; // Estimated gas per transaction overhead
        
        estimatedGas = baseGas + (transactions.length * perTxGas);
        
        // Add buffer for safety
        estimatedGas = (estimatedGas * GAS_BUFFER) / GAS_BUFFER_DENOMINATOR;
        
        return estimatedGas;
    }
    
    /**
     * @dev Get batch statistics
     * @param _batchId Batch ID to query
     * @return executor Address that executed the batch
     * @return gasUsed Total gas used
     * @return successCount Number of successful transactions
     * @return failureCount Number of failed transactions
     */
    function getBatchStats(
        uint256 _batchId
    ) external view returns (
        address executor,
        uint256 gasUsed,
        uint256 successCount,
        uint256 failureCount
    ) {
        return (
            batchExecutors[_batchId],
            batchGasUsed[_batchId],
            batchSuccessCount[_batchId],
            batchFailureCount[_batchId]
        );
    }
    
    // Admin functions
    
    /**
     * @dev Set maximum transactions per batch
     * @param _maxTransactions New maximum
     */
    function setMaxTransactionsPerBatch(uint256 _maxTransactions) external onlyOwner {
        require(_maxTransactions > 0, "BatchExecutor: Invalid max transactions");
        require(_maxTransactions <= 50, "BatchExecutor: Max too high");
        maxTransactionsPerBatch = _maxTransactions;
    }
    
    /**
     * @dev Set execution fee
     * @param _fee New fee amount
     */
    function setExecutionFee(uint256 _fee) external onlyOwner {
        executionFee = _fee;
    }
    
    /**
     * @dev Set fee collector address
     * @param _feeCollector New fee collector
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "BatchExecutor: Invalid fee collector");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdraw ETH
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "BatchExecutor: No balance to withdraw");
        
        (bool success, ) = owner().call{value: balance}("");
        require(success, "BatchExecutor: Withdrawal failed");
    }
    
    // View functions
    
    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Check if batch exists
     */
    function batchExists(uint256 _batchId) external view returns (bool) {
        return batchExecutors[_batchId] != address(0);
    }
    
    // Receive function
    receive() external payable {
        // Allow contract to receive ETH
    }
} 
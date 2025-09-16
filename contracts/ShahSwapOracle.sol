// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOracle.sol";
import "./libraries/OracleLibrary.sol";

/**
 * @title ShahSwapOracle
 * @dev TWAP Oracle implementation for ShahSwap
 * Provides manipulation-resistant price feeds for SHAH and other tokens
 * @author SHAH Wallet Team
 */
contract ShahSwapOracle is IOracle, Ownable, ReentrancyGuard {
    using OracleLibrary for OracleLibrary.CumulativePrice;

    // Events
    event OracleUpdated(address indexed pair, uint256 price0Cumulative, uint256 price1Cumulative, uint32 timestamp);
    event PairAdded(address indexed pair, address indexed token0, address indexed token1);
    event PairRemoved(address indexed pair);

    // State variables
    address public immutable override factory;
    address public immutable override WETH;
    
    // Mapping from pair address to cumulative price data
    mapping(address => OracleLibrary.CumulativePrice) public cumulativePrices;
    
    // Mapping from pair address to token addresses
    mapping(address => address[2]) public pairTokens;
    
    // Mapping to check if pair is supported
    mapping(address => bool) public supportedPairs;

    // Constants
    uint32 public constant DEFAULT_TWAP_PERIOD = 1800; // 30 minutes
    uint256 public constant MINIMUM_LIQUIDITY = 1000; // Minimum liquidity in USD

    /**
     * @dev Constructor
     * @param _factory ShahSwap factory address
     * @param _WETH WETH address
     */
    constructor(address _factory, address _WETH) Ownable(msg.sender) {
        require(_factory != address(0), "Oracle: INVALID_FACTORY");
        require(_WETH != address(0), "Oracle: INVALID_WETH");
        
        factory = _factory;
        WETH = _WETH;
    }

    /**
     * @dev Get TWAP price for a token pair
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param period TWAP period in seconds
     * @return amountOut Output amount
     * @return priceTWAP TWAP price in Q112.112 format
     */
    function consult(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint32 period
    ) external view override returns (uint256 amountOut, uint256 priceTWAP) {
        require(tokenIn != tokenOut, "Oracle: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "Oracle: INSUFFICIENT_INPUT_AMOUNT");
        require(OracleLibrary.isValidTWAPPeriod(period), "Oracle: INVALID_PERIOD");

        address pair = getPair(tokenIn, tokenOut);
        require(supportedPairs[pair], "Oracle: PAIR_NOT_SUPPORTED");

        OracleLibrary.CumulativePrice memory priceData = cumulativePrices[pair];
        require(priceData.initialized, "Oracle: PRICE_NOT_INITIALIZED");

        // Get current cumulative prices
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = 
            OracleLibrary.currentCumulativePrices(pair);

        // Calculate TWAP
        (uint256 price0TWAP, uint256 price1TWAP) = OracleLibrary.consult(
            price0Cumulative,
            price1Cumulative,
            blockTimestamp,
            priceData.price0CumulativeLast,
            priceData.price1CumulativeLast,
            priceData.blockTimestampLast,
            period
        );

        // Determine which price to use based on token order
        address[2] memory tokens = pairTokens[pair];
        if (tokenIn == tokens[0]) {
            priceTWAP = price0TWAP;
            amountOut = (amountIn * price0TWAP) / 2**112;
        } else {
            priceTWAP = price1TWAP;
            amountOut = (amountIn * price1TWAP) / 2**112;
        }
    }

    /**
     * @dev Get spot price for a token pair
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @return amountOut Output amount
     * @return priceSpot Spot price in Q112.112 format
     */
    function getSpotPrice(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view override returns (uint256 amountOut, uint256 priceSpot) {
        require(tokenIn != tokenOut, "Oracle: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "Oracle: INSUFFICIENT_INPUT_AMOUNT");

        address pair = getPair(tokenIn, tokenOut);
        require(supportedPairs[pair], "Oracle: PAIR_NOT_SUPPORTED");

        // Get current reserves
        (uint112 reserve0, uint112 reserve1,) = getReserves(pair);
        
        // Get token decimals
        // For simplicity, assume 18 decimals for all tokens
        uint8 decimals0 = 18;
        uint8 decimals1 = 18;

        // Calculate spot price
        (uint256 price0, uint256 price1) = OracleLibrary.getSpotPrice(
            reserve0,
            reserve1,
            decimals0,
            decimals1
        );

        // Determine which price to use
        address[2] memory tokens = pairTokens[pair];
        if (tokenIn == tokens[0]) {
            priceSpot = price0;
            amountOut = (amountIn * price0) / 2**112;
        } else {
            priceSpot = price1;
            amountOut = (amountIn * price1) / 2**112;
        }
    }

    /**
     * @dev Get price impact for a swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @return priceImpact Price impact in basis points
     */
    function getPriceImpact(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view override returns (uint256 priceImpact) {
        require(tokenIn != tokenOut, "Oracle: IDENTICAL_ADDRESSES");
        require(amountIn > 0, "Oracle: INSUFFICIENT_INPUT_AMOUNT");

        address pair = getPair(tokenIn, tokenOut);
        require(supportedPairs[pair], "Oracle: PAIR_NOT_SUPPORTED");

        // Get current reserves
        (uint112 reserve0, uint112 reserve1,) = getReserves(pair);
        
        // Determine which reserves to use
        address[2] memory tokens = pairTokens[pair];
        uint256 reserveIn;
        uint256 reserveOut;
        
        if (tokenIn == tokens[0]) {
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            reserveIn = reserve1;
            reserveOut = reserve0;
        }

        priceImpact = OracleLibrary.calculatePriceImpact(amountIn, reserveIn, reserveOut);
    }

    /**
     * @dev Update cumulative price data for a pair
     * @param pair Pair address
     */
    function update(address pair) external override {
        require(supportedPairs[pair], "Oracle: PAIR_NOT_SUPPORTED");
        
        // Get current cumulative prices
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = 
            OracleLibrary.currentCumulativePrices(pair);

        // Update stored data
        cumulativePrices[pair] = OracleLibrary.CumulativePrice({
            price0CumulativeLast: price0Cumulative,
            price1CumulativeLast: price1Cumulative,
            blockTimestampLast: blockTimestamp,
            initialized: true
        });

        emit OracleUpdated(pair, price0Cumulative, price1Cumulative, blockTimestamp);
    }

    /**
     * @dev Get cumulative price data for a pair
     * @param pair Pair address
     * @return price0CumulativeLast Last cumulative price for token0
     * @return price1CumulativeLast Last cumulative price for token1
     * @return blockTimestampLast Last block timestamp
     */
    function getCumulativePrices(address pair)
        external
        view
        override
        returns (
            uint256 price0CumulativeLast,
            uint256 price1CumulativeLast,
            uint32 blockTimestampLast
        )
    {
        OracleLibrary.CumulativePrice memory priceData = cumulativePrices[pair];
        price0CumulativeLast = priceData.price0CumulativeLast;
        price1CumulativeLast = priceData.price1CumulativeLast;
        blockTimestampLast = priceData.blockTimestampLast;
    }

    /**
     * @dev Check if a pair is supported by the oracle
     * @param pair Pair address
     * @return isSupported Whether the pair is supported
     */
    function isPairSupported(address pair) external view override returns (bool isSupported) {
        isSupported = supportedPairs[pair];
    }

    /**
     * @dev Add a new pair to the oracle (owner only)
     * @param pair Pair address
     * @param token0 First token address
     * @param token1 Second token address
     */
    function addPair(address pair, address token0, address token1) external onlyOwner {
        require(pair != address(0), "Oracle: INVALID_PAIR");
        require(token0 != address(0) && token1 != address(0), "Oracle: INVALID_TOKENS");
        require(!supportedPairs[pair], "Oracle: PAIR_ALREADY_SUPPORTED");

        // Verify pair exists in factory
        require(getPair(token0, token1) == pair, "Oracle: PAIR_NOT_IN_FACTORY");

        // Check minimum liquidity
        (uint112 reserve0, uint112 reserve1,) = getReserves(pair);
        require(reserve0 >= MINIMUM_LIQUIDITY && reserve1 >= MINIMUM_LIQUIDITY, "Oracle: INSUFFICIENT_LIQUIDITY");

        supportedPairs[pair] = true;
        pairTokens[pair] = [token0, token1];

        // Initialize cumulative prices
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = 
            OracleLibrary.currentCumulativePrices(pair);

        cumulativePrices[pair] = OracleLibrary.CumulativePrice({
            price0CumulativeLast: price0Cumulative,
            price1CumulativeLast: price1Cumulative,
            blockTimestampLast: blockTimestamp,
            initialized: true
        });

        emit PairAdded(pair, token0, token1);
        emit OracleUpdated(pair, price0Cumulative, price1Cumulative, blockTimestamp);
    }

    /**
     * @dev Remove a pair from the oracle (owner only)
     * @param pair Pair address
     */
    function removePair(address pair) external onlyOwner {
        require(supportedPairs[pair], "Oracle: PAIR_NOT_SUPPORTED");
        
        supportedPairs[pair] = false;
        delete pairTokens[pair];
        delete cumulativePrices[pair];

        emit PairRemoved(pair);
    }

    /**
     * @dev Get pair address from factory
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pair Pair address
     */
    function getPair(address tokenA, address tokenB) internal view returns (address pair) {
        (bool success, bytes memory data) = factory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenA, tokenB)
        );
        
        if (success && data.length >= 32) {
            pair = abi.decode(data, (address));
        }
    }

    /**
     * @dev Get reserves from pair
     * @param pair Pair address
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Last block timestamp
     */
    function getReserves(address pair) internal view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) {
        (bool success, bytes memory data) = pair.staticcall(
            abi.encodeWithSignature("getReserves()")
        );
        
        if (success && data.length >= 96) {
            (reserve0, reserve1, blockTimestampLast) = abi.decode(data, (uint112, uint112, uint32));
        }
    }

    /**
     * @dev Emergency function to recover tokens (owner only)
     * @param token Token address
     * @param amount Amount to recover
     */
    function emergencyRecover(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}

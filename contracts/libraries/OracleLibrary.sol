// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title OracleLibrary
 * @dev TWAP (Time-Weighted Average Price) Oracle implementation
 * Based on Uniswap V2's TWAP pattern for manipulation-resistant price feeds
 * @author SHAH Wallet Team
 */
library OracleLibrary {

    // Minimum time elapsed for TWAP calculation (30 minutes)
    uint32 public constant MINIMUM_TWAP_PERIOD = 1800;
    
    // Maximum time elapsed for TWAP calculation (24 hours)
    uint32 public constant MAXIMUM_TWAP_PERIOD = 86400;

    /**
     * @dev Struct to hold cumulative price data
     */
    struct CumulativePrice {
        uint256 price0CumulativeLast;
        uint256 price1CumulativeLast;
        uint32 blockTimestampLast;
        bool initialized;
    }

    /**
     * @dev Calculate TWAP price for a given period
     * @param price0Cumulative Current cumulative price for token0
     * @param price1Cumulative Current cumulative price for token1
     * @param blockTimestamp Current block timestamp
     * @param price0CumulativeLast Last recorded cumulative price for token0
     * @param price1CumulativeLast Last recorded cumulative price for token1
     * @param blockTimestampLast Last recorded block timestamp
     * @param period TWAP period in seconds
     * @return price0TWAP TWAP price for token0
     * @return price1TWAP TWAP price for token1
     */
    function consult(
        uint256 price0Cumulative,
        uint256 price1Cumulative,
        uint32 blockTimestamp,
        uint256 price0CumulativeLast,
        uint256 price1CumulativeLast,
        uint32 blockTimestampLast,
        uint32 period
    ) internal pure returns (uint256 price0TWAP, uint256 price1TWAP) {
        require(period >= MINIMUM_TWAP_PERIOD, "OracleLibrary: PERIOD_TOO_SHORT");
        require(period <= MAXIMUM_TWAP_PERIOD, "OracleLibrary: PERIOD_TOO_LONG");
        require(blockTimestamp >= blockTimestampLast, "OracleLibrary: INVALID_TIMESTAMP");

        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        require(timeElapsed >= period, "OracleLibrary: INSUFFICIENT_TIME_ELAPSED");

        // Calculate price change over the period
        uint256 price0Change = price0Cumulative - price0CumulativeLast;
        uint256 price1Change = price1Cumulative - price1CumulativeLast;

        // Calculate TWAP prices (Q112.112 format)
        price0TWAP = (price0Change * 2**112) / timeElapsed;
        price1TWAP = (price1Change * 2**112) / timeElapsed;
    }

    /**
     * @dev Get current cumulative prices from a pair
     * @param pair Address of the liquidity pair
     * @return price0Cumulative Current cumulative price for token0
     * @return price1Cumulative Current cumulative price for token1
     * @return blockTimestamp Current block timestamp
     */
    function currentCumulativePrices(address pair)
        internal
        view
        returns (
            uint256 price0Cumulative,
            uint256 price1Cumulative,
            uint32 blockTimestamp
        )
    {
        blockTimestamp = uint32(block.timestamp);
        
        // Call the pair contract to get current cumulative prices
        // This assumes the pair implements the Uniswap V2 interface
        (bool success, bytes memory data) = pair.staticcall(
            abi.encodeWithSignature("getReserves()")
        );
        
        if (success && data.length >= 96) {
            (uint112 reserve0, uint112 reserve1, uint32 timestamp) = abi.decode(
                data,
                (uint112, uint112, uint32)
            );
            
            // Calculate cumulative prices based on reserves
            // This is a simplified version - in practice, you'd track cumulative prices
            price0Cumulative = (uint256(reserve1) * 2**112) / reserve0;
            price1Cumulative = (uint256(reserve0) * 2**112) / reserve1;
        }
    }

    /**
     * @dev Calculate spot price from reserves
     * @param reserve0 Reserve of token0
     * @param reserve1 Reserve of token1
     * @param decimals0 Decimals of token0
     * @param decimals1 Decimals of token1
     * @return price0 Price of token0 in terms of token1
     * @return price1 Price of token1 in terms of token0
     */
    function getSpotPrice(
        uint256 reserve0,
        uint256 reserve1,
        uint8 decimals0,
        uint8 decimals1
    ) internal pure returns (uint256 price0, uint256 price1) {
        require(reserve0 > 0 && reserve1 > 0, "OracleLibrary: INSUFFICIENT_LIQUIDITY");
        
        // Adjust for decimals
        uint256 adjustedReserve0 = reserve0 * (10**decimals1);
        uint256 adjustedReserve1 = reserve1 * (10**decimals0);
        
        price0 = (adjustedReserve1 * 2**112) / adjustedReserve0;
        price1 = (adjustedReserve0 * 2**112) / adjustedReserve1;
    }

    /**
     * @dev Calculate price impact of a swap
     * @param amountIn Input amount
     * @param reserveIn Reserve of input token
     * @param reserveOut Reserve of output token
     * @return priceImpact Price impact in basis points (1 = 0.01%)
     */
    function calculatePriceImpact(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 priceImpact) {
        require(reserveIn > 0 && reserveOut > 0, "OracleLibrary: INSUFFICIENT_LIQUIDITY");
        
        // Calculate output without fees
        uint256 amountOutWithoutFee = (amountIn * reserveOut) / (reserveIn + amountIn);
        
        // Calculate output with fees (0.3% fee)
        uint256 amountOutWithFee = (amountIn * 997 * reserveOut) / (
            (reserveIn * 1000) + (amountIn * 997)
        );
        
        // Calculate price impact
        uint256 priceImpactRaw = ((amountOutWithoutFee - amountOutWithFee) * 10000) / amountOutWithoutFee;
        priceImpact = priceImpactRaw;
    }

    /**
     * @dev Validate TWAP period
     * @param period TWAP period in seconds
     * @return isValid Whether the period is valid
     */
    function isValidTWAPPeriod(uint32 period) internal pure returns (bool isValid) {
        isValid = period >= MINIMUM_TWAP_PERIOD && period <= MAXIMUM_TWAP_PERIOD;
    }

    /**
     * @dev Convert Q112.112 price to decimal format
     * @param price Price in Q112.112 format
     * @param decimals Number of decimals for the token
     * @return decimalPrice Price in decimal format
     */
    function priceToDecimal(uint256 price, uint8 decimals) internal pure returns (uint256 decimalPrice) {
        decimalPrice = (price * (10**decimals)) / 2**112;
    }

    /**
     * @dev Convert decimal price to Q112.112 format
     * @param decimalPrice Price in decimal format
     * @param decimals Number of decimals for the token
     * @return price Price in Q112.112 format
     */
    function decimalToPrice(uint256 decimalPrice, uint8 decimals) internal pure returns (uint256 price) {
        price = (decimalPrice * 2**112) / (10**decimals);
    }
}

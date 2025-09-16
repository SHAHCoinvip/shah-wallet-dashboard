// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IOracle
 * @dev Interface for TWAP Oracle price feeds
 * @author SHAH Wallet Team
 */
interface IOracle {
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
    ) external view returns (uint256 amountOut, uint256 priceTWAP);

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
    ) external view returns (uint256 amountOut, uint256 priceSpot);

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
    ) external view returns (uint256 priceImpact);

    /**
     * @dev Update cumulative price data for a pair
     * @param pair Pair address
     */
    function update(address pair) external;

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
        returns (
            uint256 price0CumulativeLast,
            uint256 price1CumulativeLast,
            uint32 blockTimestampLast
        );

    /**
     * @dev Check if a pair is supported by the oracle
     * @param pair Pair address
     * @return isSupported Whether the pair is supported
     */
    function isPairSupported(address pair) external view returns (bool isSupported);

    /**
     * @dev Get the factory address
     * @return factory Factory address
     */
    function factory() external view returns (address factory);

    /**
     * @dev Get the WETH address
     * @return weth WETH address
     */
    function WETH() external view returns (address weth);
}

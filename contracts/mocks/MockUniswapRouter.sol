// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockUniswapRouter {
    address public immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public factory;

    constructor() {
        factory = address(this);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Mock implementation - return the minimum amounts and some LP tokens
        amountA = amountAMin;
        amountB = amountBMin;
        liquidity = amountAMin + amountBMin; // Simple mock calculation
        
        // Transfer tokens from user
        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);
        
        // Mint mock LP tokens to user
        IERC20(address(this)).transfer(to, liquidity);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        amountToken = amountTokenMin;
        amountETH = amountETHMin;
        liquidity = amountTokenMin + amountETHMin;
        
        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), amountToken);
        
        // Mint mock LP tokens to user
        IERC20(address(this)).transfer(to, liquidity);
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        amountA = amountAMin;
        amountB = amountBMin;
        
        // Burn LP tokens
        IERC20(address(this)).transferFrom(msg.sender, address(this), liquidity);
        
        // Transfer tokens to user
        IERC20(tokenA).transfer(to, amountA);
        IERC20(tokenB).transfer(to, amountB);
    }

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH) {
        amountToken = amountTokenMin;
        amountETH = amountETHMin;
        
        // Burn LP tokens
        IERC20(address(this)).transferFrom(msg.sender, address(this), liquidity);
        
        // Transfer tokens to user
        IERC20(token).transfer(to, amountToken);
        (bool success, ) = to.call{value: amountETH}("");
        require(success, "ETH transfer failed");
    }
}


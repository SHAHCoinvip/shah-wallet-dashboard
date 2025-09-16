// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockShahSwapRouter {
    address public immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public factory;

    constructor() {
        factory = address(this);
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation - return the minimum amount
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;
        
        // Transfer tokens from user
        IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // Transfer output tokens to user
        IERC20(path[1]).transfer(to, amountOutMin);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountIn;
        amounts[1] = amountIn; // Mock: 1:1 ratio
    }

    function getAmountsIn(uint256 amountOut, address[] memory path) external pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = amountOut; // Mock: 1:1 ratio
        amounts[1] = amountOut;
    }
}


// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockShahSwapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        // Mock implementation - return a deterministic address
        pair = address(uint160(uint256(keccak256(abi.encodePacked(tokenA, tokenB, block.timestamp)))));
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
        allPairs.push(pair);
        return pair;
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}


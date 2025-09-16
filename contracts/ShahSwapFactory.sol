// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IShahSwapFactory.sol";
import "./ShahSwapPair.sol";

contract ShahSwapFactory is IShahSwapFactory, Ownable {
    bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(type(ShahSwapPair).creationCode);

    address public override feeTo;
    address public override feeToSetter;

    mapping(address => mapping(address => address)) public override getPair;
    address[] public override allPairs;

    constructor(address _feeToSetter) Ownable(_feeToSetter) {
        feeToSetter = _feeToSetter;
    }

    function allPairsLength() external view override returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external override returns (address pair) {
        require(tokenA != tokenB, 'ShahSwap: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'ShahSwap: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'ShahSwap: PAIR_EXISTS'); // single check is sufficient
        
        // Create the pair contract using CREATE2
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        pair = address(new ShahSwapPair{salt: salt}());
        
        // Initialize the pair
        ShahSwapPair(pair).initialize(token0, token1);
        
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external override {
        require(msg.sender == feeToSetter, 'ShahSwap: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external override {
        require(msg.sender == feeToSetter, 'ShahSwap: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }
}

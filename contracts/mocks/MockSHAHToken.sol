// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockSHAHToken is ERC20, Ownable {
    constructor(address _owner) ERC20("SHAH Token", "SHAH") Ownable(_owner) {
        _mint(_owner, 10000000 * 10**decimals()); // 10M SHAH
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}


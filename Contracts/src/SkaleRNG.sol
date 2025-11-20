// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "skale-rng/RNG.sol";

contract SkaleRNG is AccessControl, RNG {

    bytes32 public constant ADMIN = keccak256("ADMIN");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN, msg.sender);
    }

    function getRandomValue(uint256 nextIndex, uint256 max) public view onlyRole(ADMIN) returns (uint256) {
        return getNextRandomRange(nextIndex,max);
    }
}
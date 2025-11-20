// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {SkaleRNG} from "../src/SkaleRNG.sol";

contract SkaleRNGScript is Script {
    SkaleRNG public skalerng;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        skalerng = new SkaleRNG();

        vm.stopBroadcast();
    }
}

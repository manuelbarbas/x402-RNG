// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {SkaleWordRandom} from "../src/SkaleWordRandom.sol";

contract SkaleRNGScript is Script {
    SkaleWordRandom public skalewordrandom;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        skalewordrandom = new SkaleWordRandom();

        vm.stopBroadcast();
    }
}

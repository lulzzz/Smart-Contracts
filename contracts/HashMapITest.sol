/**
 * @description Hash Map Interface Test contract
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

pragma solidity ^0.4.18;

import "./HashMapI.sol";


/** @title Contract exists only for the purpose of testing the HashMapI contract */
contract HashMapITest is HashMapI {

	function addHash(bytes32 _hash) public {
		hashMap.add(_hash);
	}

	function archiveHash(bytes32 _hash) public {
		hashMap.archive(_hash);
	}
}
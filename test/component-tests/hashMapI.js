/**
 * @description Test script to verify the Hash Map Interface contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// ABI for the contract to test
var abiLib = artifacts.require("./Lib.sol");
var abiHashMapITest = artifacts.require("./HashMapITest.sol");

contract('HashMapI', function(accounts) {
    // Store the contract instance of hashMapITest
    var hashMapITest;

    // Function verifies an single hash in the mapping specified by the idx
    function verifySingleHash(hashMapStateArray, idx) {

        // Get the state of the hash at the specified index - check if hash is active
        return hashMapITest.isActive.call(web3.sha3(accounts[idx]))
        .then(function(hashResult) {
            if (hashMapStateArray[idx] == 0)
                assert.isFalse(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 1)
                assert.isTrue(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 2)
                assert.isFalse(hashResult, "State of hash "+idx+" is incorrect.");

        // Get the state of the hash at the specified index - check if hash is archived
        return hashMapITest.isArchived.call(web3.sha3(accounts[idx]));
        })
        .then(function(hashResult) {
            if (hashMapStateArray[idx] == 0)
                assert.isFalse(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 1)
                assert.isFalse(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 2)
                assert.isTrue(hashResult, "State of hash "+idx+" is incorrect.");

        // Get the state of the hash at the specified index - check if hash is valid
        return hashMapITest.isValid.call(web3.sha3(accounts[idx]));
        })
        .then(function(hashResult) {
            if (hashMapStateArray[idx] == 0)
                assert.isFalse(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 1)
                assert.isTrue(hashResult, "State of hash "+idx+" is incorrect.");
            else if (hashMapStateArray[idx] == 2)
                assert.isTrue(hashResult, "State of hash "+idx+" is incorrect.");

            // Verify the correct hash stored at a specified index is returned
            return hashMapITest.get.call(idx);
        })
        .then(function(hashAtIdx) {
            if ((hashMapStateArray[idx] == 1) || (hashMapStateArray[idx] == 2))
                assert.equal(web3.sha3(accounts[idx]), hashAtIdx, "Hash in position "+idx+" is incorrect.");

            // Return dummy value
            return 1;
        });
    }

    // Function to verify the mapping hashes stored and their status
    //    Variable hashMapStateArray is a list with 10 integers in one of the following states
    //        0 ... not part of the mapping
    //        1 ... active hash
    //        2 ... archived hash
    //   The index is the same for accounts, adrMapStateList and position in the hash mapping
    //       accounts[1] ... hashMapStateList[1] ... hashMap[1]
    function verifyHashMappingVariables(hashMapStateArray, firstIdx, nextIdx, count) {
        // Verify first, next and count are correct
        return hashMapITest.hashMap.call()
        .then(function(info) {
            // Validate first, next and count
            assert.equal(firstIdx, info[0].valueOf(), "First: Index of the first valid hash is incorrect");
            assert.equal(nextIdx, info[1].valueOf(), "Next: Index of the next free hash position is incorrect");
            assert.equal(count, info[2].valueOf(), "Count: Total number of valid hashes specified is incorrect");

                                    return verifySingleHash(hashMapStateArray, 1);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 2);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 3);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 4);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 5);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 6);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 7);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 8);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 9);
            }).then(function(info) {return verifySingleHash(hashMapStateArray, 10);
        });
        // Return a dummy value that needs to be awaited
        return 1;
    }

    it("should deploy library and HashMapI contract and verify initialisation variables", function() {
        // Deploy the library
        return abiLib.new()
        .then(function(instance) {
            // Link the library contract
            abiHashMapITest.link(abiLib, abiHashMapITest);
            // Deploy the hash map test contract
            return abiHashMapITest.new();

        }).then(function(instance) {
            hashMapITest = instance;
            // Verify the hash map is correctly initialised
            return verifyHashMappingVariables([0,0,0,0,0,0,0,0,0,0,0], 1, 1, 0); });
    });

    it("should add hash 1", function() {
        return hashMapITest.addHash(web3.sha3(accounts[1])).then(function(tx) {
        return verifyHashMappingVariables([0,1,0,0,0,0,0,0,0,0,0], 1, 2, 1); });
    });

    it("should add hash 2", function() {
        return hashMapITest.addHash(web3.sha3(accounts[2])).then(function(tx) {
        return verifyHashMappingVariables([0,1,1,0,0,0,0,0,0,0,0], 1, 3, 2); });
    });

    it("should add hash 3", function() {
        return hashMapITest.addHash(web3.sha3(accounts[3])).then(function(tx) {
        return verifyHashMappingVariables([0,1,1,1,0,0,0,0,0,0,0], 1, 4, 3); });
    });

    it("should archive hash 2", function() {
        return hashMapITest.archiveHash(web3.sha3(accounts[2])).then(function(tx) {
        return verifyHashMappingVariables([0,1,2,1,0,0,0,0,0,0,0], 1, 4, 2); });
    });

    it("should archive hash 1", function() {
        return hashMapITest.archiveHash(web3.sha3(accounts[1])).then(function(tx) {
        return verifyHashMappingVariables([0,2,2,1,0,0,0,0,0,0,0], 3, 4, 1); });
    });
    
    it("should archive hash 3", function() {
        return hashMapITest.archiveHash(web3.sha3(accounts[3])).then(function(tx) {
        return verifyHashMappingVariables([0,2,2,2,0,0,0,0,0,0,0], 4, 4, 0); });
    });
});
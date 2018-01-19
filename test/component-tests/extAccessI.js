/**
 * @description Test script to verify the External Access Interface contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// ABI for the External Access Interface contract to test
var abiExtAccI = artifacts.require("./ExtAccessI.sol");

// Duration Pre-Authorisation remains active
var preAuthDurationSeconds = 300;

contract('ExtAccessI', function(accounts) {

    // variable to store the external access interface instance in
    var extAccI;

    // Function to verify all the variables within the External Access Interface contract
    function verifyExtAccIntVariables(key0, key1, key2, key3, key4, preAuthKey, preAuthExpirySet) {
        // Verify keys 0, 1, 2, 3 and 4
        return extAccI.getExtAccessKey.call()
        .then(function(keys) {
            assert.equal(key0, keys[0], "Key 0 specified is incorrect.");
            assert.equal(key1, keys[1], "Key 1 specified is incorrect.");
            assert.equal(key2, keys[2], "Key 2 specified is incorrect.");
            assert.equal(key3, keys[3], "Key 3 specified is incorrect.");
            assert.equal(key4, keys[4], "Key 4 specified is incorrect.");
            
            // Verify pre authorised key used
            return extAccI.getPreAuthKey.call();
        })
        .then(function(key) {
            assert.equal(preAuthKey, key, "Pre authorised key specified is incorrect.");
            
            // Verify pre authorisation expiry date time
            return extAccI.getPreAuthExpiry.call();
        })
        .then(function(expiry) {
            if (preAuthExpirySet == false)
                assert.equal(0, expiry, "The expiry date time specified is invalid");
            else {
                assert.isTrue(expiry.valueOf() != 0, "The expiry date time specified is invalid");
            }
        });
        // Return a dummy value that needs to be awaited
        return 1;
    }

    it("should deploy a new ExtAccessI contract and verify initialisation variables", function() {
        // Deploy a new contract of ExtAccessI and specify account[0] as the initial key to be added
        return abiExtAccI.new(accounts[0])
        .then(function(instance) {
            // Store contract instance in variable
            extAccI = instance;
            // Verify init variables
            return verifyExtAccIntVariables(accounts[0], 0x0, 0x0, 0x0, 0x0, 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should add key 1 with transaction submitted by key 0", function() {
        // Add a new key
        return extAccI.addKey(accounts[1], {from: accounts[0]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], 0x0, 0x0, 0x0, 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should add key 2 with transaction submitted by key 1", function() {
        // Add a new key
        return extAccI.addKey(accounts[2], {from: accounts[1]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], 0x0, 0x0, 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should perform pre-authorisation with key 1, add key 3 with transaction submitted by key 2", function() {
        // Perform pre-authorisation
        return extAccI.preAuth({from: accounts[1]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], 0x0, 0x0, accounts[1], true);
        })
        .then(function(val) {  
            // Add the new key
            return extAccI.addKey(accounts[3], {from: accounts[2]});
        })
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], accounts[3], 0x0, 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should do pre-auth with key 1, then pre-auth with key 2, add key 4 with transaction submitted by key 1", function() {
        // Perform pre-authorisation with key 1
        return extAccI.preAuth({from: accounts[1]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], accounts[3], 0x0, accounts[1], true);
        })
        .then(function(val) {
            // Perform another pre-authorisation with a different key (should be possible)
            return extAccI.preAuth({from: accounts[2]});
        })
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], accounts[3], 0x0, accounts[2], true);
        })
        .then(function(val) {
            // Add the new key
            return extAccI.addKey(accounts[4], {from: accounts[1]});
        })
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], accounts[3], accounts[4], 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should do pre-auth with key 3 and a key rotation transaction submitted by key 4", function() {
        // Perform pre-authorisation with key 3
        return extAccI.preAuth({from: accounts[3]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[0], accounts[1], accounts[2], accounts[3], accounts[4], accounts[3], true);
        })
        .then(function(val) {
            // Rotate the keys
            return extAccI.rotateKey({from: accounts[4]});
        })
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[1], accounts[2], accounts[3], accounts[4], 0x0, 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should do pre-auth with key in key slot 1 and add key 5 transaction submitted by key slot 3", function() {
        // Perform pre-authorisation with key slot 2
        return extAccI.preAuth({from: accounts[2]})
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[1], accounts[2], accounts[3], accounts[4], 0x0, accounts[2], true);
        })
        .then(function(val) {
            // Add the new key
            return extAccI.addKey(accounts[5], {from: accounts[3]});
        })
        .then(function(tx) {
            return verifyExtAccIntVariables(accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], 0x0, false);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });
});
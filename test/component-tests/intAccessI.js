/**
 * @description Test script to verify the Internal Access Interface contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// ABI for the Internal Access Interface contract to test
var abiIntAccI = artifacts.require("./IntAccessI.sol");

contract('IntAccessI', function(accounts) {

    // variable to store the external access interface instance in
    var intAccI;

        // Function to verify all the variables within the External Access Interface contract
    function verifyIntAccIntVariables(poolAdr, bondAdr, bankAdr, policyAdr, 
                                      claimAdr, adjustorAdr, timerAdr, trustAdr) {
        return intAccI.getContractAdr.call()
        .then(function(keys) {
            assert.equal(poolAdr, keys[0], "Pool address specified is incorrect.");
            assert.equal(bondAdr, keys[1], "Bond address specified is incorrect.");
            assert.equal(bankAdr, keys[2], "Bank address specified is incorrect.");
            assert.equal(policyAdr, keys[3], "Policy address specified is incorrect.");
            assert.equal(claimAdr, keys[4], "Claim address specified is incorrect.");
            assert.equal(adjustorAdr, keys[5], "Adjustor address specified is incorrect.");
            assert.equal(timerAdr, keys[6], "Timer address specified is incorrect.");
            assert.equal(trustAdr, keys[7], "Trust address specified is incorrect.");
        });
        // Return a dummy value that needs to be awaited
        return 1;
    }

    it("should deploy a new IntAccessI contract and verify initialization variables", function() {
        // Deploy a new contract of IntAccessI and specify account[0] as the initial key to be added as the Deployment Controller address
        return abiIntAccI.new(accounts[0])
        .then(function(instance) {
            // Store contract instance in variable
            intAccI = instance;
            // Verify init variables
            return verifyIntAccIntVariables(accounts[0], 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });

    it("should set and verify the remaining IntAccessI contract addresses", function() {
        // Set the remaining keys
        return intAccI.setContractAdr(accounts[1], accounts[2], accounts[3], 
            accounts[4], accounts[5], accounts[6], accounts[7], accounts[8], {from: accounts[0]})
        .then(function(tx) {
            // Verify all the keys
            return verifyIntAccIntVariables(accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[6], accounts[7], accounts[8]);
        })
        .then(function(val) {
            // Awaiting the dummy val return value before continuing with the next test set
        });
    });
});
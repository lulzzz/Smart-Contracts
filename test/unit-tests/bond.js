/**
 * @description Unit tests for verifying Bond contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Bond is SetupI, IntAccessI, NotificationI, HashMapI
// event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
// ----------------

// createBond(uint _principal_Cu, bytes32 _hashOfReferenceBond)
exports.createBond = function(_bondPrincipal, _hashOfReferenceBond, _bondOwnerAccountIdx) {
    var bondHash;
    var finalBondYield = 0;
    var finalBondState = 0;
    var finalBondSecurityReferenceHash = null;
    var bondHashMapInfo;
    // Retrieve the hash map info from the bond firstIdx, nextIdx, count
    return td.bond.hashMap.call()
    .then(function(info) { 
        // Store the hash map info for now
        bondHashMapInfo = info;
        // Create a new Bond
        return td.bond.createBond(_bondPrincipal, _hashOfReferenceBond, {from: td.accounts[_bondOwnerAccountIdx]});
    })
    .then(function(tx) {
        // Get the bond hash
        bondHash = miscFunc.eventLog('Bond', tx, 0, 0);

        // Save the bond hash
        td.bHash[bondHashMapInfo[1].valueOf()] = bondHash;

        // Event is triggered as part of the bond creation log[0]: Bond event
        // event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
        // idx                           0                         1                      2          3               4
        // Event 0 - Bond creation
        assert.equal(td.accounts[_bondOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Bond', tx, 0, 1)), "Bond owner is incorrect");
        assert.equal(_bondPrincipal, parseInt(miscFunc.eventLog('Bond', tx, 0, 2)), "Bond principal is incorrect");
        assert.equal(0, parseInt(miscFunc.eventLog('Bond', tx, 0, 4)), "Bond is in incorrect state");

        // If bond has also been secured by another bond and signed check the log files
        if (_hashOfReferenceBond != 0x0) {
            // Calculate the final bond yield and update pool variables
            // Calcuate the expected yield average
            var yieldAvg = Math.floor((td.b_gradient_ppq * _bondPrincipal) / (2 * (Math.pow(10, 6))));
            // Calculate the final and expected bond yield
            finalBondYield = Math.max(setupI.MIN_YIELD_PPB, +td.b_yield_ppb - +yieldAvg);
            // Calculate the final and expected pool yield
            td.b_yield_ppb = Math.max(setupI.MIN_YIELD_PPB, +td.b_yield_ppb - (2 * +yieldAvg));

            // Adjust wc_bond_cu
            td.wc_bond_cu = +td.wc_bond_cu - +_bondPrincipal;
            // Adjust wc_transit_cu
            td.wc_transit_cu = +td.wc_transit_cu + +_bondPrincipal;
            // Set the final bond state to 3
            finalBondState = 3;
            // Set the bond security reference hash
            finalBondSecurityReferenceHash = _hashOfReferenceBond;

            // Check the bond event details
            // event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
            // idx                           0                         1                      2          3               4
            // Event 1 - Bond that is performing the securing service
            assert.equal(_hashOfReferenceBond, miscFunc.eventLog('Bond', tx, 1, 0), "Securing bond hash is invalid.");
            assert.equal(td.accounts[_bondOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Bond', tx, 1, 1)), "Securing bond owner is incorrect");
            assert.equal(bondHash, miscFunc.eventLog('Bond', tx, 1, 2), "Securing bond referencing the secured bond is incorrect");
            assert.equal(5, parseInt(miscFunc.eventLog('Bond', tx, 1, 4)), "Securing bond is in incorrect state");

            // Event 2 - Bond that is secured
            assert.equal(bondHash, miscFunc.eventLog('Bond', tx, 2, 0), "Secured bond hash is invalid.");
            assert.equal(_hashOfReferenceBond, miscFunc.eventLog('Bond', tx, 2, 2), "Secured bond referencing the underwriting bond is incorrect");
            assert.equal(2, parseInt(miscFunc.eventLog('Bond', tx, 2, 4)), "Secured bond is in incorrect state");

            // Event 3 - Bond signing
            assert.equal(bondHash, miscFunc.eventLog('Bond', tx, 3, 0), "Bond hash is invalid.");
            assert.equal(finalBondYield, parseInt(miscFunc.eventLog('Bond', tx, 3, 2)), "Bond yield is incorrect");
            assert.equal(3, parseInt(miscFunc.eventLog('Bond', tx, 3, 4)), "Bond is in incorrect state");
        }
        
        // Get the bond details
        return td.bond.dataStorage.call(bondHash);
    })
    .then(function (bData) {
        // Call the function to verify all bond data
        return miscFunc.verifyBondData(bData, bondHashMapInfo[1].valueOf(), td.accounts[_bondOwnerAccountIdx], 
            null, _bondPrincipal, finalBondYield, null, null, null, null, finalBondState, finalBondSecurityReferenceHash);
    })
    .then(function () {
        // Verify the bond has been added to the hash map
        // Retrieve the hash map info from the bondfirstIdx, nextIdx, uint count
        return td.bond.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map nextIdx, count values increased by 1
        assert.equal(info[1].valueOf(), +bondHashMapInfo[1].valueOf() + 1, "Bond hash map nextIdx is incorrect");
        assert.equal(info[2].valueOf(), +bondHashMapInfo[2].valueOf() + 1, "Bond hash map count is incorrect");

        // Check the details of the bond that has been provided as a security if applicable
        if (_hashOfReferenceBond != 0x0)
            return td.bond.dataStorage.call(_hashOfReferenceBond);
        else return null;

    })
    .then(function (bDataSecurityBond) {
        if (bDataSecurityBond != null) {
            // Call the function to verify all bond data
            return miscFunc.verifyBondData(bDataSecurityBond, null, td.accounts[_bondOwnerAccountIdx], 
                null, null, null, null, null, null, null, 5, bondHash);
        }
        else return null;
    })
    .then(function () {
        // Verify the new pool yield
        return td.pool.B_Yield_Ppb.call();
    })
    .then(function(yieldInPool) {
        assert.equal(td.b_yield_ppb, yieldInPool.valueOf(), "The value for pool yield is incorrect");
        // Verify new value for wc bond
        return td.pool.WC_Bond_Cu.call();
    })
    .then(function(wc_bond) {
        assert.equal(td.wc_bond_cu, wc_bond.valueOf(), "The value for wc bond is incorrect");
        // Verify new value for wc transit
        return td.pool.WC_Transit_Cu.call();
    })
    .then(function(wc_transit) {
        assert.equal(td.wc_transit_cu, wc_transit.valueOf(), "The value for wc transit is incorrect");
    });
}

// processMaturedBond(bytes32 _bondHash, uint _scheduledDateTime)
exports.processMaturedBond = function(_bondHash) {
    var nextBankPaymentAdvice;
    var initialBondData;
    var bondHashMapInfo;

    var bondPayoutAmount;
    var bondInitialState;
    var bondFinalState;

    // Get the payment advice details
    return td.bank.countPaymentAdviceEntries.call()
    .then(function(count) {
        nextBankPaymentAdvice = count.valueOf();
        // Retrieve the hash map info from the bond firstIdx, nextIdx, count
        return td.bond.hashMap.call();
    })
    .then(function(info) { 
        // Store the hash map info for now
        bondHashMapInfo = info;
        
        // Get the bond details
        return td.bond.dataStorage.call(_bondHash);
    })
    .then(function (bData) {
        // Save the initial bond data info
        initialBondData = bData;

        // Get the bond payout amount from bond data
        bondPayoutAmount = bData[5].valueOf();
        bondInitialState = bData[9].valueOf();

        // Get the final bond state
        if (bondInitialState == 4)
            bondFinalState = 7;                 // Matured
        else bondFinalState = 6;                // Defaulted

        // If bond is in signed state reduce wc_transit_cu by the expeced amount
        if (bondInitialState == 3) {
            //Transit -= Bond Principal - Bond Deposited amount;
            td.wc_transit_cu -= +bData[3].valueOf();
        }

        // Get the details of the bond that was underwritten with this bond
        if (bondInitialState == 5)
            return td.bond.dataStorage.call(initialBondData[10]);
        else return null;
    })
    .then(function(securityReferenceBond) {
        // If bond was in a Locked Reference Bond state adjust the bond payout amount
        if (securityReferenceBond != null)
            bondPayoutAmount -= ((+securityReferenceBond[3].valueOf() * +setupI.BOND_REQUIRED_SECURITY_REFERENCE_PPT) / Math.pow(10, 3));

        // Adjust wc_bal_ba_cu
        td.wc_bal_ba_cu -= +bondPayoutAmount;
        
        // Process matured bond
        return td.timer.manualPing(td.bond.address, 0, _bondHash, td.futureEpochTimeStamp, {from: td.accounts[0]});
    })
    .then(function(tx) {
        // Check the bond event details
        // event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
        // idx                           0                         1                      2          3               4
        assert.equal(_bondHash, miscFunc.eventLog('Bond', tx, 0, 0), "Bond hash is invalid.");
        assert.equal(initialBondData[1].valueOf(), miscFunc.getAdrFromBytes32(miscFunc.eventLog('Bond', tx, 0, 1)), "Bond owner is incorrect");
        assert.equal(bondPayoutAmount, parseInt(miscFunc.eventLog('Bond', tx, 0, 2)), "Bond final payout amount is incorrect");
        assert.equal(bondFinalState, parseInt(miscFunc.eventLog('Bond', tx, 0, 4)), "Bond is in incorrect state");
        
        // If the payout amount is greater than 0 ensure a payment advice entry has been created
        if (bondPayoutAmount > 0) {
            // Verify if the newly created bank payment advice entry details are correct
            return td.bank.bankPaymentAdvice.call(nextBankPaymentAdvice);
        }
        else {
            // If payout amount is 0 ensure no new payment advice entry has been created
            return td.bank.countPaymentAdviceEntries.call();
        }
    })
    .then(function(details) {
        if (bondPayoutAmount > 0) {
            assert.equal(2, details[0].valueOf(), "Bond payment advice type incorrect");
            assert.equal(web3.sha3(_bondHash), details[1].valueOf(), "Bond payment account hash recipient incorrect");
            assert.equal(_bondHash, details[2].valueOf(), "Bond payment reference incorrect");
            assert.equal(bondPayoutAmount, details[3].valueOf(), "Bond payout amount is incorrect");
        }
        else {
            // No additinal (new) entry should have been created
            assert.equal(nextBankPaymentAdvice, details.valueOf(), "No additional payment advice entry should have been created");
        }

        // Check wc_bal_ba_cu balance in the pool
        return td.pool.WC_Bal_BA_Cu.call();
    })
    .then(function(bal) {
        assert.equal(td.wc_bal_ba_cu, bal.valueOf(), "Balance for WC_Bal_BA_Cu is incorrect");
        // Check wc_transit_cu balance in the pool
        return td.pool.WC_Transit_Cu.call();
    })
    .then(function(bal) {
        assert.equal(td.wc_transit_cu, bal.valueOf(), "Balance for WC_Transit_Cu is incorrect");
        
        // Retrieve the hash map info from the bondfirstIdx, nextIdx, uint count
        return td.bond.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map count value decreased by 1 (as it is now archived)
        assert.equal(info[2].valueOf(), +bondHashMapInfo[2].valueOf() - 1, "Bond hash map count is incorrect");

        // Get the new bond data
        return td.bond.dataStorage.call(_bondHash);
    })
    .then(function (bData) {
        // Verify the bond data
        return miscFunc.verifyBondData(bData, null, null, null, null, null, bondPayoutAmount, null, null, null, bondFinalState, null);
    });
}
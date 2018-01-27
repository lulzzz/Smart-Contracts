/**
 * @description Unit tests for verifying Settlement contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Settlement is SetupI, IntAccessI {
// event LogSettlement(bytes32 indexed settlementHash, bytes32 indexed adjustorHash, bytes32 indexed info, uint timestamp, uint state);
// ----------------

// createSettlement(bytes32 _adjustorHash, bytes32 _policyHash, bytes32 _documentHash)
exports.createSettlement = function(_adjustorIdx, _policyHash, _documentHash) {
    var settlementHash;
    var settlementHashMapInfo;
    // Retrieve the hash map info from the adjustor firstIdx, nextIdx, count
    return td.settlement.hashMap.call()
    .then(function(info) {
        // Store the hash map info for now
        settlementHashMapInfo = info;

        // Create a new Settlement via the Settlement contract signing with the Adjustor's private key
        return td.settlement.createSettlement(td.aHash[_adjustorIdx], _policyHash, _documentHash, {from: td.accounts[_adjustorIdx]});
    })
    .then(function(tx) {
        // Get the settlement hash
        settlementHash = miscFunc.eventLog('Settlement', tx, 0, 0);
        // Event(s) is/are triggered as part of the settlement creation log[0]: Settlement event
        // event LogSettlement(bytes32 indexed settlementHash, bytes32 indexed adjustorHash, bytes32 indexed info, uint timestamp, uint state);
        // idx                                 0                               1                             2          3               4
        // Event 0 - Settlement creation
        assert.equal(td.aHash[_adjustorIdx], miscFunc.eventLog('Settlement', tx, 0, 1), "Adjustor hash is incorrect");
        assert.equal(_policyHash, miscFunc.eventLog('Settlement', tx, 0, 2), "Policy hash is incorrect");
        assert.equal(0, parseInt(miscFunc.eventLog('Settlement', tx, 0, 4)), "Settlement state is incorrect");
        
        if (_documentHash != miscFunc.getEmptyHash()) {
            // Event 1 - Settlement document added event
            assert.equal(td.aHash[_adjustorIdx], miscFunc.eventLog('Settlement', tx, 1, 1), "Adjustor hash is incorrect");
            assert.equal(_documentHash, miscFunc.eventLog('Settlement', tx, 1, 2), "Document hash is incorrect");
            assert.equal(1, parseInt(miscFunc.eventLog('Settlement', tx, 1, 4)), "Settlement state is incorrect");
        }
        // Get the settlement details
        return td.settlement.dataStorage.call(settlementHash);
    })
    .then(function (sData) {
        // Call the function to verify all Settlement data
        return miscFunc.verifySettlementData(sData, settlementHashMapInfo[1].valueOf(), 0, (_documentHash == miscFunc.getEmptyHash() ? 0 : 1));
    })
    .then(function () {
        // Verify the settlement has been added to the hash map
        // Retrieve the hash map info from the settlement firstIdx, nextIdx, uint count
        return td.settlement.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map nextIdx, count values increased by 1
        assert.equal(info[1].valueOf(), +settlementHashMapInfo[1].valueOf() + 1, "Settlement hash map nextIdx is incorrect");
        assert.equal(info[2].valueOf(), +settlementHashMapInfo[2].valueOf() + 1, "Settlement hash map count is incorrect");

        // Save the settlement hash
        td.sHash[settlementHashMapInfo[1].valueOf()] = settlementHash;
    });
}

// addSettlementInfo(bytes32 _settlementHash, bytes32 _adjustorHash, bytes32 _documentHash) 
exports.addSettlementInfo = function(_settlementIdx, _adjustorIdx, _documentHash) {
    // Add document hash to the specified settlement
    return td.settlement.addSettlementInfo(td.sHash[_settlementIdx], td.aHash[_adjustorIdx], _documentHash, {from: td.accounts[_adjustorIdx]})
    .then(function(tx) {
        // Event is triggered as part of the settlement update log[0]: Settlement event
        // event LogSettlement(bytes32 indexed settlementHash, bytes32 indexed adjustorHash, bytes32 indexed info, uint timestamp, uint state);
        // idx                                 0                               1                             2          3               4
        // Event 0 - Settlement document added event
        assert.equal(td.sHash[_settlementIdx], miscFunc.eventLog('Settlement', tx, 0, 0), "Settlement hash is incorrect");
        assert.equal(td.aHash[_adjustorIdx], miscFunc.eventLog('Settlement', tx, 0, 1), "Adjustor hash is incorrect");
        assert.equal(_documentHash, miscFunc.eventLog('Settlement', tx, 0, 2), "Document hash is incorrect");
        assert.equal(1, parseInt(miscFunc.eventLog('Settlement', tx, 0, 4)), "Settlement state is incorrect");
    });
}

// setExpectedSettlementAmount(bytes32 _settlementHash, bytes32 _adjustorHash, uint _expectedSettlementAmount) 
exports.setExpectedSettlementAmount = function(_settlementIdx, _adjustorIdx, _amount_cu) {
    var settlementData;
    var wc_locked_before;
    // Get the settlement details
    return td.settlement.dataStorage.call(td.sHash[_settlementIdx])
    .then(function (sData) {
        settlementData = sData;
        return td.pool.WC_Locked_Cu.call();
    })
    .then(function (amount) {
        wc_locked_before = amount;
        // Set the expected settlement amount for the settlement
        return td.settlement.setExpectedSettlementAmount(td.sHash[_settlementIdx], td.aHash[_adjustorIdx], _amount_cu, {from: td.accounts[_adjustorIdx]});
    })
    .then(function(tx) {
        return td.settlement.dataStorage.call(td.sHash[_settlementIdx]);
    })
    .then(function (sData) {
        return miscFunc.verifySettlementData(sData, _settlementIdx, _amount_cu, null);
    })
    .then(function () {
        return td.pool.WC_Locked_Cu.call();
    })
    .then(function (amount) {
        // Calculate the new value for Wc_Locked_Cu in the pool (could have increased or decreased)
        var wcLockedAmount_New = +wc_locked_before + (+_amount_cu - +settlementData[1].valueOf());
        assert(wcLockedAmount_New, amount, "New value for Wc Locked Fc in the pool is invalid");
    });
}

// closeSettlement(bytes32 _settlementHash, bytes32 _adjustorHash, bytes32 _documentHash, uint _settlementAmount) 
exports.closeSettlement = function(_settlementIdx, _adjustorIdx, _documentHash, _amount_cu) {
    var settlementData;
    var wc_locked_before;
    var nextBankPaymentAdvice;
    var settlementHashMapInfo;

    // Get the payment advice details
    return td.bank.countPaymentAdviceEntries.call()
    .then(function(count) {
        nextBankPaymentAdvice = count.valueOf();
        // Retrieve the hash map info from the settlement firstIdx, nextIdx, count
        return td.settlement.hashMap.call();
    })
    .then(function(info) { 
        // Store the hash map info for now
        settlementHashMapInfo = info;

        // Get the settlement details
        return td.settlement.dataStorage.call(td.sHash[_settlementIdx])
    })
    .then(function (sData) {
        settlementData = sData;
        return td.pool.WC_Locked_Cu.call();
    })
    .then(function (amount) {
        wc_locked_before = amount;
        // Close the settlement
        return td.settlement.closeSettlement(td.sHash[_settlementIdx], td.aHash[_adjustorIdx], _documentHash, _amount_cu, {from: td.accounts[_adjustorIdx]});
    })
    .then(function(tx) {
        // Event is triggered as part of the settlement closure log[0]: Settlement event
        // event LogSettlement(bytes32 indexed settlementHash, bytes32 indexed adjustorHash, bytes32 indexed info, uint timestamp, uint state);
        // idx                                 0                               1                             2          3               4
        // Event 0 - Settlement closed
        assert.equal(td.sHash[_settlementIdx], miscFunc.eventLog('Settlement', tx, 0, 0), "Settlement hash is incorrect");
        assert.equal(td.aHash[_adjustorIdx], miscFunc.eventLog('Settlement', tx, 0, 1), "Adjustor hash is incorrect");
        assert.equal(_documentHash, miscFunc.eventLog('Settlement', tx, 0, 2), "Document hash is incorrect");
        assert.equal(2, parseInt(miscFunc.eventLog('Settlement', tx, 0, 4)), "Settlement state is incorrect");

        return td.settlement.dataStorage.call(td.sHash[_settlementIdx]);
    })
    .then(function (sData) {
        // console.log('Settlement ' + _settlementIdx +':  ' + sData[1].valueOf());
        return miscFunc.verifySettlementData(sData, _settlementIdx, _amount_cu, 2);
    })
    .then(function () {
        return td.pool.WC_Locked_Cu.call();
    })
    .then(function (amount) {
        // Calculate the new value for Wc_Locked_Cu in the pool (could have increased or decreased)
        var wcLockedAmount_New = +wc_locked_before - +settlementData[1].valueOf();
        // console.log(wcLockedAmount_New);
        assert.equal(wcLockedAmount_New, amount, "New value for Wc Locked Fc in the pool is invalid");
        // console.log('Pool Total:    ' + amount.valueOf());

        // Verify the settlement has been archived count is reduced by 1
        return td.settlement.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map count value decreased by 1 (as it is now archived)
        assert.equal(info[2].valueOf(), +settlementHashMapInfo[2].valueOf() - 1, "Settlement hash map count is incorrect");

        // Verify if a new bank payment advice has been created
        // If the payout amount is greater than 0 ensure a payment advice entry has been created
        if (_amount_cu > 0) {
            // Verify if the newly created bank payment advice entry details are correct
            return td.bank.bankPaymentAdvice.call(nextBankPaymentAdvice);
        }
        else {
            // If payout amount is 0 ensure no new payment advice entry has been created
            return td.bank.countPaymentAdviceEntries.call();
        }
    })
    .then(function(details) {
        if (_amount_cu > 0) {
            assert.equal(5, details[0].valueOf(), "Settlement payment advice type incorrect");
            assert.equal(setupI.SETTLEMENT_ACCOUNT_PAYMENT_HASH, details[1].valueOf(), "Settlement payment account hash recipient incorrect");
            assert.equal(td.sHash[_settlementIdx], details[2].valueOf(), "Settlement payment reference incorrect");
            assert.equal(_amount_cu, details[3].valueOf(), "Payout amount is incorrect");
        }
        else {
            // No additinal (new) entry should have been created
            assert.equal(nextBankPaymentAdvice, details.valueOf(), "No additional payment advice entry should have been created");
        }
        return 0;
    });
}
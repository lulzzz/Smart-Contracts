/**
 * @description Unit tests for verifying Adjustor contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Adjustor is SetupI, IntAccessI
// event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
// ----------------

// createAdjustor(address _adjustorAdr, uint _settlementApprovalAmount_Fc, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
exports.createAdjustor = function(_adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement) {
    var adjustorHash;
    var adjustorHashMapInfo;
    // Retrieve the hash map info from the adjustor firstIdx, nextIdx, count
    return td.adjustor.hashMap.call()
    .then(function(info) {
        // Store the hash map info for now
        adjustorHashMapInfo = info;
        // Create a new Adjustor via the trust contract signing with the Trust's authorisation keys
        return td.trust.createAdjustor(_adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement, {from: td.accounts[0]});
    })
    .then(function(tx) {
        // Get the adjustor hash
        adjustorHash = miscFunc.eventLog('Adjustor', tx, 0, 0);
        // Event is triggered as part of the adjustor creation log[0]: Adjustor event
        // event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
        // idx                               0                             1                      2          3
        // Event 0 - Adjustor creation
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 0, 1)), "Adjustor address is incorrect");
        assert.equal(_settlementApprovalAmount_Fc, parseInt(miscFunc.eventLog('Adjustor', tx, 0, 2)), "Adjustor settlement approval amount is incorrect");
        
        // Event 1 - Adjustor creation
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 1, 1)), "Adjustor address is incorrect");
        assert.equal(_policyRiskPointLimit, parseInt(miscFunc.eventLog('Adjustor', tx, 1, 2)), "Adjustor policy risk point limit is incorrect");
        
        // Event 2 - Adjustor creation
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 2, 1)), "Adjustor address is incorrect");
        assert.equal(_serviceAgreement, miscFunc.eventLog('Adjustor', tx, 2, 2), "Adjustor service agreement is incorrect");
        
        // Get the adjustor details
        return td.adjustor.dataStorage.call(adjustorHash);
    })
    .then(function (aData) {
        // Call the function to verify all bond data
        return miscFunc.verifyAdjustorData(aData, adjustorHashMapInfo[1].valueOf(), _adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement);
    })
    .then(function () {
        // Verify the adjustor has been added to the hash map
        // Retrieve the hash map info from the adjustor firstIdx, nextIdx, uint count
        return td.adjustor.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map nextIdx, count values increased by 1
        assert.equal(info[1].valueOf(), +adjustorHashMapInfo[1].valueOf() + 1, "Adjustor hash map nextIdx is incorrect");
        assert.equal(info[2].valueOf(), +adjustorHashMapInfo[2].valueOf() + 1, "Adjustor hash map count is incorrect");

        // Save the adjustor hash
        td.aHash[adjustorHashMapInfo[1].valueOf()] = adjustorHash;
    });
}

// updateAdjustor(bytes32 _adjustorHash, address _adjustorAdr, uint _settlementApprovalAmount_Fc, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
exports.updateAdjustor = function(_adjustorHash, _adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement) {
    var adjustorHashMapInfo;
    // Retrieve the hash map info from the adjustor firstIdx, nextIdx, count
    return td.adjustor.hashMap.call()
    .then(function(info) {
        // Store the hash map info for now
        adjustorHashMapInfo = info;
        // Create a new Adjustor via the trust contract signing with the Trust's authorisation keys
        return td.trust.updateAdjustor(_adjustorHash, _adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement, {from: td.accounts[0]});
    })
    .then(function(tx) {
        // Event is triggered as part of the adjustor update log[0]: Adjustor event
        // event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
        // idx                               0                             1                      2          3
        // Event 0 - Adjustor update
        assert.equal(_adjustorHash, miscFunc.eventLog('Adjustor', tx, 0, 0), "Adjustor hash is incorrect");
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 0, 1)), "Adjustor address is incorrect");
        assert.equal(_settlementApprovalAmount_Fc, parseInt(miscFunc.eventLog('Adjustor', tx, 0, 2)), "Adjustor settlement approval amount is incorrect");
        
        // Event 1 - Adjustor update
        assert.equal(_adjustorHash, miscFunc.eventLog('Adjustor', tx, 1, 0), "Adjustor hash is incorrect");
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 1, 1)), "Adjustor address is incorrect");
        assert.equal(_policyRiskPointLimit, parseInt(miscFunc.eventLog('Adjustor', tx, 1, 2)), "Adjustor policy risk point limit is incorrect");
        
        // Event 2 - Adjustor update
        assert.equal(_adjustorHash, miscFunc.eventLog('Adjustor', tx, 2, 0), "Adjustor hash is incorrect");
        assert.equal(_adjustorAdr, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 2, 1)), "Adjustor address is incorrect");
        assert.equal(_serviceAgreement, miscFunc.eventLog('Adjustor', tx, 2, 2), "Adjustor service agreement is incorrect");
        
        // Get the adjustor details
        return td.adjustor.dataStorage.call(_adjustorHash);
    })
    .then(function (aData) {
        // Call the function to verify all bond data
        return miscFunc.verifyAdjustorData(aData, null, _adjustorAdr, _settlementApprovalAmount_Fc, _policyRiskPointLimit, _serviceAgreement);
    })
    .then(function () {
        // Retrieve the hash map info from the adjustor firstIdx, nextIdx, uint count
        return td.adjustor.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map nextIdx, count values stayed the same
        assert.equal(info[1].valueOf(), +adjustorHashMapInfo[1].valueOf(), "Adjustor hash map nextIdx is incorrect");
        assert.equal(info[2].valueOf(), +adjustorHashMapInfo[2].valueOf(), "Adjustor hash map count is incorrect");
    });
}

// retireAdjustor(bytes32 _adjustorHash)
exports.retireAdjustor = function(_adjustorHash) {
    var adjustorHashMapInfo;
    // Retrieve the hash map info from the adjustor firstIdx, nextIdx, count
    return td.adjustor.hashMap.call()
    .then(function(info) {
        // Store the hash map info for now
        adjustorHashMapInfo = info;
        // Retire Adjustor via the trust contract signing with the Trust's authorisation keys
        return td.trust.retireAdjustor(_adjustorHash, {from: td.accounts[0]});
    })
    .then(function(tx) {
        // Event is triggered as part of the adjustor creation log[0]: Adjustor event
        // event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
        // idx                               0                             1                      2          3
        // Event 0 - Adjustor
        assert.equal(_adjustorHash, miscFunc.eventLog('Adjustor', tx, 0, 0), "Adjustor hash is incorrect");
        assert.equal(0x0, miscFunc.getAdrFromBytes32(miscFunc.eventLog('Adjustor', tx, 0, 1)), "Adjustor address is incorrect");
        assert.equal(0, parseInt(miscFunc.eventLog('Adjustor', tx, 0, 2)), "Adjustor settlement approval amount is incorrect");
        
        // Get the adjustor details
        return td.adjustor.dataStorage.call(_adjustorHash);
    })
    .then(function (aData) {
        // Call the function to verify all bond data
        return miscFunc.verifyAdjustorData(aData, null, 0x0, 0, null);
    })
    .then(function () {
        // Verify the adjustor has been removed from the hash map
        // Retrieve the hash map info from the adjustor firstIdx, nextIdx, uint count
        return td.adjustor.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map count value decreased by 1
        assert.equal(info[2].valueOf(), +adjustorHashMapInfo[2].valueOf() - 1, "Adjustor hash map count is incorrect");

        // Verify hash is now not active any more
        return td.adjustor.isActive.call(_adjustorHash);
    })
    .then(function(isActive) { 
        // Verify if the hash map count value decreased by 1
        assert.equal(false, isActive, "Adjustor hash isActive needs to be false");

        // Verify hash is now archiv
        return td.adjustor.isArchived.call(_adjustorHash);
    })
    .then(function(isArchived) { 
        // Verify if the hash map count value decreased by 1
        assert.equal(true, isArchived, "Adjustor hash isArchived needs to be true");
    });
}
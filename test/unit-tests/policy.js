/**
 * @description Unit tests for verifying Policy contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Policy is SetupI, IntAccessI, NotificationI, HashMapI
// event LogPolicy(bytes32 indexed policyHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
// ----------------

// createPolicy(bytes32 _adjustorHash, address _policyOwnerAdr, bytes32 _policyDocumentHash, uint _policyRiskPoints) 
exports.createPolicy = function(_policyRiskPoints, _policyOwnerAccountIdx, _adjustorIdx) {
    var policyHash;
    var policyHashMapInfo;
    // Retrieve the hash map info from the policy firstIdx, nextIdx, count
    return td.policy.hashMap.call()
    .then(function(info) { 
        // Store the hash map info for now
        policyHashMapInfo = info;
        // Create a new Policy
        // createPolicy(bytes32 _adjustorHash, address _policyOwnerAdr, bytes32 _policyDocumentHash, uint _policyRiskPoints) 
        return td.policy.createPolicy(td.aHash[_adjustorIdx], td.accounts[_policyOwnerAccountIdx], miscFunc.getIdxHash(_policyRiskPoints), _policyRiskPoints, {from: td.accounts[_adjustorIdx]});
    })
    .then(function(tx) {
        // Get the policy hash
        policyHash = miscFunc.eventLog('Policy', tx, 0, 0);

        // Save the policy hash
        td.pHash[policyHashMapInfo[1].valueOf()] = policyHash;

        // 2 Events are triggered as part of the policy creation
        // event LogPolicy(bytes32 indexed policyHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
        // idx                             0                           1                      2          3               4                5
        assert.equal(policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
        assert.equal(td.accounts[_policyOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner is incorrect");
        assert.equal(_policyRiskPoints, parseInt(miscFunc.eventLog('Policy', tx, 0, 2)), "Policy risk points is incorrect");
        assert.equal(0, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy is in incorrect state");
        
        assert.equal(policyHash, miscFunc.eventLog('Policy', tx, 1, 0), "Policy hash is incorrect");
        assert.equal(td.accounts[_policyOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 1, 1)), "Policy owner is incorrect");
        assert.equal(miscFunc.getIdxHash(_policyRiskPoints), miscFunc.eventLog('Policy', tx, 1, 2), "Policy document hash is incorrect");
        assert.equal(0, parseInt(miscFunc.eventLog('Policy', tx, 1, 4)), "Policy is in incorrect state");

        // Get the bond details
        return td.policy.dataStorage.call(policyHash);
    })
    .then(function (pData) {
        // Call the function to verify all policy data
        return miscFunc.verifyPolicyData(pData, policyHashMapInfo[1].valueOf(), td.accounts[_policyOwnerAccountIdx], null, miscFunc.getIdxHash(_policyRiskPoints),
        _policyRiskPoints, 0, 0, 0);
    })
    .then(function () {
        // Verify the policy has been added to the hash map
        // Retrieve the hash map info from the policy firstIdx, nextIdx, uint count
        return td.policy.hashMap.call();
    })
    .then(function(info) { 
        // Verify if the hash map nextIdx, count values increased by 1
        assert.equal(info[1].valueOf(), +policyHashMapInfo[1].valueOf() + 1, "Policy hash map nextIdx is incorrect");
        assert.equal(info[2].valueOf(), +policyHashMapInfo[2].valueOf() + 1, "Policy hash map count is incorrect");
    });
}

// updatePolicy(bytes32 _adjustorHash, bytes32 _policyHash, bytes32 _policyDocumentHash, uint _policyRiskPoints) 
exports.updatePolicy = function(_policyHash, _policyRiskPoints, _adjustorIdx) {

    // Save the policy data
    var initialPolicyData;
    
    // Get the bond details
    return td.policy.dataStorage.call(_policyHash)
    .then(function (pData) {
        // Save the initial bond data info
        initialPolicyData = pData;

        // Get the current total policy risk points
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(points) {
        td.totalRiskPoints = points.valueOf();
        // console.log("Total Risk Points: " + totalRiskPoints);
        // console.log("Last reconciliation day: " + initialPolicyData[8].valueOf());
        // console.log("Next reconciliation day: " + initialPolicyData[9].valueOf());

        // updatePolicy(bytes32 _adjustorHash, bytes32 _policyHash, bytes32 _policyDocumentHash, uint _policyRiskPoints) 
        return td.policy.updatePolicy(td.aHash[_adjustorIdx], _policyHash, miscFunc.getIdxHash(_policyRiskPoints), _policyRiskPoints, {from: td.accounts[_adjustorIdx]});
    })
    .then(function(tx) {
        // 2 Events are triggered as part of the policy update
        // event LogPolicy(bytes32 indexed policyHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
        // idx                             0                           1                      2          3               4                5
        assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
        assert.equal(_policyRiskPoints, parseInt(miscFunc.eventLog('Policy', tx, 0, 2)), "Policy risk points is incorrect");
        
        assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 1, 0), "Policy hash is incorrect");
        assert.equal(miscFunc.getIdxHash(_policyRiskPoints), miscFunc.eventLog('Policy', tx, 1, 2), "Policy document hash is incorrect");

        // Get the new total policy risk points
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(newPoints) {

        // In case the policy is in an Issued state
        if (initialPolicyData[7].valueOf() == 1) {
            // Ensure the new value for total policy risk points is correct
            assert.equal(newPoints.valueOf(), +td.totalRiskPoints - +initialPolicyData[4].valueOf() + +_policyRiskPoints, "New value for total policy risk points is invalid");
        }
        else {
            // Ensure the value for policy risk points did NOT change
            assert.equal(newPoints.valueOf(), +td.totalRiskPoints, "Value for total policy risk points is invalid");
        }

        // Save the new value for total policy risk points
        td.totalRiskPoints = newPoints.valueOf();
        //console.log("Total Risk Points: " + totalRiskPoints);

        // Get the bond details
        return td.policy.dataStorage.call(_policyHash);
    })
    .then(function (pData) {
        // console.log("Last reconciliation day: " + pData[8].valueOf());
        // console.log("Next reconciliation day: " + pData[9].valueOf());

        // Call the function to verify all policy data
         return miscFunc.verifyPolicyData(pData, null, null, null, miscFunc.getIdxHash(_policyRiskPoints),
            _policyRiskPoints, null, null, null);
    });
}

// suspendPolicy(bytes32 _policyHash)
exports.suspendPolicy = function(_policyHash, _policyOwnerAccountIdx) {
    // Save the policy data
    var initialPolicyData;
    
    // Get the bond details
    return td.policy.dataStorage.call(_policyHash)
    .then(function (pData) {
        // Save the initial bond data info
        initialPolicyData = pData;

        // Get the current total policy risk points
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(points) {
        td.totalRiskPoints = points.valueOf();

        // Suspend the policy
        return td.policy.suspendPolicy(_policyHash, {from: td.accounts[_policyOwnerAccountIdx]});
    })
    .then(function(tx) {
        // Verify the policy event log
        assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
        assert.equal(td.accounts[_policyOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner address is invalid");
        assert.equal(0, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy state is incorrect");

        // Retrieve the policy data after the transaction
        return td.policy.dataStorage.call(_policyHash);
    })
    .then(function(pData) {
        // Verify the new policy data
        return miscFunc.verifyPolicyData(pData, initialPolicyData[0].valueOf(), initialPolicyData[1], initialPolicyData[2], null, initialPolicyData[4].valueOf(), 
            null, null, 0, td.currentPoolDay, td.currentPoolDay + setupI.MAX_DURATION_POLICY_PAUSED_DAY);
    })
    .then(function() {
        // Remove the risk points
        td.totalRiskPoints = +td.totalRiskPoints - +initialPolicyData[4].valueOf();
        
        // Verify the total number of Risk points in the policy contract is correct
        return td.policy.totalIssuedPolicyRiskPoints.call();
    })
    .then(function(totalPoints) { 
        assert.equal(td.totalRiskPoints, totalPoints.valueOf(), "Total policy risk points specified is incorrect");
    });
}

// unsuspendPolicy(bytes32 _policyHash)
exports.unsuspendPolicy = function(_policyHash, _policyOwnerAccountIdx) {
    // Save the policy data
    var initialPolicyData;
    
    // Get the bond details
    return td.policy.dataStorage.call(_policyHash)
    .then(function (pData) {
        // Save the initial bond data info
        initialPolicyData = pData;

        // Get the current total policy risk points
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(points) {
        td.totalRiskPoints = points.valueOf();

        // Suspend the policy
        return td.policy.unsuspendPolicy(_policyHash, {from: td.accounts[_policyOwnerAccountIdx]});
    })
    .then(function(tx) {
        // Verify the policy event log
        assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
        assert.equal(td.accounts[_policyOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner address is invalid");
        assert.equal(1, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy state is incorrect");

        // Retrieve the policy data after the transaction
        return td.policy.dataStorage.call(_policyHash);
    })
    .then(function(pData) {
        // console.log('Deposited:  ' + miscFunc.formatNr(pData[5].valueOf(), true, 14, false, true));
        // console.log('Charged:    ' + miscFunc.formatNr(pData[6].valueOf() / 1000, true, 14, false, true));
        // console.log('RiskPt:     ' + pData[4].valueOf());
        // console.log('Status:     ' + pData[7].valueOf());
        // console.log('Last Day:   ' + pData[8].valueOf());
        // console.log('Next Day:   ' + pData[9].valueOf());  

        // Verify the new policy data
        return miscFunc.verifyPolicyData(pData, initialPolicyData[0].valueOf(), initialPolicyData[1], initialPolicyData[2], null, initialPolicyData[4].valueOf(), 
            null, null, 1, td.currentPoolDay, null);
    })
    .then(function() {
        // Remove the risk points
        td.totalRiskPoints = +td.totalRiskPoints + +initialPolicyData[4].valueOf();
        
        // Verify the total number of Risk points in the policy contract is correct
        return td.policy.totalIssuedPolicyRiskPoints.call();
    })
    .then(function(totalPoints) { 
        assert.equal(td.totalRiskPoints, totalPoints.valueOf(), "Total policy risk points specified is incorrect");
    });
}

// retirePolicy(bytes32 _policyHash)
exports.retirePolicy = function(_policyHash, _policyOwnerAccountIdx) {
    // Save the policy data
    var initialPolicyData;
    
    // Get the bond details
    return td.policy.dataStorage.call(_policyHash)
    .then(function (pData) {
        // Save the initial bond data info
        initialPolicyData = pData;

        // Get the current total policy risk points
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(points) {
        td.totalRiskPoints = points.valueOf();

        // Suspend the policy
        return td.policy.retirePolicy(_policyHash, {from: td.accounts[_policyOwnerAccountIdx]});
    })
    .then(function(tx) {
        // Verify the policy event log
        assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
        assert.equal(td.accounts[_policyOwnerAccountIdx], miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner address is invalid");
        assert.equal(4, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy state is incorrect");

        // Retrieve the policy data after the transaction
        return td.policy.dataStorage.call(_policyHash);
    })
    .then(function(pData) {
        // Verify the new policy data
        return miscFunc.verifyPolicyData(pData, initialPolicyData[0].valueOf(), initialPolicyData[1], initialPolicyData[2], null, initialPolicyData[4].valueOf(), 
            null, null, 4, td.currentPoolDay, 0);
    })
    .then(function() {
        // If policy to retire is in an Issued state remove the policy risk points
        if (initialPolicyData[7].valueOf() == 1) {
            td.totalRiskPoints = +td.totalRiskPoints - +initialPolicyData[4].valueOf();
        }
        
        // Verify the total number of Risk points in the policy contract is correct
        return td.policy.totalIssuedPolicyRiskPoints.call();
    })
    .then(function(totalPoints) { 
        assert.equal(td.totalRiskPoints, totalPoints.valueOf(), "Total policy risk points specified is incorrect");
    });   
}
/**
 * @description Unit tests for verifying Trust contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Trust is IntAccessI, ExtAccessI
// event LogTrust(bytes32 indexed subject, address indexed adr, bytes32 indexed info, uint timestamp);
// ----------------

// initEcosystem(address _poolAdr, address _bondAdr, address _bankAdr, address _policyAdr, address _settlementAdr, address _adjustorAdr, address _timerAdr, bool _isWinterTime)
exports.verifyDeployedContractsAndInitialiseTestData = function(accounts) {
    // Save and copy all the pre-populated Ethereum accounts into the testData variable accounts!
    td.accounts = accounts;

    var poolAdrRef;
    var bondAdrRef;
    var bankAdrRef;
    var policyAdrRef;
    var settlementAdrRef;
    var adjustorAdrRef;
    var timerAdrRef;
    var trustAdrRef;

    // Get the deployed pool contract instances
    return td.abiPool.deployed()
    .then(function(instance) { td.pool = instance;
        // Get the remaining contract instances
        return td.abiBond.deployed();       }).then(function(instance) { td.bond = instance;
        return td.abiBank.deployed();       }).then(function(instance) { td.bank = instance;
        return td.abiPolicy.deployed();     }).then(function(instance) { td.policy = instance; 
        return td.abiSettlement.deployed(); }).then(function(instance) { td.settlement = instance; 
        return td.abiAdjustor.deployed();   }).then(function(instance) { td.adjustor = instance; 
        return td.abiTimer.deployed();      }).then(function(instance) { td.timer = instance; 
        return td.abiTrust.deployed();      }).then(function(instance) { td.trust = instance; 

        // Retrieve all the contract cross references as specified by the IntAccessI contract
        return td.pool.getContractAdr.call()        }).then(function(adrRef) { poolAdrRef = adrRef;
        return td.bond.getContractAdr.call()        }).then(function(adrRef) { bondAdrRef = adrRef;
        return td.bank.getContractAdr.call()        }).then(function(adrRef) { bankAdrRef = adrRef;
        return td.policy.getContractAdr.call()      }).then(function(adrRef) { policyAdrRef = adrRef;
        return td.settlement.getContractAdr.call()  }).then(function(adrRef) { settlementAdrRef = adrRef;
        return td.adjustor.getContractAdr.call()    }).then(function(adrRef) { adjustorAdrRef = adrRef;
        return td.timer.getContractAdr.call()       }).then(function(adrRef) { timerAdrRef = adrRef;
        return td.trust.getContractAdr.call()       }).then(function(adrRef) { trustAdrRef = adrRef;

        // Verify if all the contracts are cross referenced correctly (only point to each other)
        miscFunc.verifyAllContractReferenceAdr(0, 'Pool',       poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(1, 'Bond',       poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(2, 'Bank',       poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(3, 'Policy',     poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(4, 'Settlement', poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(5, 'Adjustor',   poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(6, 'Timer',      poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        miscFunc.verifyAllContractReferenceAdr(7, 'Trust',      poolAdrRef, bondAdrRef, bankAdrRef, policyAdrRef, settlementAdrRef, adjustorAdrRef, timerAdrRef, trustAdrRef);
        
        // Verify the current pool day configured
        return td.pool.currentPoolDay.call()
    })
    .then(function(day) {
        // Save the current day
        td.currentPoolDay = day;
        // Use the pool log files to extract the first calculated overnight processing timestamp
        return miscFunc.getEventsPromise(td.pool.LogPool({ subject: 'SetInitialProcessingTime'}, { fromBlock: 0, toBlock: "latest" }));
    })
    .then(function(logs) {
        // Save the initial overnight processing timestamp
        td.nextOvernightProcessingTimestamp = parseInt(logs[0].args.adr);
    });
}

// adjustDaylightSaving()
exports.adjustDaylightSaving = function() {
    var isWinterTime;
    // Retrieve the valu if it is summer or winter time
    return td.pool.isWinterTime.call()
    .then(function(summerWinter) {
        isWinterTime = summerWinter;
        return td.trust.adjustDaylightSaving({from: td.accounts[0]});
    })
    .then(function(tx) {
        // Verify the log entries in the pool
        if (isWinterTime == true)
             assert.equal("ChangeToSummerTime  ", miscFunc.hexToAscii(miscFunc.eventLog('Pool', tx, 0, 0), 20), "Change to summer time is incorrect");
        else assert.equal("ChangeToWinterTime  ", miscFunc.hexToAscii(miscFunc.eventLog('Pool', tx, 0, 0), 20), "Change to winter time is incorrect");

        // Verify if change of summer winter time flag is set (daylightSavingScheduled)
        return td.pool.daylightSavingScheduled.call();
    })
    .then(function(daylightSaving) {
        // Verify the log entries in the pool
        assert.isTrue(daylightSaving, "Daylight saving flag is not set");
    });
}
/**
 * @description Unit tests for verifying Pool contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");

// --- Solidity Contract Info ---
// contract Pool is SetupI, IntAccessI, NotificationI
// event LogPool(bytes32 indexed subject, address indexed adr, bytes32 indexed info, uint timestamp);
// ----------------

// setWcExpenses(uint _wcExpenses_Fc)
exports.setWcExpenses = function(_wcExpensesPerDay_Fc) {
    // Check if a valid number for _wcExpensesPerDay_Fc has been provided
    if (_wcExpensesPerDay_Fc == null) {
        // Perform a dummy call so that the function is awaitable
        return td.pool.WC_Exp_Fc.call()
        .then(function() {
        });
    }
    else {
        // Calculate the expenses to set wcExpenses to
        var wcExpenses_Fc = (setupI.DURATION_WC_EXPENSE_HISTORY_DAYS) * _wcExpensesPerDay_Fc;     // 1000.00 per day
        // Update wc expenses in the pool
        return td.trust.setWcExpenses(wcExpenses_Fc, {from: td.accounts[0]})
        .then(function(tx) {
            // Verify the event details for the pool day and wc expenses are correct  
            assert.equal(td.currentPoolDay, parseInt(miscFunc.eventLog('Pool', tx, 0, 1)), "Current pool day is incorrect");
            assert.equal(wcExpenses_Fc, parseInt(miscFunc.eventLog('Pool', tx, 0, 2)), "WC Expenses is incorrect");
            // Verify the new value for wc expenses set in the pool
            return td.pool.WC_Exp_Fc.call();
        })
        .then(function(wcExp) {
            // Verify the variables were updated correctly
            assert.equal(wcExpenses_Fc, wcExp.valueOf(), "WC Expenses is incorrect");
            // Verify the overwrite flag is set
            return td.pool.overwriteWcExpenses.call();
        })
        .then(function(overwriteExpenses) {
            assert.isTrue(overwriteExpenses, "Wc overwrite expenses flag needs to be set.");
            // Save the value new value for wcExpense Fc
            td.wc_exp_fc = wcExpenses_Fc;
        });
    }
}

// dailyOvernightProcessing()
exports.dailyOvernightProcessing = function() {
    // *****************************************************
    // This test code base has been removed and will be published at a later stage.
    // See release notes for further details.
    // *****************************************************
}

// dailyPolicyProcessing()
exports.dailyPolicyProcessing = function() {
    // Call the timer to initiate the processing of the policies
    return td.timer.manualPing(td.policy.address, 0, 0, 0, {from: td.accounts[0]})
    .then(function(tx) {
        return td.policy.totalIssuedPolicyRiskPoints.call();
    }).then(function(points) {
        td.totalRiskPoints = points.valueOf();
        //console.log('New Total Policy risk points: ' + totalRiskPoints);
    });
}

// acceleratePoolYield()
exports.acceleratePoolYield = function(_intervals) {
    var tempYield = 0;
    // Get the yield before the processing
    return td.pool.B_Yield_Ppb.call()
    .then(function(yieldFromPool) {
        //console.log(yieldFromPool);
        td.b_yield_ppb = yieldFromPool;
        tempYield = yieldFromPool;

        // Accellerate the yield if there is sufficient demand
        if (td.wc_bond_fc > ((td.wc_exp_fc * 24 * 3600 * setupI.YAC_EXPENSE_THRESHOLD_PPT) / ((setupI.DURATION_WC_EXPENSE_HISTORY_DAYS * 3600) * (Math.pow(10, 3))))) {
            // Accellerate the yield
            for (var i = 0; i < _intervals; i++) {
                td.timer.manualPing(td.pool.address, 0, 0x0, td.futureEpochTimeStamp, {from: td.accounts[0]});
                tempYield = Math.floor((tempYield * (Math.pow(10, 9) + setupI.YAC_PER_INTERVAL_PPB)) / Math.pow(10, 9));
            }
        }
        // Sleep for a period to ensure all ping yield acceleration transactions are completed
        return miscFunc.sleep(800);
    })
    .then(function () {
        return td.pool.B_Yield_Ppb.call();
    })
    .then(function (yieldFromPool) {
        assert.equal(tempYield, yieldFromPool.valueOf(), "Pool yield is incorrect");
        td.b_yield_ppb = yieldFromPool;
        //console.log(yieldFromPool);
    });
}


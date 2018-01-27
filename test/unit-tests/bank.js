/**
 * @description Unit tests for verifying Bank contract functions
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("../misc/miscFunc.js");
var setupI = require("../misc/setupI.js");
var td = require("../misc/testData.js");
var utBank = require("../unit-tests/bank.js");

// --- Solidity Contract Info ---
// contract Bank is IntAccessI, ExtAccessI
// event LogBank(bytes32 indexed internalReferenceHash, uint indexed accountType, bool indexed success, bytes32 paymentAccountHash, bytes32 paymentSubject, bytes32 info, uint timestamp, uint transactionType, uint amount);
// ----------------

// function processPaymentAdvice(uint _idx, uint _bankTransactionIdx)
exports.processPaymentAdvice = function(_idx) {
    // Get the last payment advice entry number
    return td.bank.countPaymentAdviceEntries.call()
    .then(function(count) {
        // If total number of payment advice entries is 0
        if ((count == 0) || (count <= _idx))
            return null;
        else return td.bank.bankPaymentAdvice.call(_idx);
    })
    .then(function(paymentAdvice) {
        // Check if payment advice is not null
        if (paymentAdvice != null) {
            // Increase the bank transaction idx
            td.bankTransactionIdx++;
            var _expectedAccountType;
            // Extract the Account AccountType from the PaymentAdviceType
            if ((paymentAdvice[0] == 0) || (paymentAdvice[0] == 1)) _expectedAccountType = 0;
            else if ((paymentAdvice[0] == 2) || (paymentAdvice[0] == 3)) _expectedAccountType = 1;
            else _expectedAccountType = 2;

            // Process the payment
            return td.bank.processPaymentAdvice(_idx, td.bankTransactionIdx, {from: td.accounts[0]})
            .then(function(tx) {
                // Verify the bank transaction event details
                assert.equal(_expectedAccountType, parseInt(miscFunc.eventLog('Bank', tx, 0, 1)), "Bank account type is invalid");
                assert.equal(true, Boolean(miscFunc.eventLog('Bank', tx, 0, 2)), "Bank payment success flag is invalid");
                assert.equal(paymentAdvice[1], miscFunc.eventLog('Bank', tx, 0, 3), "Bank payment account hash recipient is invalid");
                assert.equal(paymentAdvice[2], miscFunc.eventLog('Bank', tx, 0, 4), "Bank payment subject is invalid");
                assert.equal(1, parseInt(miscFunc.eventLog('Bank', tx, 0, 7)), "Bank credit/debit (transaction type) is invalid");
                assert.equal(paymentAdvice[3].valueOf(), parseInt(miscFunc.eventLog('Bank', tx, 0, 8)), "Bank debit amount is invalid");

                // If it is an internal payment execute the DEPOSIT transaction
                if ((paymentAdvice[0] == 1) || (paymentAdvice[0] == 3)) {

                    // Execute the deposit
                    return utBank.processAccountCredit(paymentAdvice[0].valueOf() == 1 ? 1 : 2,      // Account type
                                        paymentAdvice[0].valueOf() == 1 ? setupI.PREMIUM_ACCOUNT_PAYMENT_HASH : setupI.BOND_ACCOUNT_PAYMENT_HASH,      // Hash sender
                                        paymentAdvice[2],                   // Payment Subject 
                                        paymentAdvice[3].valueOf(),         // Amount
                                        true, 
                                        miscFunc.getBytes32FromAdr(td.pool.address), 
                                        '')
                    .then(function(tx_deposit) {
                        // Adjust (WC_Bal_BA_Cu, WC_BAL_FA_CU)
                        if (paymentAdvice[0] == 1)
                            td.wc_bal_ba_cu = +td.wc_bal_ba_cu + +paymentAdvice[3].valueOf();
                        else td.wc_bal_fa_cu = +td.wc_bal_fa_cu + +paymentAdvice[3].valueOf();
                        
                        // Verify if WC_Bal_BA_Cu is correct
                        return td.pool.WC_Bal_BA_Cu.call();
                    })
                    .then(function(bal) {
                        assert.equal(td.wc_bal_ba_cu, bal.valueOf(), "Balance for WC_Bal_BA_Cu is invalid");
                        // Verify if WC_Bal_FA_Cu is correct
                        return td.pool.WC_Bal_FA_Cu.call();
                    })
                    .then(function(bal) {
                        assert.equal(td.wc_bal_fa_cu, bal.valueOf(), "Balance for WC_Bal_FA_Cu is invalid");
                        return true; 
                    });
                }
                // Return true as successfull
                return true;
            });
        }
        // Return false as specified idx is not a valid payment advice
        else return false;
    });
}

// function processes all outstanding bank payment advice entries
exports.processAllOutstandginPaymentAdvice = function() {
    // Get the payment advice details
    return td.bank.countPaymentAdviceEntries.call()
    .then(function(count) {
        // If entries exist run the instructions
        if (count > 0) {
            // Run up to 10 bank payment advice instructions starting with the first idx
            var idx = 0;
            return utBank.processPaymentAdvice(idx)
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { idx++; if(idx < count) return utBank.processPaymentAdvice(idx); else return false; })
            .then(function(res) { });
        }
    });
}

// function processAccountCredit(uint _bankTransactionIdx, uint _accountType, bytes32 _paymentAccountHashSender, bytes32 _paymentSubject, uint _bankCreditAmount_Cu)
exports.processAccountCredit = function(_accountType, _paymentAccountHashSender, _paymentSubject, _bankCreditAmount_Cu, 
    _expectedSuccess, _expectedHash, _expectedInfo) {
    // Variable to store the transaction result to return
    var transactionResult;
    // Increase the bankTransactionIdx
    td.bankTransactionIdx++;

    // Process the deposit
    return td.bank.processAccountCredit(td.bankTransactionIdx, _accountType, _paymentAccountHashSender, _paymentSubject, 
        _bankCreditAmount_Cu, {from: td.accounts[0]})
    .then(function(tx) {
        // Set the transaction result (with the events)
        transactionResult = tx;
        // Verify how many events were triggert (the bank transaction log events are always triggered last)
        var eventIdx = tx.receipt.logs.length - 1;
        if (_expectedSuccess == false)
            eventIdx--;

        // event LogBank(bytes32 indexed internalReferenceHash, uint indexed accountType, bool indexed success,
        // idx                                             0                                   1                         2
        //     bytes32 paymentAccountHash, bytes32 paymentSubject, bytes32 info, 
        // idx         3                           4                       5
        //     uint timestamp, uint transactionType, uint amount);
        // idx      6               7                     8                     
        // Check the event details
        assert.equal(_expectedHash, miscFunc.eventLog('Bank', tx, eventIdx, 0), "Internal reference hash for this bank transaction is invalid");
        assert.equal(_accountType, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 1)), "Bank account type is invalid");
        assert.equal(_expectedSuccess, Boolean(miscFunc.eventLog('Bank', tx, eventIdx, 2)), "Bank payment success flag is invalid");
        assert.equal(_paymentAccountHashSender, miscFunc.eventLog('Bank', tx, eventIdx, 3), "Bank payment account hash sender is invalid");
        assert.equal(_paymentSubject, miscFunc.eventLog('Bank', tx, eventIdx, 4), "Bank payment subject is invalid");
        assert.isTrue(miscFunc.eventLog('Bank', tx, eventIdx, 5).indexOf(_expectedInfo) != -1, "Bank payment info is invalid");
        assert.equal(0, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 7)), "Bank credit/debit (transaction type) is invalid");
        assert.equal(_bankCreditAmount_Cu, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 8)), "Bank deposit amount is invalid");

        if (_expectedSuccess == false) {
            // Increase the event Idx
            eventIdx++;
            // Check the event details of the refund operation
            //assert.equal(_expectedHash, miscFunc.eventLog('Bank', tx, eventIdx, 0), "Internal reference hash for this bank transaction is invalid");
            assert.equal(_accountType, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 1)), "Bank account type is invalid");
            assert.equal(true, Boolean(miscFunc.eventLog('Bank', tx, eventIdx, 2)), "Bank payment success flag is invalid");
            assert.equal(_paymentAccountHashSender, miscFunc.eventLog('Bank', tx, eventIdx, 3), "Bank payment account hash sender is invalid");
            assert.equal(_paymentSubject, miscFunc.eventLog('Bank', tx, eventIdx, 4), "Bank payment subject is invalid");
            assert.isTrue(miscFunc.eventLog('Bank', tx, eventIdx, 5).indexOf('Refund') != -1, "Bank payment info is invalid");
            assert.equal(1, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 7)), "Bank credit/debit (transaction type) is invalid");
            assert.equal(_bankCreditAmount_Cu, parseInt(miscFunc.eventLog('Bank', tx, eventIdx, 8)), "Bank deposit amount is invalid");
        }
        // Verify the transaction idx flag is set
        return td.bank.bankTransactionIdxProcessed.call(td.bankTransactionIdx);
    })
    .then(function(result) {
        assert.isTrue(result, "Bank Transaction Idx Processed flag needs to be set to true");
        // Return the transaction result
        return transactionResult;
    });
}

// function processes a credit into the Funding account (i.e. a bond credit)
exports.bondPrincipalCredit = function(_bondHash) {
    // Variable to stor the final bond yield (if applicable)
    var finalBondYield = 0;
    // Save the bond principal
    var bondPrincipal = 0;
    // Maturity payout amount
    var maturityPayoutAmount = 0;
    // Save the bond's state
    var initialBondData;

    // Get the bond details
    return td.bond.dataStorage.call(_bondHash)
    .then(function (bData) {
        // Save the initial bond data info
        initialBondData = bData;
        // Save the bond principal
        bondPrincipal = initialBondData[3].valueOf();
        // Process the bank deposit
        return utBank.processAccountCredit(2, web3.sha3(_bondHash), _bondHash, initialBondData[3].valueOf(), true, _bondHash, '');
    })
    .then(function(tx) {
        var eventIdx = 0;
        // If bond was in a created state => Calculate the final bond yield and check event info
        if (initialBondData[9] == 0) {
            // Calculate the final bond yield and update pool variables
            // Calcuate the expected yield average
            var yieldAvg = Math.floor((td.b_gradient_ppq * bondPrincipal) / (2 * (Math.pow(10, 6))));
            // Calculate the final and expected bond yield
            finalBondYield = Math.max(setupI.MIN_YIELD_PPB, +td.b_yield_ppb - +yieldAvg);
            // Calculate the final and expected pool yield
            td.b_yield_ppb = Math.max(setupI.MIN_YIELD_PPB, +td.b_yield_ppb - (2 * +yieldAvg));

            // Adjust wc_bond_cu
            td.wc_bond_cu = +td.wc_bond_cu - +bondPrincipal;

            // Check the bond event details
            // event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
            // idx                           0                         1                      2          3               4
            // Event 1 - Bond is secured with Bond Principal
            assert.equal(_bondHash, miscFunc.eventLog('Bond', tx, eventIdx, 0), "Bond hash is invalid.");
            assert.equal(bondPrincipal, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 2)), "Bond credit amount is incorrect");
            assert.equal(1, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 4)), "Securing bond is in incorrect state");
            eventIdx++;
            // Event 2 - Bond signing
            assert.equal(_bondHash, miscFunc.eventLog('Bond', tx, eventIdx, 0), "Bond hash is invalid.");
            assert.equal(finalBondYield, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 2)), "Bond yield is incorrect");
            assert.equal(3, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 4)), "Bond is in incorrect state");
            eventIdx++;
        }
        else {
            // If bond was SecuredReferenceBond (was in a Signed state before the bank transaction) the security bond event need to be verified
            // Verify the bond that provided the underwriting is in issued state again
            assert.equal(initialBondData[10].valueOf(), parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 0)), "Bond hash is invalid");
            assert.equal(4, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 4)), "Bond state is invalid");
            eventIdx++;

            // Reduce WC_Transit_Cu as bond was secured by another bond
            td.wc_transit_cu = +td.wc_transit_cu - +bondPrincipal;

            // Safe the final bond yield
            finalBondYield = initialBondData[4].valueOf();
        }
        
        // Verify the bond event log of the issued log
        assert.equal(4, parseInt(miscFunc.eventLog('Bond', tx, eventIdx, 4)), "Bond state is invalid");

        // Adjust WC_Bal_FA_Cu
        td.wc_bal_fa_cu = +td.wc_bal_fa_cu + +bondPrincipal;

        // Calculate the maturity payout amount
        maturityPayoutAmount = +bondPrincipal + Math.floor(+bondPrincipal * +finalBondYield / Math.pow(10, 9));

        // Increase the bond maturity payout for the future day
        var futureBondMaturityDay = +Math.floor(setupI.DURATION_TO_BOND_MATURITY_SEC / 86400) + +td.currentPoolDay;
        // If the value is null set it to 0 first
        if (td.bondMaturityPayoutsEachDay[futureBondMaturityDay] == null)
            td.bondMaturityPayoutsEachDay[futureBondMaturityDay] = 0;
        // Add the bond maturity payout amount to the day
        td.bondMaturityPayoutsEachDay[futureBondMaturityDay] += +maturityPayoutAmount;

        // Get the bond details after the bank transaction
        return td.bond.dataStorage.call(_bondHash);
    })
    .then(function (bData) {
        // Call the function to verify all bond data
        return miscFunc.verifyBondData(bData, null, null, 
            null, null, finalBondYield, maturityPayoutAmount, null, null, null, 4, 0x0);
    })
    .then(function() {
        // Verify the new balance for wc_bal_fa_cu in pool is valid
        return td.pool.WC_Bal_FA_Cu.call();
    })
    .then(function(bal) {
        assert.equal(td.wc_bal_fa_cu, bal.valueOf(), "WC_BAL_FA_CU in the pool is invalid");

        // Verify new value for wc transit
        return td.pool.WC_Transit_Cu.call();
    })
    .then(function(wc_transit) {
        assert.equal(td.wc_transit_cu, wc_transit.valueOf(), "The value for wc transit is incorrect");
        
        // Get the bond data of the securing bond if applicable (bond was in signed state)
        if (initialBondData[9] == 3)
            return td.bond.dataStorage.call(initialBondData[10]);
        else return null;
    })
    .then(function (bData) {
        // Verify the bond underwriting data if applicable
        if (bData != null) {
            // The state of the underwriting bond needs to be Issued (4) and reference to bond needs to be removed 0x0
            return miscFunc.verifyBondData(bData, null, null, null, null, null, null, null, null, null, 4, 0x0);
        }
        else return 0;
    });
}

// function processes a credit into the Premium account (i.e. a policy credit)
exports.policyPremiumCredit = function(_policyHash, _amount_cu) {
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

        // Process the bank deposit
        return utBank.processAccountCredit(0, web3.sha3(_policyHash), _policyHash, _amount_cu, true, _policyHash, '');
    })
    .then(function(tx) {
        var eventIdx = 0;
        // Adjust WC_Bal_PA_Cu
        td.wc_bal_pa_cu = +td.wc_bal_pa_cu + +_amount_cu;
        
        // If the policy is in a paused state and this is the first ever credit to this policy
        if ((initialPolicyData[7].valueOf() == 0) &&  (initialPolicyData[5].valueOf() == 0)) {
            // Verify the policy event log
            assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
            assert.equal(initialPolicyData[1].valueOf(), miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner address is invalid");
            assert.equal(1, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy state is incorrect");

            // Add the risk points
            td.totalRiskPoints = +td.totalRiskPoints + +initialPolicyData[4].valueOf();
            // Change the expected policy's state to issued (1)
            initialPolicyData[7] = 1;
            // Change the last reconciliation day to today
            initialPolicyData[8] = td.currentPoolDay;
        }
        // If the state of the Policy was Lapsed
        if (initialPolicyData[7].valueOf() == 2) {
            // Verify the policy event log
            assert.equal(_policyHash, miscFunc.eventLog('Policy', tx, 0, 0), "Policy hash is incorrect");
            assert.equal(initialPolicyData[1].valueOf(), miscFunc.getAdrFromBytes32(miscFunc.eventLog('Policy', tx, 0, 1)), "Policy owner address is invalid");
            assert.equal(3, parseInt(miscFunc.eventLog('Policy', tx, 0, 4)), "Policy state is incorrect");

            // Change the expected policy's state to post lapsed (3)
            initialPolicyData[7] = 3;
            // Change the last reconciliation day to today
            initialPolicyData[8] = td.currentPoolDay;
        }

        // If the state of the Policy is Issued
        if (initialPolicyData[7].valueOf() == 1) {
            // Change the last reconciliation day to today
            initialPolicyData[8] = td.currentPoolDay;
        }

        // Adjust the premiumDeposited amount
        initialPolicyData[5] = +initialPolicyData[5].valueOf() + +_amount_cu;

        // Verify the new balance for wc_bal_pa_cu in pool is valid
        return td.pool.WC_Bal_PA_Cu.call();
    })
    .then(function(bal) {
        assert.equal(td.wc_bal_pa_cu, bal.valueOf(), "WC_BAL_PA_CU in the pool is invalid");

         // Get the policy data after the deposit
         return td.policy.dataStorage.call(_policyHash);
    })
    .then(function (pData) {
        // console.log('Deposited:  ' + miscFunc.formatNr(pData[5].valueOf(), true, 14, false, true));
        // console.log('Charged:    ' + miscFunc.formatNr(pData[6].valueOf() / 1000, true, 14, false, true));
        // console.log('RiskPt:     ' + pData[4].valueOf());
        // console.log('Status:     ' + pData[7].valueOf());
        // console.log('Last Day:   ' + pData[8].valueOf());
        // console.log('Next Day:   ' + pData[9].valueOf());

        // Verify the new policy data
        return miscFunc.verifyPolicyData(pData, initialPolicyData[0].valueOf(), initialPolicyData[1], null, null, initialPolicyData[4].valueOf(), 
            initialPolicyData[5].valueOf(), null, initialPolicyData[7].valueOf(), initialPolicyData[8].valueOf(), null);
    })
    .then(function () {
        // Verify the total number of Risk points in the policy contract is correct
        return td.policy.totalIssuedPolicyRiskPoints.call();
    })
    .then(function(totalPoints) { 
        assert.equal(td.totalRiskPoints, totalPoints.valueOf(), "Total policy risk points specified is incorrect");
    });
}
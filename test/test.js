/**
 * @description Execution of unit tests to verify the entire Insurance Pool model
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the java script files to access their functions
var miscFunc = require("./misc/miscFunc.js");
var setupI = require("./misc/setupI.js");
var td = require("./misc/testData.js");
var printLogs = require("./misc/printLogs.js");
var utAdjustor = require("./unit-tests/adjustor.js");
var utSettlement = require("./unit-tests/settlement.js");
var utPool = require("./unit-tests/pool.js");
var utTrust = require("./unit-tests/trust.js");
var utBank = require("./unit-tests/bank.js");
var utBond = require("./unit-tests/bond.js");
var utPolicy = require("./unit-tests/policy.js");

contract('All Insurance Ecosystem Contracts', function(accounts) {

    // Function combines all overnight processing tasks and calls the required unit test
    function overnightProcessing(_wcExpensesPerDay) {
        return utPool.setWcExpenses(_wcExpensesPerDay)
        .then(function() { return utPool.dailyOvernightProcessing() })
        .then(function() { return utPool.dailyPolicyProcessing() })
        .then(function() { return utBank.processAllOutstandginPaymentAdvice() })
        .then(function() { return 0 });
    }

    // Function combines bond creation and principal deposit
    function createBondCreditPrincipal(_principal_cu, _bondRefHash, bIdx, bOwnerIdx) {
        return utBond.createBond(_principal_cu, _bondRefHash, bOwnerIdx)
        .then(function() { return utBank.bondPrincipalCredit(td.bHash[bIdx]) })
        .then(function() { return 0 });
    }

    // Function combines policy creation and credit of the policy premium
    function createPolicyCreditPremium(_riskPoints, pIdx, aIdx, _premiumAmount_cu) {
        return utPolicy.createPolicy(_riskPoints, pIdx, aIdx)
        .then(function() { return utBank.policyPremiumCredit(td.pHash[pIdx], _premiumAmount_cu) })
        .then(function() { return 0 });
    }

    // ******************************************************************************
    // *** Verify the ecosystem has been initialised correclty and save test data
    // ******************************************************************************

    it("should verify and save the initialization variables of Pool (This unit test must always be run first!)          ", function() {
        return utTrust.verifyDeployedContractsAndInitialiseTestData(accounts).then(function() { });
    });

    // ******************************************************************************
    // *** Test ADJUSTORS
    // ******************************************************************************

    it("should create adjustor 1 [owner: 1]                                                                             ", function() {
        var aIdx = 1;
        return utAdjustor.createAdjustor(td.accounts[aIdx], 25000000, 2000, miscFunc.getRandomHash()).then(function(hash) { });
    });

    it("should create adjustor 2 [owner: 2]                                                                             ", function() {
        var aIdx = 2;
        return utAdjustor.createAdjustor(td.accounts[aIdx], 45000000, 1500, miscFunc.getRandomHash()).then(function(hash) { });
    });

    it("should create adjustor 3 [owner: 3]                                                                             ", function() {
        var aIdx = 3;
        return utAdjustor.createAdjustor(td.accounts[aIdx], 55000000, 0, miscFunc.getRandomHash()).then(function(hash) { });
    });

    it("should create adjustor 4 [owner: 4]                                                                             ", function() {
        var aIdx = 4;
        return utAdjustor.createAdjustor(td.accounts[aIdx], 0, 5000, miscFunc.getRandomHash()).then(function(hash) { });
    });

    it("should update adjustor 4 [owner: 4]                                                                             ", function() {
        var aIdx = 4;
        return utAdjustor.updateAdjustor(td.aHash[aIdx] , td.accounts[aIdx], 35000000, 0, miscFunc.getRandomHash()).then(function() { });
    });

    it("should retire adjustor 4 [owner: 4]                                                                             ", function() {
        var aIdx = 4;
        return utAdjustor.retireAdjustor(td.aHash[aIdx]).then(function() { });
    });

    // ******************************************************************************
    // *** Test POOL, BOND, POLICY, BANK
    // ******************************************************************************

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should change the pool daylight saving time                                                                     ", function() {
        return utTrust.adjustDaylightSaving().then(function() { });
    });

    it("should create bond 1 [owner: 1] (SecuredBondPrincipal)                                                          ", function() {
        var bOwnerIdx = 1;
        return utBond.createBond(25000, 0x0, bOwnerIdx).then(function() { });
    });

    it("should credit bond 1 [owner: 1] principal amount to Funding account (SecuredBondPrincipal)                      ", function() {
        var bIdx = 1;
        return utBank.bondPrincipalCredit(td.bHash[bIdx]).then(function() { });
    });

    it("should accelerate the Pool Yield by 48 intervals (2 days)                                                       ", function() {
        return utPool.acceleratePoolYield(48).then(function() { });  
    });

    it("should create bond 2 [owner: 2] (SecuredBondPrincipal) and credit principal amount to Funding account           ", function() {
        var bIdx = 2; var refBondIdx = null; var bOwnerIdx = 1;
        return createBondCreditPrincipal(7000000, 0x0, bIdx, bOwnerIdx);
    });

    it("should create policy 1 [owner: 1], adjustor 1                                                                   ", function() {
        var pIdx = 1; var aIdx = 1;
        return utPolicy.createPolicy(1000, pIdx, aIdx).then(function() { });
    });

    it("should credit policy 1 [owner: 1] premium to Premium Holding Account account                                    ", function() {
        var pIdx = 1;
        return utBank.policyPremiumCredit(td.pHash[pIdx], 2000000).then(function(res) { });
    });

    it("should create policy 2 [owner: 2], adjustor 1 and credit premium to Premium Holding Account account             ", function() {
        var pIdx = 2; var aIdx = 1;
        return createPolicyCreditPremium(1200, pIdx, aIdx, 3000000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should accelerate the Pool Yield by 48 intervals (2 days)                                                       ", function() {
        return utPool.acceleratePoolYield(48).then(function() { });  
    });

    // ******************************************************************************
    // *** Test BOND
    // ******************************************************************************

    it("should create bond 3 [owner: 1] (SecuredReferenceBond [bond: 1]) and credit principal amount to Funding account ", function() {
        var bIdx = 3; var refBondIdx = 1; var bOwnerIdx = 1;
        return createBondCreditPrincipal(40000, td.bHash[refBondIdx], bIdx, bOwnerIdx);
    });

    it("should mature bond 1 [owner: 1] and process as matured                                                          ", function() {       
        var bIdx = 1;
        return utBond.processMaturedBond(td.bHash[bIdx]).then(function() { });
    });

    it("should create bond 4 [owner: 1] (SecuredReferenceBond [bond: 3])                                                ", function() {
        var bIdx = 4; var refBondIdx = 3; var bOwnerIdx = 1;
        return utBond.createBond(80000, td.bHash[refBondIdx], bOwnerIdx).then(function() { });
    });

    it("should mature bond 3 [owner: 1] and process as defaulted                                                        ", function() {       
        var bIdx = 3;
        return utBond.processMaturedBond(td.bHash[bIdx]).then(function() { });
    });

    it("should mature bond 4 [owner: 1] and process as defaulted                                                        ", function() {       
        var bIdx = 4;
        return utBond.processMaturedBond(td.bHash[bIdx]).then(function() { });
    });

    it("should create bond 5 [owner: 5] (SecuredBondPrincipal)                                                          ", function() {
        var bOwnerIdx = 5;
        return utBond.createBond(25000, 0x0, bOwnerIdx).then(function() { });
    });

    it("should mature bond 5 [owner: 5] and process as defaulted                                                        ", function() {       
        var bIdx = 5;
        return utBond.processMaturedBond(td.bHash[bIdx]).then(function() { });
    });

    it("should process all outstanding bank payment advice                                                              ", function() {
         return utBank.processAllOutstandginPaymentAdvice().then(function() { });
    });

    // ******************************************************************************
    // *** Test OVERNIGHT PROCESSING
    // ******************************************************************************

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    // ******************************************************************************
    // *** Test POLICY and SETTLEMENT
    // ******************************************************************************

    it("should create settlement 1 [adjustor: 2]                                                                        ", function() {
        var aIdx = 2;
        return utSettlement.createSettlement(aIdx, miscFunc.getEmptyHash(), miscFunc.getEmptyHash()).then(function(hash) { });
    });

    it("should create settlement 2 [adjustor: 2]                                                                        ", function() {
        var aIdx = 2;
        return utSettlement.createSettlement(aIdx, miscFunc.getEmptyHash(), miscFunc.getIdxHash(33)).then(function(hash) { });
    });

    it("should add additional info to settlement 2 [adjustor: 2]                                                        ", function() {
        var sIdx = 2; var aIdx = 2;
        return utSettlement.addSettlementInfo(sIdx, aIdx, miscFunc.getIdxHash(67)).then(function() { });
    });

    it("should add additional info to settlement 2 [adjustor: 2]                                                        ", function() {
        var sIdx = 1; var aIdx = 2;
        return utSettlement.addSettlementInfo(sIdx, aIdx, miscFunc.getIdxHash(567)).then(function() { });
    });

    it("should set expected settlement amount for settlement 1 [adjustor: 2]                                            ", function() {
        var sIdx = 1; var aIdx = 2;
        return utSettlement.setExpectedSettlementAmount(sIdx, aIdx, 120000).then(function() { });
    });

    it("should set expected settlement amount for settlement 1 [adjustor: 2]                                            ", function() {
        var sIdx = 1; var aIdx = 2;
        return utSettlement.setExpectedSettlementAmount(sIdx, aIdx, 110000).then(function() { });
    });

    it("should set expected settlement amount for settlement 2 [adjustor: 2]                                            ", function() {
        var sIdx = 2; var aIdx = 2;
        return utSettlement.setExpectedSettlementAmount(sIdx, aIdx, 150000).then(function() { });
    });

    it("should set expected settlement amount for settlement 2 [adjustor: 2]                                            ", function() {
        var sIdx = 2; var aIdx = 2;
        return utSettlement.setExpectedSettlementAmount(sIdx, aIdx, 0).then(function() { });
    });

    it("should close settlement 1 [adjustor: 2]                                                                         ", function() {
        var sIdx = 1; var aIdx = 2;
        return utSettlement.closeSettlement(sIdx, aIdx, miscFunc.getIdxHash(1234), 55500).then(function() { });
    });

    it("should close settlement 2 [adjustor: 2]                                                                         ", function() {
        var sIdx = 2; var aIdx = 2;
        return utSettlement.closeSettlement(sIdx, aIdx, miscFunc.getIdxHash(12134), 65500).then(function() { });
    });

    // ******************************************************************************
    // *** Test POLICY AND POOL
    // ******************************************************************************

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(null).then(function() { });
    });

    it("should create policy 3 [owner: 3], adjustor 1 and credit premium to Premium Holding Account account             ", function() {
        var pIdx = 3; var aIdx = 1;
        return createPolicyCreditPremium(1200, pIdx, aIdx, 3000000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should update policy 3 [owner: 3], adjustor 1                                                                   ", function() {
        var pIdx = 3; var aIdx = 1;
        return utPolicy.updatePolicy(td.pHash[pIdx], 500, aIdx).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should suspend policy 3 [owner: 3]                                                                              ", function() {
        var pIdx = 3; var pOwnerIdx = 3;
        return utPolicy.suspendPolicy(td.pHash[pIdx], pOwnerIdx).then(function(res) { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should update policy 3 [owner: 3], adjustor 1                                                                   ", function() {
        var pIdx = 3; var aIdx = 1;
        return utPolicy.updatePolicy(td.pHash[pIdx], 800, aIdx).then(function() { });
    });

    it("should unsuspend policy 3 [owner: 3]                                                                            ", function() {
        var pIdx = 3; var pOwnerIdx = 3;
        return utPolicy.unsuspendPolicy(td.pHash[pIdx], pOwnerIdx).then(function(res) { });
    });

    it("should update policy 3 [owner: 3], adjustor 1                                                                   ", function() {
        var pIdx = 3; var aIdx = 1;
        return utPolicy.updatePolicy(td.pHash[pIdx], 1200, aIdx).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should retire policy 3 [owner: 3]                                                                               ", function() {
        var pIdx = 3; var pOwnerIdx = 3;
        return utPolicy.retirePolicy(td.pHash[pIdx], pOwnerIdx).then(function(res) { });
    });

    it("should retire policy 1 [owner: 1]                                                                               ", function() {
        var pIdx = 1; var pOwnerIdx = 1;
        return utPolicy.retirePolicy(td.pHash[pIdx], pOwnerIdx).then(function(res) { });
    });

    it("should process all outstanding bank payment advice                                                              ", function() {
        return utBank.processAllOutstandginPaymentAdvice().then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should create policy 4 [owner: 4], adjustor 1                                                                   ", function() {
        var pIdx = 4; var aIdx = 1;
        return utPolicy.createPolicy(1000, pIdx, aIdx).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should credit policy 4 [owner: 4] premium to Premium Holding Account account                                    ", function() {
        var pIdx = 4;
        return utBank.policyPremiumCredit(td.pHash[pIdx], 2000000).then(function(res) { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return overnightProcessing(100000).then(function() { });
    });

    it("should change the pool daylight saving time                                                                     ", function() {
        return utTrust.adjustDaylightSaving().then(function() { });
    });

    it("should run all overnight processing tasks                                                                       ", function() {
        return utPool.setWcExpenses(100000)
        .then(function() { return utPool.dailyOvernightProcessing() });
    });
    
    it("should print                                                                                                    ", function() {
        // printLogs.printAdjustorLogs(null, null, null);
        // printLogs.printSettlementLogs(null, null, null);
        // printLogs.printPoolLogs(null, null, null);
        // printLogs.printTrustLogs(null, null, null);
        // printLogs.printPolicyLogs(null, null, null);
        
        //printLogs.printBondLogs(null, null, null);
        
        // printLogs.printPremiums();
        // printLogs.printBankLogs(null, null, null);
        // printLogs.printBankPaymentAdvice(0, 20);



        // printLogs.printAdjustorLogs(td.aHash[1], null, null);
        // printLogs.printSettlementLogs(td.sHash[1], null, null);
        // printLogs.printPolicyLogs(td.pHash[1], null, null);
        // printLogs.printBondLogs(td.bHash[1], null, null);

        // printLogs.printPoolLogs(null, null, null);
        // printLogs.printBankLogs(null, null, null);
    });
});
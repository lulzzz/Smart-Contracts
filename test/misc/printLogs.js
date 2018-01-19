/**
 * @description Functions to print contract event logs to the console
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

var miscFunc = require("./miscFunc.js");
var printLogFiles = require("./printLogs.js");
var td = require("../misc/testData.js");

// Block number
var blockNumberStart = 0;//web3.eth.blockNumber;

// event LogTrust(bytes32 indexed subject, address indexed adr, bytes32 indexed info, uint timestamp);
exports.printTrustLogs = function(_subject, _adr, _info) {
    // Print pool transaction log
    return miscFunc.getEventsPromise(td.trust.LogTrust({ subject: _subject, adr: _adr, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        var lastPrintedDay = 0;
        console.log('');
        console.log('Trust: '+ td.trust.address);
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var subject = miscFunc.hexToAscii(logs[i].args.subject, 25);
            var address = ((parseInt(logs[i].args.adr) > (Math.pow(10, 18))) ? logs[i].args.adr : 
                                miscFunc.formatNr(parseInt(logs[i].args.adr), false, 42, true, false));

            if (parseInt(logs[i].args.adr) < (Math.pow(10, 18))) {
                if (parseInt(logs[i].args.adr) != lastPrintedDay) {
                    if ((parseInt(logs[i].args.adr) > 17000) && (parseInt(logs[i].args.adr) < 20000))
                        console.log('-------------------------------------------------------------------------------------------------------------------------');
                    lastPrintedDay = parseInt(logs[i].args.adr);
                }
            }
            
            var info;
            if (subject.indexOf("Fc") != -1)
                    info = miscFunc.formatNr(parseInt(logs[i].args.info), true, 18);
            else if ((subject.indexOf("Pp") != -1) || (subject.indexOf("TotalRiskPoints") != -1))
                info = miscFunc.formatNr(parseInt(logs[i].args.info), false, 18, false, true);
            else if (parseInt(logs[i].args.info) > (Math.pow(10, 18)))
                info = miscFunc.getAdrFromBytes32(logs[i].args.info);
            else info = '                  ';

            console.log(
                miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                subject + '   ' + 
                address + '   ' +
                info
            );
        }
        console.log('');
        console.log('');
    });
}

// event LogPool(bytes32 indexed subject, address indexed adr, bytes32 indexed info, uint timestamp);
exports.printPoolLogs = function(_subject, _adr, _info) {
    // Print pool transaction log
    return miscFunc.getEventsPromise(td.pool.LogPool({ subject: _subject, adr: _adr, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        var lastPrintedDay = 0;
        console.log('');
        console.log('Pool: '+ td.pool.address);
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var subject = miscFunc.hexToAscii(logs[i].args.subject, 25);
            var address = ((parseInt(logs[i].args.adr) > (Math.pow(10, 18))) ? logs[i].args.adr : 
                                miscFunc.formatNr(parseInt(logs[i].args.adr), false, 42, true, false));

            if (parseInt(logs[i].args.adr) < (Math.pow(10, 18))) {
                if (parseInt(logs[i].args.adr) != lastPrintedDay) {
                    if ((parseInt(logs[i].args.adr) > 17000) && (parseInt(logs[i].args.adr) < 20000))
                        console.log('-------------------------------------------------------------------------------------------------------------------------');
                    lastPrintedDay = parseInt(logs[i].args.adr);
                }
            }
            
            var info;
            if (subject.indexOf("Fc") != -1)
                    info = miscFunc.formatNr(parseInt(logs[i].args.info), true, 18);
            else if ((subject.indexOf("Pp") != -1) || (subject.indexOf("TotalRiskPoints") != -1))
                info = miscFunc.formatNr(parseInt(logs[i].args.info), false, 18, false, true);
            else if (parseInt(logs[i].args.info) > (Math.pow(10, 18)))
                info = miscFunc.getAdrFromBytes32(logs[i].args.info);
            else info = '                  ';

            console.log(
                miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                subject + '   ' + 
                address + '   ' +
                info
            );
        }
        console.log('');
        console.log('');
    });
}

// event LogBankAccountTransaction(uint timestamp, uint bankTransactionIdx, uint indexed accountType, uint transactionType, 
//    bytes32 paymentAccountHash, bytes32 paymentSubject, uint amount, bool indexed success, bytes32 indexed internalReferenceHash, bytes32 info);
exports.printBankLogs = function(_accountType, _success, _hash) {
    // Array to store the Transaction states
    var accType = ['PremiumHoldingAccount', 'BondHoldingAccount   ', 'FundingAccount       '];
    var transType = ['Credit', 'Debit '];

    // Print bank transaction log
    return miscFunc.getEventsPromise(td.bank.LogBank({ accountType: _accountType, success: _success, internalReferenceHash: _hash }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        console.log('');
        console.log('Bank account transaction logs:');
        console.log('==============================');
        for (var i=0; i<logs.length; i++){
            console.log(miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                accType[logs[i].args.accountType.valueOf()] + '   ' + 
                transType[logs[i].args.transactionType.valueOf()] + '   ' + 
                miscFunc.formatNr(logs[i].args.amount.valueOf(), true, 15) + '   ' + 
                ((logs[i].args.success == true) ? 'true ' : 'false') + '   ' + 
                ((logs[i].args.paymentSubject.valueOf() < 99999) ? 
                    miscFunc.formatNr(parseInt(logs[i].args.paymentSubject.valueOf()), false, 13, true, false) :
                    miscFunc.shortenHash(logs[i].args.paymentSubject)) + '   ' + 
                
                    ((logs[i].args.paymentSubject.valueOf() < 99999) ?
                    'Pool         ' :
                    miscFunc.shortenHash(logs[i].args.internalReferenceHash)) + '   ' + 
                
                    ((logs[i].args.info != 0) ? miscFunc.hexToAscii(logs[i].args.info, 21) : '-')
            );
        }
        console.log('');  
        console.log('');          
    });
}

// Printing all payment advice entries that are outstanding for processing
exports.printBankPaymentAdvice = function(startIdx, maxCount) {
    // Array to store the payment advice types in
    var adviceType = ['PremiumRefund  ', 'Premium        ', 'BondMaturity   ', 
                      'Overflow       ', 'CashSettlement ', 'ServiceProvider',
                      'Trust          ', 'PoolOperator   '];

    return td.bank.paymentAdviceCountNextLast()
    .then(function(countNextLast) {
        for (var i=countNextLast[1].valueOf(); (i <= countNextLast[2].valueOf()) && (countNextLast[0].valueOf() != 0); i++) {
            td.bank.bankPaymentAdvice.call(i)
            .then(function(log) {
                if (log[3].valueOf() != 0) {
                    console.log(
                        adviceType[log[0].valueOf()] + '   ' + 
                        log[1].valueOf() + '   ' + 
                        (log[2] + "                            ").substr(0, 12) + '   ' + 
                        miscFunc.formatNr(log[3].valueOf(), true, 15) + '   ' +
                        miscFunc.shortenHash(log[4].valueOf())
                    );
                }
            });
        }
    });
}

//event LogBond(bytes32 indexed bondHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
exports.printBondLogs = function(_bondHash, _owner, _info) {
    // Array to store the Bond states
    var bondState = [   'Created                  ', 'SecuredBondPrincipal     ', 'SecuredReferenceBond     ', 
                        'Signed                   ', 'Issued                   ', 'LockedReferenceBond      ',
                        'Defaulted                ', 'Matured                  '];
    // Print bond transaction log
    return miscFunc.getEventsPromise(td.bond.LogBond({ bondHash: _bondHash, owner: _owner, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        console.log('');
        if ((_bondHash == null) && (_owner == null) && (_info == null))
            console.log('Bond: ' + '--- all logs ---');
        else {
            var msg = 'Bond: ';
            if (_bondHash != null) msg = msg + 'Hash is ' + _bondHash + '   ';
            if (_owner != null)  msg = msg + 'Owner is ' + _owner + '   ';
            if (_info != null)  msg = msg + 'Info is ' + _info;
            console.log(msg);
        }
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var hashPrint;
            var statePrint;
            var infoPrint;
            
            if (parseInt(logs[i].args.bondHash) == 0) {
                hashPrint =  '-            ';
                statePrint = '-                        ';
                infoPrint = miscFunc.hexToAscii(logs[i].args.info, 22);
            }
            else {
                hashPrint = miscFunc.shortenHash(logs[i].args.bondHash);
                statePrint = bondState[parseInt(logs[i].args.state)];
                if ((parseInt(logs[i].args.state) == 2) || (parseInt(logs[i].args.state) == 5))
                    infoPrint = '         ' + miscFunc.shortenHash(logs[i].args.info);
                else if (parseInt(logs[i].args.state) == 3)
                    infoPrint = miscFunc.formatNr(parseInt(logs[i].args.info), false, 22, false, true);
                else if (parseInt(logs[i].args.state) == 4)
                    infoPrint = '   ' + miscFunc.getLocalDateStringFromEpoch(parseInt(logs[i].args.info));
                else infoPrint = miscFunc.formatNr(parseInt(logs[i].args.info), true, 22);
            }

            console.log(miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                hashPrint + '   ' +
                statePrint + '   ' +
                infoPrint + '   ' + 
                logs[i].args.owner
                );
        }
        console.log('');
        console.log('');
    });
}

//event LogPolicy(bytes32 indexed policyHash, address indexed owner, bytes32 indexed info, uint timestamp, uint state);
exports.printPolicyLogs = function(_policyHash, _owner, _info) {
    // Array to store the Policy states
    var policyState = [ 'Paused       ', 'Issued       ', 'Lapsed       ', 'Post-Lapsed  ', 'Retired      ' ];
    
    // Print policy transaction log
    return miscFunc.getEventsPromise(td.policy.LogPolicy({ policyHash: _policyHash, owner: _owner, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        console.log('');
        if ((_policyHash == null) && (_owner == null) && (_info == null))
            console.log('Policy: ' + '--- all logs ---');
        else {
            var msg = 'Policy: ';
            if (_policyHash != null) msg = msg + 'Hash is ' + _policyHash + '   ';
            if (_owner != null)  msg = msg + 'Owner is ' + _owner + '   ';
            if (_info != null)  msg = msg + 'Info is ' + _info;
            console.log(msg);
        }
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var hashPrint;
            var statePrint;
            var infoPrint;
            
            if (parseInt(logs[i].args.policyHash) == 0) {
                hashPrint =  '-            ';
                statePrint = '-            ';
                infoPrint = miscFunc.hexToAscii(logs[i].args.info, 22);
            }
            else {
                hashPrint = miscFunc.shortenHash(logs[i].args.policyHash);
                statePrint = policyState[parseInt(logs[i].args.state)];
                if (parseInt(logs[i].args.info) == 0)
                    infoPrint = "                  -   "
                else if (parseInt(logs[i].args.info) < (Math.pow(10, 18)))
                    infoPrint = miscFunc.formatNr(parseInt(logs[i].args.info), false, 22, false, true);
                else 
                    infoPrint = '         ' + miscFunc.shortenHash(logs[i].args.info);
            }

            console.log(miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                hashPrint + '   ' +
                statePrint + '   ' +
                infoPrint + '   ' + 
                logs[i].args.owner
                );
        }
        console.log('');
        console.log('');
    });
}

//event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);
exports.printAdjustorLogs = function(_adjustorHash, _owner, _info) {
    // Print adjustor transaction log
    return miscFunc.getEventsPromise(td.adjustor.LogAdjustor({ adjustorHash: _adjustorHash, owner: _owner, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }), 0)
    .then(function(logs) {
        console.log('');
        if ((_adjustorHash == null) && (_owner == null) && (_info == null))
            console.log('Adjustor: ' + '--- all logs ---');
        else {
            var msg = 'Adjustor: ';
            if (_adjustorHash != null) msg = msg + 'Hash is ' + _adjustorHash + '   ';
            if (_owner != null)  msg = msg + 'Owner is ' + _owner + '   ';
            if (_info != null)  msg = msg + 'Info is ' + _info;
            console.log(msg);
        }
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var hashPrint;
            var infoPrint;
            
            if (parseInt(logs[i].args.adjustorHash) == 0) {
                hashPrint =  '-            ';
                infoPrint = miscFunc.hexToAscii(logs[i].args.info, 30);
            }
            else {
                hashPrint = miscFunc.shortenHash(logs[i].args.adjustorHash);
                if (parseInt(logs[i].args.info) == 0)
                    infoPrint = "                  -   "
                else if (parseInt(logs[i].args.info) < (Math.pow(10, 18)))
                    infoPrint = miscFunc.formatNr(parseInt(logs[i].args.info), true, 20, false, true);
                else 
                    infoPrint = '         ' + miscFunc.shortenHash(logs[i].args.info);
            }

            console.log(miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                hashPrint + '   ' +
                logs[i].args.owner  + '   ' +
                infoPrint
                );
        }
        console.log('');
        console.log('');
    });
}

//event LogSettlement(bytes32 indexed settlementHash, bytes32 indexed adjustorHash, bytes32 indexed info, uint timestamp, uint state);
exports.printSettlementLogs = function(_settlementHash, _adjustorHash, _info) {
    // Array to store the Settlement states
    var settlementState = [   'Created        ', 'Processing     ', 'Settled        ', '               '];
    // Print settlement transaction log
    return miscFunc.getEventsPromise(td.settlement.LogSettlement({ settlementHash: _settlementHash, adjustorHash: _adjustorHash, info: _info }, { fromBlock: blockNumberStart, toBlock: "latest" }))
    .then(function(logs) {
        console.log('');
        if ((_settlementHash == null) && (_adjustorHash == null) && (_info == null))
            console.log('Settlement: ' + '--- all logs ---');
        else {
            var msg = 'Settlement: ';
            if (_settlementHash != null) msg = msg + 'Settlement hash is ' + _settlementHash + '   ';
            if (_adjustorHash != null)  msg = msg + 'Adjustor hash is ' + _adjustorHash + '   ';
            if (_info != null)  msg = msg + 'Info is ' + _info;
            console.log(msg);
        }
        console.log('================================================');
        for (var i=0; i<logs.length; i++){
            var infoPrint;
            if (parseInt(logs[i].args.info) == 0)
                infoPrint = '-                             ';
            else if (parseInt(logs[i].args.state) == 0)
                 infoPrint = 'Policy Hash:     ' + miscFunc.shortenHash(logs[i].args.info);
            else infoPrint = 'Document Hash:   ' + miscFunc.shortenHash(logs[i].args.info);
            
            console.log(miscFunc.getLocalDateStringFromEpoch(logs[i].args.timestamp) + '   ' + 
                miscFunc.shortenHash(logs[i].args.settlementHash) + '   ' +
                settlementState[parseInt(logs[i].args.state)] + '   ' + 
                infoPrint + '   ' +
                miscFunc.shortenHash(logs[i].args.adjustorHash)
                );
        }
        console.log('');
        console.log('');
    });
}

exports.getPremiumDay = function(_day) {
    var printStr = miscFunc.formatNr(_day, false, 15, false, false) + "  |  ";
    return td.policy.premiumPerRiskPoint_Fc_Ppm.call(_day, 0)
    .then(function(res) {
        printStr = printStr + miscFunc.formatNr(res.valueOf(), false, 15, false, true);
        return td.policy.premiumPerRiskPoint_Fc_Ppm.call(_day, 1);
    })
    .then(function(res) {
        printStr = printStr + miscFunc.formatNr(res.valueOf(), false, 15, false, true);
        return td.policy.premiumPerRiskPoint_Fc_Ppm.call(_day, 2);
    })
    .then(function(res) {
        printStr = printStr + miscFunc.formatNr(res.valueOf(), false, 15, false, true);
        return td.policy.premiumPerRiskPoint_Fc_Ppm.call(_day, 3);
    })
    .then(function(res) {
        printStr = printStr + miscFunc.formatNr(res.valueOf(), false, 15, false, true);
        return td.policy.premiumPerRiskPoint_Fc_Ppm.call(_day, 4);
    })
    .then(function(res) {
        printStr = printStr + miscFunc.formatNr(res.valueOf(), false, 15, false, true);
        return printStr;
    });
}

exports.printPremiums = function() {
    var _day = td.currentPoolDay;
    var header = "        Day      |" + 
        miscFunc.formatNr(0, false, 15, false, false) + 
        miscFunc.formatNr(1, false, 15, false, false) + 
        miscFunc.formatNr(2, false, 15, false, false) + 
        miscFunc.formatNr(3, false, 15, false, false) + 
        miscFunc.formatNr(4, false, 15, false, false);

    return printLogFiles.getPremiumDay(_day)
    .then(function(res) { 
        console.log(header); 
        console.log("-----------------|--------------------------------------------------------------------------");
        console.log(res); 
        _day--; 
        return printLogFiles.getPremiumDay(_day); 
    })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res); _day--; return printLogFiles.getPremiumDay(_day); })
    .then(function(res) { console.log(res);});
}
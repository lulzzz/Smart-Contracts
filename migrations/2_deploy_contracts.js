/**
 * @description Deployment script and intialisation of the Insurance Pool ecosystem
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

// Load the artifacts of the contracts that are deployed
var abiLib = artifacts.require("./Lib.sol");
var abiHashMapI = artifacts.require("./HashMapI.sol");

var abiTrust = artifacts.require("./Trust.sol");
var abiPool = artifacts.require("./Pool.sol");
var abiBond = artifacts.require("./Bond.sol");
var abiBank = artifacts.require("./Bank.sol");
var abiPolicy = artifacts.require("./Policy.sol");
var abiSettlement = artifacts.require("./Settlement.sol");
var abiAdjustor = artifacts.require("./Adjustor.sol");
var abiTimer = artifacts.require("./Timer.sol");

// Contract instance variables
var trustContract;
var poolContract;
var bondContract;
var bankContract;
var policyContract;
var settlementContract;
var adjustorContract;
var timerContract;

// Insurance pool deployment variables
var isWinterTime = false;

// Start deployment of the contracts
module.exports = function(deployer, network) {

    // Deploying the Library
    deployer.deploy(abiLib);

    // Linking the library to the contracts that need to be deployed next and depend on it
    deployer.link(abiLib, abiHashMapI);
    deployer.link(abiLib, abiTrust);
    deployer.link(abiLib, abiPool);
    deployer.link(abiLib, abiBond);
    deployer.link(abiLib, abiBank);
    deployer.link(abiLib, abiPolicy);
    deployer.link(abiLib, abiSettlement);
    deployer.link(abiLib, abiAdjustor);
    deployer.link(abiLib, abiTimer);

    // Deploy the Trust contract
    return deployer.deploy(abiTrust)
    .then(function() { return abiTrust.deployed();
    }).then(function(instance) { trustContract = instance;

        // Deploy the pool contract
        return deployer.deploy(abiPool, trustContract.address);
    }).then(function() { return abiPool.deployed();
    }).then(function(instance) { poolContract = instance;

        // Deploy the Bond contract
        return deployer.deploy(abiBond, trustContract.address);
    }).then(function() { return abiBond.deployed();
    }).then(function(instance) { bondContract = instance;

        // Deploy the Bank contract
        return deployer.deploy(abiBank, trustContract.address);
    }).then(function() { return abiBank.deployed();
    }).then(function(instance) { bankContract = instance;

        // Deploy the Policy contract
        return deployer.deploy(abiPolicy, trustContract.address);
    }).then(function() { return abiPolicy.deployed();
    }).then(function(instance) { policyContract = instance;

        // Deploy the Settlement contract
        return deployer.deploy(abiSettlement, trustContract.address);
    }).then(function() { return abiSettlement.deployed();
    }).then(function(instance) { settlementContract = instance;
        
        // Deploy the Adjustor contract
        return deployer.deploy(abiAdjustor, trustContract.address);
    }).then(function() { return abiAdjustor.deployed();
    }).then(function(instance) { adjustorContract = instance;

        // Deploy the Timer contract
        return deployer.deploy(abiTimer, trustContract.address);
    }).then(function() { return abiTimer.deployed();
    }).then(function(instance) { timerContract = instance;
        
        // Initialise pool ecosystem; Link all contracts together and set next overnight processing timestamp
        return trustContract.initEcosystem(
            poolContract.address,
            bondContract.address,
            bankContract.address, 
            policyContract.address, 
            settlementContract.address, 
            adjustorContract.address, 
            timerContract.address, 
            isWinterTime
        );
        return 0;

    }).then(function(instance) {
        // Print all the references for POSTMAN copy past
        console.log("");
        console.log("");
        console.log("Copy and paste the blow content into POSTMAN");
        console.log("--------------------------------------------");
        // console.log("url:http://localhost:5000");
        console.log("TrustContractAdr:" + trustContract.address);
        console.log("PoolContractAdr:" + poolContract.address);
        console.log("BondContractAdr:" + bondContract.address);
        console.log("BankContractAdr:" + bankContract.address);
        console.log("PolicyContractAdr:" + policyContract.address);
        console.log("SettlementContractAdr:" + settlementContract.address);
        console.log("AdjustorContractAdr:" + adjustorContract.address);
        console.log("TimerContractAdr:" + timerContract.address);
        console.log("");
    });
};
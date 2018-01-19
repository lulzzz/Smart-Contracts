/**
 * @description Adjustor contract
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

pragma solidity ^0.4.18;

import "./Lib.sol";
import "./SetupI.sol";
import "./IntAccessI.sol";
import "./HashMapI.sol";


/** @title Adjustor contract*/
contract Adjustor is SetupI, IntAccessI, HashMapI {

    struct AdjustorData {
        // Index of this Adjustor
        uint adjustorIdx;
        // Access key / password of the Adjustor
        address adjustorAdr;
        // The amount this adjustor is authorised to approve without requiring counter signing by another adjustor (can be 0)
        uint settlementApprovalAmount_Fc;
        // The risk point limit this adjustor is authorised to create policies up to (can be 0)
        uint policyRiskPointLimit;
        // The hash of the adjustor's service agreement with the insurance pool
        bytes32 serviceAgreementHash;
    }

    // Storage mapping for all the adjustor data Hash of the Adjustor points to its data
    mapping(bytes32 => AdjustorData) public dataStorage;

    // Events broadcasted by the Adjustor / Log events
    event LogAdjustor(bytes32 indexed adjustorHash, address indexed owner, bytes32 indexed info, uint timestamp);

    /**@dev Constructor of the  Adjustor.
     * @param _trustAdr The address of the Trust.
     */
    function Adjustor(address _trustAdr) IntAccessI(_trustAdr) public {
    }

    /**@dev Creates an new adjustor with the requested details - can only be called by the Trust
     * @param _adjustorAdr Address/public key of the adjustor authorising the adjustor to submitt and process settlements
     * @param _settlementApprovalAmount_Fc The amount this adjustor is authorised to process settlements
     * @param _policyRiskPointLimit The risk point limit this adjustor is authorised to underwrite policies
     * @param _serviceAgreementHash The hash of the new service agreement
     */
    function createAdjustor(address _adjustorAdr, uint _settlementApprovalAmount_Fc, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
        public
        isTrustAuth
    {
        // Ensure the adjustor details provided are valid
        require(_adjustorAdr != 0x0);
        // An adjustor needs to be either able to approve settlements or underwrite policies but can potentially also do both
        require((_settlementApprovalAmount_Fc != 0) || (_policyRiskPointLimit != 0));
        // A valid service agreement hash has to be provided
        require(_serviceAgreementHash != 0x0);

		// Create a new Adjustor hash by using random input parameters
        bytes32 adjustorHash = keccak256(hashMap.nextIdx, address(this), _adjustorAdr);

        // Add the adjustor data to the data storage
        dataStorage[adjustorHash] = AdjustorData({
            // Specify the hashMap.nextIdx as the index for this new adjustor
            adjustorIdx: hashMap.nextIdx,
            // Save the address of the adjustor
            adjustorAdr: _adjustorAdr,
            // Save the settlement approval amount
            settlementApprovalAmount_Fc: _settlementApprovalAmount_Fc,
            // Save the risk point limit
            policyRiskPointLimit: _policyRiskPointLimit,
            // Save the service agreement hash
            serviceAgreementHash: _serviceAgreementHash
        });

        // Add the adjustor to the Hash map
        hashMap.add(adjustorHash);

        // Add log entry to document creation of adjustor
        LogAdjustor(adjustorHash, _adjustorAdr, bytes32(_settlementApprovalAmount_Fc), now);
        LogAdjustor(adjustorHash, _adjustorAdr, bytes32(_policyRiskPointLimit), now);
        LogAdjustor(adjustorHash, _adjustorAdr, _serviceAgreementHash, now);
    }

    /**@dev Updates an adjustor with the requested details - can only be called by the Trust
     * @param _adjustorHash Hash of the adjustor that needs to be updated
     * @param _adjustorAdr Address/public key of the adjustor authorising the adjustor to submitt and process settlements
     * @param _settlementApprovalAmount_Fc The amount this adjustor is authorised to process settlements
     * @param _policyRiskPointLimit The risk point limit this adjustor is authorised to underwrite policies
     * @param _serviceAgreementHash The hash of the new service agreement
     */
    function updateAdjustor(bytes32 _adjustorHash, address _adjustorAdr, uint _settlementApprovalAmount_Fc, uint _policyRiskPointLimit, bytes32 _serviceAgreementHash)
        public
        isTrustAuth
    {
        // Ensure the adjustorHash provided exists and belongs to an active adjustor
        require(hashMap.isActive(_adjustorHash) == true);

        // Ensure the adjustor details provided are valid
        require(_adjustorAdr != 0x0);
        // An adjustor needs to be either able to approve settlements or underwrite policies but can potentially also do both
        require((_settlementApprovalAmount_Fc != 0) || (_policyRiskPointLimit != 0));
        // A valid service agreement hash has to be provided
        require(_serviceAgreementHash != 0x0);

        // Upate the adjustor data
        dataStorage[_adjustorHash].adjustorAdr = _adjustorAdr;
        dataStorage[_adjustorHash].settlementApprovalAmount_Fc = _settlementApprovalAmount_Fc;
        dataStorage[_adjustorHash].policyRiskPointLimit = _policyRiskPointLimit;
        dataStorage[_adjustorHash].serviceAgreementHash = _serviceAgreementHash;

        // Add log entry to document update of the adjustor
        LogAdjustor(_adjustorHash, _adjustorAdr, bytes32(_settlementApprovalAmount_Fc), now);
        LogAdjustor(_adjustorHash, _adjustorAdr, bytes32(_policyRiskPointLimit), now);
        LogAdjustor(_adjustorHash, _adjustorAdr, _serviceAgreementHash, now);
    }

    /**@dev Retires an adjustor
     * @param _adjustorHash Hash of the adjustor that needs to be retired
     */
    function retireAdjustor(bytes32 _adjustorHash)
        public
        isTrustAuth
    {
        // Ensure the adjustorHash provided exists and belongs to an active adjustor
        require(hashMap.isActive(_adjustorHash) == true);

        // Upate the adjustor data
        dataStorage[_adjustorHash].adjustorAdr = 0x0;
        dataStorage[_adjustorHash].policyRiskPointLimit = 0;
        dataStorage[_adjustorHash].settlementApprovalAmount_Fc = 0;

        // Archive the adjustor
        hashMap.archive(_adjustorHash);

        // Add log entry to document update of the adjustor
        LogAdjustor(_adjustorHash, 0x0, bytes32(0), now);
    }

    // *******************************
    // *** Miscellaneous functions
    // *******************************
    
    /**@dev Verifies if the specified adjustor is authorised to approve the requested settlement amount
     * @param _hash Hash of the adjustor used
     * @param _adr Signing address used for this transaction
     * @param _approvalAmount The settling amount that needs to be approved
     * @return True if hash, signing address and the amount all match an adjustor stored in this contract
     */
    function isAdjustorSettlementPermissioned(bytes32 _hash, address _adr, uint _approvalAmount) public constant returns (bool) {
        // Adjustor hash needs to be active and provided address needs to match the adjustor's signing address
        // The adjustors settlement approval amount needs to be set and it needs to be greater or equal to the specified approval amount
        return ((isActive(_hash) == true) && (dataStorage[_hash].adjustorAdr == _adr) && 
            (dataStorage[_hash].settlementApprovalAmount_Fc > 0) && (dataStorage[_hash].settlementApprovalAmount_Fc >= _approvalAmount));
    }

    /**@dev Verifies if the specified adjustor is authorised to underwrite the requrested policy risk points
     * @param _hash Hash of the adjustor used
     * @param _adr Signing address used for this transaction
     * @param _policyRiskPoints The requested risk points to be underwritten by this adjustor
     * @return True if hash, signing address and the risk point amount all match an adjustor stored in this contract
     */
    function isAdjustorPolicyPermissioned(bytes32 _hash, address _adr, uint _policyRiskPoints) public constant returns (bool) {
        // Adjustor hash needs to be active and the provided address needs to match the adjustor's signing address and
        // The adjustors risk point limit needs to be set and the risk points needs to be greater or equal to the specified risk points
        return ((isActive(_hash) == true) && (dataStorage[_hash].adjustorAdr == _adr) && 
            (dataStorage[_hash].policyRiskPointLimit > 0) && (dataStorage[_hash].policyRiskPointLimit >= _policyRiskPoints));
    }
}
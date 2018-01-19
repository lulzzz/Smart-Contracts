/**
 * @description Notification Interface
 * @copyright (c) 2017 Honest Insurance
 * @author Martin Stellnberger
 * @license GPL-3.0
 */

pragma solidity ^0.4.18;


/** @title Insurance Pool's Notification Interface */
interface NotificationI {
    function ping(uint8 _subject, bytes32 _message, uint _scheduledDateTime) public returns (uint);
}
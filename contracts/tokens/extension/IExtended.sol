//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IExtended
{
    function mint() external returns(uint256);
    function mint(uint256) external returns(uint256);
}
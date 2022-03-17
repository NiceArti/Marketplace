//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./extension/IExtended.sol";


contract Token1155 is ERC1155, Ownable, IExtended
{
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;
    
    /// @dev Base token URI used as a prefix by tokenURI().
    string public baseTokenURI;

    constructor() ERC1155("")
    {
        currentTokenId.increment();
        _mint(msg.sender, currentTokenId.current(), 1, "");
    }

    function mint()
        external
        override
        onlyOwner
        returns(uint256)
    {
        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _mint(msg.sender, newItemId, 1, "");

        return newItemId;
    }

    function mint(uint256 amount)
        external
        override
        onlyOwner
        returns(uint256)
    {
        currentTokenId.increment();
        uint256 newID = currentTokenId.current();
        _mint(msg.sender, newID, amount, "");

        return newID;
    }
}
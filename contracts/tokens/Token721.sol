//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./extension/IExtended.sol";

contract Token721 is ERC721, Ownable, IExtended
{
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;


    constructor(
        string memory name, 
        string memory symbol
    ) ERC721(name, symbol)
    {
        currentTokenId.increment();
        _mint(msg.sender, currentTokenId.current());
    }

    function mint()
        external 
        override
        onlyOwner
        returns(uint256)
    {
        currentTokenId.increment();
        uint256 newId = currentTokenId.current();
        _mint(msg.sender, newId);

        return newId;
    }


    function mint(uint256 id)
        external
        override
        onlyOwner
    returns(uint256)
    {
        _safeMint(msg.sender, id);
        return id;
    }
}
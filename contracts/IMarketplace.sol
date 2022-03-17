//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IMarketplace
{
    /// @notice - creates ERC721 nft token inside the contract.
    /// @notice - Item is not in creator balance
    function createItem721() external;


    /// @notice - creates ERC1155 nft token inside the contract.
    /// @notice - Item is not in creator balance
    /// @param amount - value of tokens that user wants to create
    function createItem1155(uint256 amount) external;
    
    /// @notice - list item for ERC20 currency
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param tokenToBuy - currency for whitch item can be selled
    /// @param price - set price of item. Be careful with the price
    /// @param amount - amount of NFT for listing for ERC721 always will be 1
    function listItem(
        address item,
        uint256 itemID,
        address tokenToBuy,
        uint256 price,
        uint256 amount) external;

    /// @notice - list item for native blockchain currency
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param price - set price of item. Be careful with the price
    /// @param amount - amount of NFT for listing for ERC721 always will be 1
    function listItemETH(
        address item,
        uint256 itemID,
        uint256 price,
        uint256 amount
    ) external;

    /// @notice - cancels listing whenever owner wants
    /// @notice - only owner can cancel listing
    /// @param item - item of nft that must be canceled
    /// @param itemID - id of nft for cancel
    function cancelListing(
        address item,
        uint256 itemID
    ) external;


    /// @notice - buy listed item
    /// @param item - nft token that can be bought from listing or auction
    /// @param itemID - id of nft for buying
    function buyItem(address item, uint256 itemID) external payable;


    /// @notice - creates auction
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param tokenToBuy - currency for whitch item can be selled
    /// @param price - set price of item. Be careful with the price
    /// @param amount - amount of NFT for listing for ERC721 always will be 1
    /// @param minBid - min bid to win prize
    function listItemOnAuction(
        address item,
        uint256 itemID,
        address tokenToBuy, 
        uint256 price, 
        uint256 amount,
        uint256 minBid
    ) external;


    /// @notice - users can make bids to win prize
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param bid - next bid, must be > last bid
    function makeBid(
        address item, 
        uint256 itemID, 
        uint256 bid
    ) external;


    /// @notice - only item owner can cancel auction
    /// @param item - nft address to cancel auction
    /// @param itemID - id of auction nft
    function cancelAuction(
        address item,
        uint256 itemID
    ) external;


    /// @notice - winner can get it's prize
    /// @param item - nft address to cancel auction
    /// @param itemID - id of auction nft
    function getAuctionItem(
        address item,
        uint256 itemID
    ) external;


    /// @notice - if u don't want to list item in this marketplace or move to other
    /// using this function u can receive item back
    /// @param item - nft address to cancel auction
    /// @param itemID - id of auction nft
    function getMyItem(address item,uint256 itemID) external;


    event ItemCreated(address indexed account, uint256 amount, uint256 id);
    event ItemListed(address indexed account, uint256 amount, address indexed item, uint256 id, uint256 price, bool buyWithNative);
    event ListingCanceled(address indexed account, address indexed item, uint256 id);
    event AuctionBid(address indexed account, uint256 bid, address indexed item, uint256 id);
    event ItemBuyed(address indexed account, uint256 price, address indexed item, uint256 id);
    event ItemRevoked(address indexed account, address indexed item, uint256 id);
}
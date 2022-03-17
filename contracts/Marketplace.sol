//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";


import "./tokens/Token721.sol";
import "./tokens/Token1155.sol";
import "./IMarketplace.sol";



contract Marketplace is ReentrancyGuard, ERC1155Holder, IMarketplace
{
    using SafeERC20 for IERC20;

    struct AuctionInfo
    {
        address lastBidder;     // user who made last max bid
        uint256 lastBid;        // current max bid of this auction
        uint256 endTime;        // time when auction will be ended
        uint256 bidMinStandard; // minimum price of bid that can be set
    }

    struct GeneralInfo
    {
        address owner;
        address tokenToBuy;
        uint256 price;
        uint256 amount;
        bool isInternal;
        bool sellForNative;
        bool listed;
    }

    // 0.0001 in currency
    uint256 public constant STANDARD_MIN_BID = 100000000000000;

    // 1 in currency
    uint256 public constant MAX_MIN_BID = 1000000000000000000;

    // three days in seconds
    uint256 private constant THREE_DAYS = 259200;

    // id for eip-721 standard
    bytes4 private constant ERC721_ID = 0x80ac58cd;

    // id for eip-1155 standard
    bytes4 private constant ERC1155_ID = 0xd9b67a26;

    address public immutable erc721;
    address public immutable erc1155;

    mapping(address => mapping(uint256 => GeneralInfo)) public generalInfo;
    mapping(address => mapping(uint256 => AuctionInfo)) public auctionInfo;


    modifier onlyItemOwner(address item, uint256 itemID)
    {
        require(generalInfo[item][itemID].owner == msg.sender, "Marketplace: not owner");
        _;
    }


    constructor(
        address erc721_,
        address erc1155_)
    {
        erc721 = erc721_;
        erc1155 = erc1155_;
    }


    /*************** startregion Creation ***************/
    
    /// @notice - creates ERC721 nft token inside the contract.
    /// @notice - Item is not in creator balance
    function createItem721() external override
    {
        uint id = IExtended(erc721).mint();
        
        generalInfo[erc721][id].owner = msg.sender;
        generalInfo[erc721][id].amount = 1;
        generalInfo[erc721][id].isInternal = true;

        emit ItemCreated(msg.sender, 1, id);
    }

    /// @notice - creates ERC1155 nft token inside the contract.
    /// @notice - Item is not in creator balance
    /// @param amount - value of tokens that user wants to create
    function createItem1155(uint256 amount) external override
    {
        uint id = IExtended(erc1155).mint(amount);
        
        generalInfo[erc1155][id].owner = msg.sender;
        generalInfo[erc1155][id].amount = amount;
        generalInfo[erc1155][id].isInternal = true;

        emit ItemCreated(msg.sender, amount, id);
    }

    /*************** endregion Creation ***************/




    /*************** startregion Listing ***************/
    
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
        uint256 amount) external override
    {
        require(tokenToBuy != address(0));
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        _listItem(item, itemID, tokenToBuy, price, amount);

        
        emit ItemListed(msg.sender, generalInfo[item][itemID].amount, item, itemID, price, false);
    }


    /// @notice - list item for native blockchain currency
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param price - set price of item. Be careful with the price
    /// @param amount - amount of NFT for listing for ERC721 always will be 1
    function listItemETH(
        address item,
        uint256 itemID,
        uint256 price,
        uint256 amount) external override
    {
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        _listItem(item, itemID, address(0), price, amount);

        emit ItemListed(msg.sender, generalInfo[item][itemID].amount, item, itemID, price, true);
    }


    /// @notice - cancels listing whenever owner wants
    /// @notice - only owner can cancel listing
    /// @param item - item of nft that must be canceled
    /// @param itemID - id of nft for cancel
    function cancelListing(
        address item,
        uint256 itemID
    ) external override onlyItemOwner(item, itemID)
    {
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        require(generalInfo[item][itemID].listed == true, "Marketplace: item has not already been listed yet");

        _cancelListing(item, itemID);

        emit ListingCanceled(msg.sender, item, itemID);
    }


    /// @notice - buy listed item
    /// @param item - nft token that can be bought from listing or auction
    /// @param itemID - id of nft for buying
    function buyItem(address item, uint256 itemID)
        external
        override
        payable
        nonReentrant
    {
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        require(generalInfo[item][itemID].listed == true, "Marketplace: an NFT is not listed yet");
        
        emit ItemBuyed(msg.sender, generalInfo[item][itemID].price, item, itemID);

        _buyItem(item, itemID);
    }

    /*************** endregion Listing ***************/




    /*************** startregion Auction ***************/

    function listItemOnAuction(
        address item,
        uint256 itemID,
        address tokenToBuy, 
        uint256 price, 
        uint256 amount,
        uint256 minBid
    ) external override
    {
        require(tokenToBuy != address(0));
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        _listItem(item, itemID, tokenToBuy, price, amount);

        uint256 currentTime = block.timestamp;
        uint256 endTime = currentTime + THREE_DAYS;

        auctionInfo[item][itemID] = AuctionInfo(msg.sender, price, endTime, _setMin(minBid));

        emit ItemListed(msg.sender, generalInfo[item][itemID].amount, item, itemID, price, true);
    }


    function makeBid(
        address item, 
        uint256 itemID, 
        uint256 bid
    ) external override
    {
        require(_isNonFungibleToken(item), "Marketplace: address in not an NFT token");
        require(block.timestamp <= auctionInfo[item][itemID].endTime, "Marketplace: auction is ended");
        
        uint256 rebid = auctionInfo[item][itemID].bidMinStandard + auctionInfo[item][itemID].lastBid;
        require(rebid <= bid, "Marketplace: min bid must be higher");

        auctionInfo[item][itemID].lastBid = bid;
        auctionInfo[item][itemID].lastBidder = msg.sender;

        emit AuctionBid(msg.sender, bid, item, itemID);
    }


    /// @notice - only item owner can cancel auction
    function cancelAuction(
        address item,
        uint256 itemID
    ) external override onlyItemOwner(item, itemID)
    {
        require(block.timestamp <= auctionInfo[item][itemID].endTime, "Marketplace: auction is ended");
        
        _cancelListing(item, itemID);
        auctionInfo[item][itemID] = AuctionInfo(address(0), 0, 0, 0);

        emit ListingCanceled(msg.sender, item, itemID);
    }


    function getAuctionItem(
        address item,
        uint256 itemID
    ) external override nonReentrant
    {
        require(auctionInfo[item][itemID].endTime < block.timestamp, "Marketplace: auction is not ended yet");
        require(auctionInfo[item][itemID].lastBidder == msg.sender, "Marketplace: not auction winner");
        
        uint256 lastPrice = auctionInfo[item][itemID].lastBid;
        generalInfo[item][itemID].price = lastPrice;
        
        emit ItemBuyed(msg.sender, lastPrice, item, itemID);

        _buyItem(item, itemID);
        auctionInfo[item][itemID] = AuctionInfo(address(0), 0, 0, 0);
    }

    /*************** endregion Auction ***************/





    function getMyItem(
        address item,
        uint256 itemID
    ) 
        external
        override
        onlyItemOwner(item, itemID)
        nonReentrant
    {
        require(generalInfo[item][itemID].amount > 0, "Marketplace: item is not in marketplace");
        require(generalInfo[item][itemID].listed == false, "Marketplace: item is listed");
        require(_isNonFungibleToken(item), "Marketplace: item is listed");

        if (IERC1155(item).supportsInterface(ERC1155_ID))
        {
            IERC1155(item).safeTransferFrom(address(this), msg.sender, itemID, generalInfo[item][itemID].amount, "");
            return ;
        }

        IERC721(item).safeTransferFrom(address(this), msg.sender, itemID);

        emit ItemRevoked(msg.sender, item, itemID);
    }



    /// @notice - low level function of item listing
    /// @param item - nft address that will be listed
    /// @param itemID - id of listing nft
    /// @param tokenToBuy - currency for whitch item can be selled.
    ///     @notice - address(0) here means item is listed for native currency e.g. (ETH)
    /// @param price - set price of item. Be careful with the price
    /// @param amount - amount of NFT for listing for ERC721 always will be 1
    function _listItem(
        address item,
        uint256 itemID,
        address tokenToBuy, 
        uint256 price, 
        uint256 amount
    ) internal
    {
        // item mustnt be listed before
        require(generalInfo[item][itemID].listed == false, "Marketplace: item has already been listed");


        // save from zero
        if(amount == 0 || IERC721(item).supportsInterface(ERC721_ID)) 
            amount = 1;

        // if token was created with this contract do...
        if (generalInfo[item][itemID].isInternal == false)
        {
            if(IERC721(item).supportsInterface(ERC721_ID))
            {
                IERC721(item).transferFrom(msg.sender, address(this), itemID);
            }
            else if(IERC1155(item).supportsInterface(ERC1155_ID))
            {
                IERC1155(item).safeTransferFrom(msg.sender, address(this), itemID, amount, "");
            }

            generalInfo[item][itemID].owner = msg.sender;
        }
        require(generalInfo[item][itemID].owner == msg.sender, "Marketplace: not owner");


        // remember listing data
        generalInfo[item][itemID].listed = true;
        generalInfo[item][itemID].tokenToBuy = tokenToBuy;
        generalInfo[item][itemID].price = price * amount;
        generalInfo[item][itemID].amount = amount;
        generalInfo[item][itemID].sellForNative = (tokenToBuy == address(0)) ? true : false;
    }


    /// @notice - low-level function for canceling listing items
    /// @param item - item of nft that must be canceled
    /// @param itemID - id of nft for cancel
    function _cancelListing(address item, uint256 itemID) internal
    {
        generalInfo[item][itemID].listed = false;
        generalInfo[item][itemID].price = generalInfo[item][itemID].amount = 0;


        // check if not listed or if sell not for native
        if(generalInfo[item][itemID].tokenToBuy != address(0))
            generalInfo[item][itemID].tokenToBuy = address(0);
    }


    /// @notice - low level function for buying item
    /// It allows to buy from auction/listing using
    /// native currency or ERC20 token setted by owner
    /// @param item - nft token that can be bought from listing or auction
    /// @param itemID - id of nft for buying
    function _buyItem(
        address item,
        uint256 itemID
    ) internal
    {
        if(generalInfo[item][itemID].sellForNative == false) {
            IERC20(generalInfo[item][itemID].tokenToBuy)
            .safeTransferFrom(
                msg.sender,
                generalInfo[item][itemID].owner,
                generalInfo[item][itemID].price
            );
        } else {
            require(msg.value == generalInfo[item][itemID].price, "Marketplace: price and value are different");
            (bool success, ) = payable(generalInfo[item][itemID].owner).call{value: generalInfo[item][itemID].price}("");
            require(success == true, "Marketplace: Failed to send currency");
        }

        generalInfo[item][itemID].owner = msg.sender;
        _cancelListing(item, itemID);
    }


    /// @notice - check-function. It checks if address is an NFT, 
    /// in the other hand it reverts error an message
    function _isNonFungibleToken(address token) internal view returns(bool)
    {
        if (IERC1155(token).supportsInterface(ERC1155_ID))
            return true;

        return IERC721(token).supportsInterface(ERC721_ID);
    }


    /// @notice - sets the right min amount  
    /// @param value - value of min bid
    function _setMin(uint256 value) private pure returns(uint256)
    {
        return (value <= STANDARD_MIN_BID) ? STANDARD_MIN_BID : 
                ((value >= MAX_MIN_BID) ? MAX_MIN_BID : value);
    }
}

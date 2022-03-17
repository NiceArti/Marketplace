# Marketplace contract


Link to deployed contract: [link](https://kovan.etherscan.io/address/0x500B948C98565a0D9952994D4a7821268Be8EEB8)


- Contract address: 0x500B948C98565a0D9952994D4a7821268Be8EEB8
- Token address 721: 0x92113478D664C30144E66AE40f099722523a42D4
- Token address 1155: 0x6D6194d311fFaFC17c6FA9c74B6cEb8114A1b8Db


- OpenZeppelin library: [link](https://github.com/OpenZeppelin/openzeppelin-contracts)



## Try running some of the following tasks:

| Task | Description |
| --- | --- |
| `npx hardhat createItem721 --network kovan` | creates ERC721 nft token inside the contract |
| `npx hardhat createItem1155 --amount some_amount --network kovan` | creates ERC1155 nft token inside the contract |
| `npx hardhat listItem --item some_address --item-id some_id --tokenToBuy some_address --price some_price --amount some_amount --network kovan` | list item for ERC20 currency |
| `npx hardhat listItemETH --item some_address --item-id some_id --price some_price --amount some_amount --network kovan` | list item for Native currency |
| `npx hardhat cancelListing --item some_address --item-id some_id --network kovan` | cancels listing whenever owner wants |
| `npx hardhat buyItem --item some_address --item-id some_id --network kovan` | buy listed item |
| `npx hardhat listItemOnAuction --item some_address --item-id some_id --tokenToBuy some_address --price some_price --amount some_amount --min-bid some_value --network kovan` | creates auction |
| `npx hardhat makeBid --item some_address --item-id some_id --bid some_value --network kovan` | users can make bids to win prize |
| `npx hardhat cancelAuction --item some_address --item-id some_id --network kovan` | only item owner can cancel auction |
| `npx hardhat getAuctionItem --item some_address --item-id some_id --network kovan` | winner can get it's prize |
| `npx hardhat getMyItem --item some_address --item-id some_id --network kovan` | if user don't want to list item in this marketplace or move to other |
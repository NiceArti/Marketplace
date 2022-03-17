import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ethers, waffle } from "hardhat";

describe("Marketplace", () => 
{
  const ZERO_ADDRESS: String = '0x0000000000000000000000000000000000000000'
  let owner: any, acc1: any;
  let instance: any;
  let token: any, token721: any, token1155: any;
  
  // For Marketplace
  let generalInfo;
  let auctionInfo;
  const price = 10000

  function toDay(time: BigNumber)
  {
    let currentTime = Date.now() / 1000
    let day = time.sub(currentTime.toFixed()).div(3600 * 24)
    return day
  }

  beforeEach(async () => 
  {
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const Token721 = await ethers.getContractFactory("Token721");
    const Token1155 = await ethers.getContractFactory("Token1155");
    const Token = await ethers.getContractFactory("Token");

    // create accounts
    [owner, acc1] = await ethers.getSigners();

    token721 = await Token721.deploy('Marketplace','MKTP');
    token1155 = await Token1155.deploy();
    token = await Token.deploy();
    
    // wait token deployment
    await token721.deployed();
    await token1155.deployed();
    await token.deployed();


    instance = await Marketplace.deploy(token721.address, token1155.address);
    
    // wait untill staking pool will be deployed
    await instance.deployed();
    

    // make contract to be address of these tokens
    token721.transferOwnership(instance.address)
    token1155.transferOwnership(instance.address)
  });



  
  describe("Create NFT inside the contract", () => 
  {
    it("createItem721(): Should create 721 token", async () => 
    {
      await instance.createItem721()
      generalInfo = await instance.generalInfo(token721.address, 2)

      expect(generalInfo.owner).to.equal(owner.address)
      expect(await token721.ownerOf(2)).to.equal(instance.address)
    })

    it("createItem1155(): Should create 1155 token", async () => 
    {
      await instance.createItem1155(10)
      generalInfo = await instance.generalInfo(token1155.address, 2)

      expect(generalInfo.owner).to.equal(owner.address)
      expect(generalInfo.isInternal).to.equal(true)
      expect(await token1155.balanceOf(instance.address, 2)).to.equal(10)
    })
  })



  let token721v2: any, token1155v2: any;
  describe("Listing", () => 
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await instance.createItem1155(20) // 2
      await instance.connect(acc1).createItem721() // 2, acc1
      await instance.connect(acc1).createItem1155(20) // 2, acc1

      const Token721 = await ethers.getContractFactory("Token721");
      const Token1155 = await ethers.getContractFactory("Token1155");

      token721v2 = await Token721.deploy('Marketplace2','MKTP2');
      token1155v2 = await Token1155.deploy();
    })


    it("listItem(): Should list ERC721 nft", async () => 
    {
      await instance.listItem(token721.address, 2, token.address, price, 1)
      generalInfo = await instance.generalInfo(token721.address, 2)

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("listItem(): Should list ERC1155 nft", async () => 
    {
      await instance.listItem(token1155.address, 2, token.address, price, 10)
      generalInfo = await instance.generalInfo(token1155.address, 2)

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price * 10);
      expect(generalInfo.amount).to.equal(10);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("listItem(): Should list externally owned ERC721 nft", async () =>
    {
      await token721v2.approve(instance.address, 1)
      await instance.listItem(token721v2.address, 1, token.address, price, 1)
  
      generalInfo = await instance.generalInfo(token721v2.address, 1)

      // check if info is right
      expect(generalInfo.owner).to.equal(owner.address);
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("listItem(): Should list externally owned ERC1155 nft", async () =>
    {
      await token1155v2.setApprovalForAll(instance.address, true)
      await instance.listItem(token1155v2.address, 1, token.address, price, 1)
  
      generalInfo = await instance.generalInfo(token1155v2.address, 1)

      // check if info is right
      expect(generalInfo.owner).to.equal(owner.address);
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("listItem(): Should fail if list ERC721 item of other", async () =>
    {
      await token721v2.approve(instance.address, 1)
      await expect(instance.connect(acc1).listItem(token721v2.address, 1, token.address, price, 1))
            .to.be.revertedWith("ERC721: transfer from incorrect owner")
      await expect(instance.connect(acc1).listItem(token721.address, 2, token.address, price, 1))
            .to.be.revertedWith("Marketplace: not owner")
      
    })

    it("listItem(): Should fail if list ERC1155 item of other", async () =>
    {
      await token1155v2.setApprovalForAll(instance.address, true)
      await expect(instance.connect(acc1).listItem(token1155v2.address, 1, token.address, price, 1))
            .to.be.revertedWith("ERC1155: caller is not owner nor approved")
      await expect(instance.connect(acc1).listItem(token1155.address, 2, token.address, price, 1))
            .to.be.revertedWith("Marketplace: not owner")
      
    })

    it("listItem(): Should fail if list ERC721 item twice", async () =>
    {
      await token721v2.approve(instance.address, 1)
      await instance.listItem(token721v2.address, 1, token.address, price, 1)
      await instance.listItem(token721.address, 2, token.address, price, 1)

      await expect(instance.listItem(token721v2.address, 1, token.address, price, 1))
            .to.be.revertedWith("Marketplace: item has already been listed")
      await expect(instance.connect(acc1).listItem(token721.address, 2, token.address, price, 1))
            .to.be.revertedWith("Marketplace: item has already been listed")
      
    })

    it("listItem(): Should fail if list ERC1155 item twice", async () =>
    {
      await token1155v2.setApprovalForAll(instance.address, true)
      await instance.listItem(token1155v2.address, 1, token.address, price, 1)
      await instance.listItem(token1155.address, 2, token.address, price, 1)

      await expect(instance.listItem(token1155v2.address, 1, token.address, price, 1))
            .to.be.revertedWith("Marketplace: item has already been listed")
      await expect(instance.listItem(token1155.address, 2, token.address, price, 1))
            .to.be.revertedWith("Marketplace: item has already been listed")
      
    })
  })


  describe("Cancel listing", () => 
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await instance.createItem1155(20) // 2

      const Token721 = await ethers.getContractFactory("Token721");
      const Token1155 = await ethers.getContractFactory("Token1155");

      token721v2 = await Token721.deploy('Marketplace2','MKTP2');
      token1155v2 = await Token1155.deploy();

      // list items
      await instance.listItem(token721.address, 2, token.address, price, 1)   // list from contract 721
      await instance.listItem(token1155.address, 2, token.address, price, 10) // list from contract 1155
      
      await token721v2.approve(instance.address, 1)
      await instance.listItem(token721v2.address, 1, token.address, price, 1) // list eonft 721
    
      await token1155v2.setApprovalForAll(instance.address, true)
      await instance.listItem(token1155v2.address, 1, token.address, price, 1) // list eonft 1155
    })

    it("cancelListing(): Should cancel listing of ERC721 item created inside contract", async () =>
    {
      await instance.cancelListing(token721.address, 2)
      generalInfo = await instance.generalInfo(token721.address, 2)

      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.amount).to.equal(0);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("cancelListing(): Should cancel listing of ERC1155 item created inside contract", async () =>
    {
      await instance.cancelListing(token1155.address, 2)
      generalInfo = await instance.generalInfo(token1155.address, 2)

      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.amount).to.equal(0);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("cancelListing(): Should cancel listing of ERC721 eoitem", async () =>
    {
      await instance.cancelListing(token721v2.address, 1)
      generalInfo = await instance.generalInfo(token721v2.address, 1)

      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.amount).to.equal(0);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("cancelListing(): Should cancel listing of ERC1155 eoitem", async () =>
    {
      await instance.cancelListing(token1155v2.address, 1)
      generalInfo = await instance.generalInfo(token1155v2.address, 1)

      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.amount).to.equal(0);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("cancelListing(): Should list item after canceling", async () =>
    {
      await instance.cancelListing(token721.address, 2)
      await instance.listItem(token721.address, 2, token.address, price, 1)
      
      generalInfo = await instance.generalInfo(token721.address, 2)

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);
    })
  })


  const minBid = parseUnits('0.1')

  // skip 6 days
  const SIX_DAYS = 259200 * 2
  let timestamp: any = Date.now() / 1000; // time in secconds
  timestamp = parseInt(timestamp)


  describe("Auction", () =>
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await token.transfer(acc1.address, parseUnits('100'))
    })
    
    it("listItemOnAuction(): Should list ERC721 nft", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      
      generalInfo = await instance.generalInfo(token721.address, 2)
      auctionInfo = await instance.auctionInfo(token721.address, 2)

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);

      // check auction info
      expect(auctionInfo.lastBidder).to.equal(owner.address);
      expect(auctionInfo.lastBid).to.equal(price);
      expect(toDay(auctionInfo.endTime)).to.equal(3);
      expect(auctionInfo.bidMinStandard).to.equal(minBid);
    })

    it("makeBid(): Should list ERC721 nft", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      let newBid = parseUnits('10')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)
      
      auctionInfo = await instance.auctionInfo(token721.address, 2)
      
      await expect(auctionInfo.lastBidder).to.equal(acc1.address)
      await expect(auctionInfo.lastBid).to.equal(newBid)
    })

    it("makeBid(): Should fail if new bid less than min", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      
      let newBid = parseUnits('0.2')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)
      
      newBid = parseUnits('0.24')
      await expect(instance.connect(acc1).makeBid(token721.address, 2, newBid))
      .to.be.revertedWith("Marketplace: min bid must be higher")
    })

    it("makeBid(): Should fail if make bid when auction is ended", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      
      let newBid = parseUnits('0.2')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)

      
      await ethers.provider.send('evm_mine', [timestamp += SIX_DAYS]);
      

      newBid = parseUnits('0.5')
      await expect(instance.connect(acc1).makeBid(token721.address, 2, newBid))
      .to.be.revertedWith("Marketplace: auction is ended")
    })

    it("getAuctionItem(): Should get item winner of auction", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)    
      let newBid = parseUnits('0.2')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)
      await ethers.provider.send('evm_mine', [timestamp += SIX_DAYS]);


      await token.connect(acc1).approve(instance.address, newBid)
      await instance.connect(acc1).getAuctionItem(token721.address, 2)
    })

    it("getAuctionItem(): Should fail if call before auction ended", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      let newBid = parseUnits('0.2')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)

      expect(instance.connect(acc1).getAuctionItem(token721.address, 2))
      .to.be.revertedWith('Marketplace: auction is not ended yet')
    })

    it("getAuctionItem(): Should fail if caller is not winner", async () => 
    {
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
      let newBid = parseUnits('0.2')
      await instance.connect(acc1).makeBid(token721.address, 2, newBid)

      expect(instance.getAuctionItem(token721.address, 2))
      .to.be.revertedWith('Marketplace: not auction winner')
    })

  })

  describe("Cancel Auction", () =>
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await instance.listItemOnAuction(token721.address, 2, token.address, price, 1, minBid)
    })
    
    it("cancelAuction(): Should cancel auction", async () => 
    {
      await instance.cancelAuction(token721.address, 2)
      auctionInfo = await instance.auctionInfo(token721.address, 2)
      // check auction info
      expect(auctionInfo.lastBidder).to.equal(ZERO_ADDRESS);
      expect(auctionInfo.lastBid).to.equal(0);
      expect(auctionInfo.endTime).to.equal(0);
      expect(auctionInfo.bidMinStandard).to.equal(0);
    })


    it("cancelAuction(): Should fail if cancel auction afer it's ending", async () => 
    {
      await ethers.provider.send('evm_mine', [timestamp += SIX_DAYS]);
      await expect(instance.cancelAuction(token721.address, 2))
      .to.be.revertedWith("Marketplace: auction is ended")
    })

    it("cancelAuction(): Should fail if not item owner cancel's auction", async () => 
    {
      await expect(instance.connect(acc1).cancelAuction(token721.address, 2))
      .to.be.revertedWith("Marketplace: not owner")
    })

    
  })

  describe("Buy Item listing", () => 
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await instance.createItem1155(20) // 2
      
      await token.transfer(acc1.address, parseUnits('10'))

      // list items
      await instance.listItem(token721.address, 2, token.address, price, 1)   // list from contract 721
      await instance.listItem(token1155.address, 2, token.address, price, 10) // list from contract 1155
    })

    it("buyItem(): Should buy listed item and change owner", async () =>
    {
      await token.connect(acc1).approve(instance.address, price)
      
      let balanceBefore = await token.balanceOf(owner.address)
      await instance.connect(acc1).buyItem(token721.address, 2);
      generalInfo = await instance.generalInfo(token721.address, 2)

      let balanceAfter = await token.balanceOf(owner.address);

      expect(balanceAfter).to.equal(balanceBefore.add(price))
      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.listed).to.equal(false);
      expect(generalInfo.owner).to.equal(acc1.address);
    })

    it("buyItem(): Should list buyed item", async () =>
    {
      await token.connect(acc1).approve(instance.address, price)
      await instance.connect(acc1).buyItem(token721.address, 2)
      await instance.connect(acc1).listItem(token721.address, 2, token.address, price, 1)
      generalInfo = await instance.generalInfo(token721.address, 2)

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(token.address);
      expect(generalInfo.price).to.equal(price);
      expect(generalInfo.amount).to.equal(1);
      expect(generalInfo.sellForNative).to.equal(false);
    })

    it("buyItem(): Should fail if previous owner wants to list item", async () =>
    {
      await token.connect(acc1).approve(instance.address, price)
      await instance.connect(acc1).buyItem(token721.address, 2)
      await expect(instance.listItem(token721.address, 2, token.address, price, 1))
            .to.be.revertedWith("Marketplace: not owner")
    })

    it("buyItem(): Should buy item for ETH", async () =>
    {
      await instance.createItem721() // 3
      await instance.listItemETH(token721.address, 3, price, 1)
      
      
      generalInfo = await instance.generalInfo(token721.address, 3)
      
      // check if in native currency
      expect(generalInfo.sellForNative).to.equal(true);

      const provider = waffle.provider;
      let balanceBefore = await provider.getBalance(owner.address);

      await instance.connect(acc1).buyItem(token721.address, 3, {value: price})
      generalInfo = await instance.generalInfo(token721.address, 3)
      
      let balanceAfter = await provider.getBalance(owner.address);

      expect(balanceAfter).to.equal(balanceBefore.add(price))

      // check if info is right
      expect(generalInfo.tokenToBuy).to.equal(ZERO_ADDRESS);
      expect(generalInfo.price).to.equal(0);
      expect(generalInfo.listed).to.equal(false);
      expect(generalInfo.owner).to.equal(acc1.address);
    })
  })

  describe("Get item from auction to balance", () => 
  {
    beforeEach(async () => 
    {
      await instance.createItem721() // 2
      await instance.createItem1155(20) // 2
    })
  
    it("getMyItem(): Should send erc721 token to sender", async () =>
    {
      await instance.getMyItem(token721.address, 2)
      expect(await token721.ownerOf(2)).to.equal(owner.address)
    })

    it("getMyItem(): Should send all erc1155 tokens to sender", async () =>
    {
      await instance.getMyItem(token1155.address, 2)
      expect(await token1155.balanceOf(owner.address, 2)).to.equal(20)
    })

  })
})

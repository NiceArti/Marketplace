import { task, types } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import {DEPLOYED_CONTRACT} from "./settings";





task("createItem721", "creates ERC721 nft token inside the contract")
.setAction(async function (taskArguments, hre) {
    const contract = await hre.ethers.getContractAt("Marketplace", DEPLOYED_CONTRACT);
    const transactionResponse = await contract.createItem721({
        gasLimit: 500_000,
    });
    console.log(`Transaction Hash: ${transactionResponse.hash}`);
});

task("createItem1155", "creates ERC1155 nft token inside the contract")
.addParam("amount", "amount of tokens")
.setAction(async function (taskArguments, hre) {
    const contract = await hre.ethers.getContractAt("Marketplace", DEPLOYED_CONTRACT);
    const transactionResponse = await contract.createItem1155(
        taskArguments.amount, 
        {gasLimit: 500_000,}
    );
    console.log(`Transaction Hash: ${transactionResponse.hash}`);
});
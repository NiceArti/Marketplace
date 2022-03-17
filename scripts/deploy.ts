// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // 0x92113478D664C30144E66AE40f099722523a42D4
  const Token721 = await ethers.getContractFactory("Token721");
  // 0x6D6194d311fFaFC17c6FA9c74B6cEb8114A1b8Db
  const Token1155 = await ethers.getContractFactory("Token1155");

  const token721 = await Token721.deploy('MeMarket Token','MeMT');
  const token1155 = await Token1155.deploy();

  await token721.deployed();
  await token1155.deployed();

  // 0x500B948C98565a0D9952994D4a7821268Be8EEB8
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(token721.address, token1155.address);

  await marketplace.deployed();

  console.log("Contract deployed to:", marketplace.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

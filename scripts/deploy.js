const { poseidonContract } = require("circomlibjs");
const { ethers } = require("hardhat");

async function deploy(contractName, ...args) {
  const Factory = await ethers.getContractFactory(contractName);
  const instance = await Factory.deploy(...args);
  return instance.deployed();
}

async function deployPoseidon(signer) {
  const Factory = new ethers.ContractFactory(
    poseidonContract.generateABI(5),
    poseidonContract.createCode(5),
    signer
  );
  const instance = await Factory.deploy();
  return instance.deployed();
}
async function main() {
  const [owner] = await ethers.getSigners();
  const poseidonContract = await deployPoseidon(owner);
  const verifier = await deploy("Groth16Verifier");
  const WordMastermind = await deploy(
    "WordMastermind",
    verifier.address,
    poseidonContract.address,
  );

  console.log("poseidon deployed to:", poseidonContract.address);
  console.log("verifier deployed to:", verifier.address);
  console.log("WordMastermind deployed to:", WordMastermind.address);
}

// poseidon deployed to: 0xF09e8Dcf61DD1d7B9d3656B621eF977Cd3919696
// verifier deployed to: 0x6B8742d5f2111396454ba607EeC2ed98d899e082
// WordMastermind deployed to: 0x56f74D82C008653ac0caC9722c69bab09EC2cF49

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
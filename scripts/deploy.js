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

// poseidon deployed to: 0xE82F48Ec92d4050d99c8C7d4bF900E8315DEbB2f
// verifier deployed to: 0x37Be8C585f8fF709BEdD18e5ed074E7CDb75b219
// WordMastermind deployed to: 0x4E6377Ce77ce89056dDA4a989Ba6c40d4EF2356f

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
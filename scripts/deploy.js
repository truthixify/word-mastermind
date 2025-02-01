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

// poseidon deployed to: 0x786b3E4a852b7B80850ED379BF1F675ADD2032Da
// verifier deployed to: 0xB93726DE07BA4E5356928E33A7239fece0dd0b9E
// WordMastermind deployed to: 0x41B2BbDe2BFE6b7f551Acf6d5aC41ff86019D29a

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
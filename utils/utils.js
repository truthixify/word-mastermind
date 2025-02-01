import { groth16 } from "snarkjs";
import { poseidonContract } from "circomlibjs";

export function buildSolidityProof(snarkProof, publicSignals) {
  return {
    a: snarkProof.pi_a.slice(0, 2),
    b: [
      snarkProof.pi_b[0].slice(0).reverse(),
      snarkProof.pi_b[1].slice(0).reverse(),
    ],
    c: snarkProof.pi_c.slice(0, 2),
    input: publicSignals,
  };
}

export async function generateProof(INPUT) {
  const { proof, publicSignals } = await groth16.fullProve(
    INPUT,
    "circuits/WordMastermind_js/WordMastermind.wasm",
    "circuits/circuit_final.zkey"
  );

  const solidityProof = await buildSolidityProof(proof, publicSignals);

  return [
    solidityProof.a,
    solidityProof.b,
    solidityProof.c,
    solidityProof.input,
  ];
}

export async function deploy(contractName, ...args) {
  const Factory = await ethers.getContractFactory(contractName);
  const instance = await Factory.deploy(...args);
  return instance.deployed();
}

export function calculateBC(guess, solution) {
  const bull = solution.filter((sol, i) => {
    return sol === guess[i];
  }).length;

  const cow = solution.filter((sol, i) => {
    return sol !== guess[i] && guess.some((g) => g === sol);
  }).length;

  return [bull, cow];
}

export async function deployPoseidon(signer) {
  const Factory = new ethers.ContractFactory(
    poseidonContract.generateABI(5),
    poseidonContract.createCode(5),
    signer
  );
  const instance = await Factory.deploy();
  return instance.deployed();
}

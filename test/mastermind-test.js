const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { groth16 } = require("snarkjs");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
exports.p = Scalar.fromString(
  "21888242871839275222246405745257275088548364400416034343698204186575808495617",
);
const Fr = new F1Field(exports.p);

describe("Mastermind Variation circuit test", function () {
  this.timeout(100000000);

  it("Circuit test", async () => {
    const circuit = await wasm_tester(
      "contracts/circuits/MastermindVariation.circom",
    );

    const INPUT = {
      pubGuess: ["70", "82", "69", "84"],
      privSalt: "1234",
      pubNumBull: "4",
      pubNumCow: "0",
      pubSolnHash:
        "1565709258951795423637241887950612550910289139104993260018598934344803482919",
      privSoln: ["70", "82", "69", "84"],
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    // console.log(witness);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(
      Fr.eq(
        Fr.e(witness[1]),
        Fr.e(
          "1565709258951795423637241887950612550910289139104993260018598934344803482919",
        ),
      ),
    );
  });
});

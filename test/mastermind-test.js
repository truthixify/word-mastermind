const { ethers } = require("hardhat");
const { expect } = require("chai");
const {
  calculateBC,
  deploy,
  deployPoseidon,
  generateProof,
} = require("../utils/utils");
const buildPoseidon = require("circomlibjs").buildPoseidon;

describe("Word Mastermind", function () {
  let WordMastermind;
  let poseidonJs;

  let owner;
  let player;

  before(async () => {
    [owner, player] = await ethers.getSigners();
    const poseidonContract = await deployPoseidon(owner);
    const verifier = await deploy("Groth16Verifier");

    WordMastermind = await deploy(
      "WordMastermind",
      verifier.address,
      poseidonContract.address,
    );

    poseidonJs = await buildPoseidon();
  });

  it("fetch", async function () {
    const submittedGuess = await WordMastermind.connect(
      player
    ).getSubmittedGuess();
    expect(submittedGuess[0].submitted).to.equal(false);

    const submittedBC = await WordMastermind.connect(player).getSubmittedBC();
    expect(submittedBC[0].submitted).to.equal(false);
  });

  it("play game!", async function () {
    // register
    await WordMastermind.connect(player).register();

    // Solution & SolutionHash
    const solution = [65, 66, 67, 68];
    const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const solutionHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([salt, ...solution]))
    );

    // Commit SolutionHash
    expect(
      await WordMastermind.commitSolutionHash(solutionHash)
    );

    // Player submits guess
    const guess = [80, 70, 90, 81];
    await expect(WordMastermind.connect(player).submitGuess(...guess))
      .to.emit(WordMastermind, "SubmitGuess")
      .withArgs(player.address, 1, ...guess);

    const [hit, blow] = calculateBC(guess, solution);

    const proofInput = {
      pubGuess: guess,
      pubNumBull: hit,
      pubNumCow: blow,
      pubSolnHash: solutionHash.toString(),
      privSoln: solution,
      privSalt: salt.toString(),
    };

    // Generate proof at local
    const proof = await generateProof(proofInput);

    // Submit proof and verify proof in SmartContract.
    await WordMastermind.connect(player).submitBcProof(...proof);

    // Player submits correct guess.
    const allHitGuess = solution;
    await WordMastermind.connect(player).submitGuess(...allHitGuess);

    // It must be 4 hits and 0 blow.
    const [bull4, cow0] = calculateBC(allHitGuess, solution);

    const proofInputHitAll = {
      pubGuess: solution,
      pubNumBull: bull4,
      pubNumCow: cow0,
      pubSolnHash: solutionHash.toString(),
      privSoln: solution,
      privSalt: salt.toString(),
    };

    // Player Win! (leave drawn game out of consideration...)
    const proofHitAll = await generateProof(proofInputHitAll);
    expect(await WordMastermind.connect(player).submitBcProof(...proofHitAll))
      .to.emit(WordMastermind, "SubmitHB")
      .withArgs(player.address, 2, ...[bull4, cow0]);

    expect(await WordMastermind.connect(owner).reveal(salt, ...solution))
      .to.emit(WordMastermind, "Reveal")
      .withArgs(owner.address, ...solution)
      .to.emit(WordMastermind, "GameFinish")
      .withArgs();

    // Initialize
    expect(await WordMastermind.stage()).to.equal(0);
    expect(
      (await WordMastermind.submittedGuess(0, player.address)).submitted
    ).to.equal(false);
    expect(
      (await WordMastermind.submittedBC(0, player.address)).submitted
    ).to.equal(false);
  });
});

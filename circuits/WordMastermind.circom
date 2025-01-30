pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/bitify.circom";
include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";
include "./RangeProof.circom";

// Word Mastermind

template MastermindVariation(n) {
    // Public inputs
    signal input pubGuess[n];
    signal input pubNumBull;
    signal input pubNumCow;
    signal input pubSolnHash;

    // Private inputs
    signal input privSoln[n];
    signal input privSalt;

    // Output
    signal output solnHashOut;

    component range[2*n];
    var i = 0;
    var j = 0;

    // Create a constraint that the solution and guess digits are all between 65 and 90.
    for (i=0; i<n; i++) {
        range[i] = RangeProof(32);
        range[i].in <== pubGuess[i];
        range[i].range[0] <== 65;
        range[i].range[1] <== 90;
        range[i].out === 1;

        range[i+n] = RangeProof(32);
        range[i+n].in <== privSoln[i];
        range[i+n].range[0] <== 65;
        range[i+n].range[1] <== 90;
        range[i+n].out === 1;
    }

    // Count bull & cow
    var bull = 0;
    var cow = 0;
    component equalBC[n*n];

    for (i=0; i<n; i++) {
        for (j=0; j<n; j++) {
            equalBC[n*i+j] = IsEqual();
            equalBC[n*i+j].in[0] <== pubGuess[i];
            equalBC[n*i+j].in[1] <== privSoln[j];
            cow += equalBC[n*i+j].out;

            if (i == j) {
                bull += equalBC[n*i+j].out;
                cow -= equalBC[n*i+j].out;
            }
        }
    }

    // Create a constraint around the number of hit
    component equalBull = IsEqual();
    equalBull.in[0] <== pubNumBull;
    equalBull.in[1] <== bull;
    equalBull.out === 1;
    
    // Create a constraint around the number of blow
    component equalCow = IsEqual();
    equalCow.in[0] <== pubNumCow;
    equalCow.in[1] <== cow;
    equalCow.out === 1;

    // Verify that the hash of the private solution matches pubSolnHash
    component poseidon = Poseidon(n+1);
    poseidon.inputs[0] <== privSalt;
    for (i = 1; i <= n; i++) {
        poseidon.inputs[i] <== privSoln[i - 1];
    }

    solnHashOut <== poseidon.out;
    pubSolnHash === solnHashOut;
}

component main{ public [pubGuess, pubNumBull, pubNumCow, pubSolnHash] } = MastermindVariation(4);
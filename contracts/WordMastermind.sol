//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./verifier.sol";

interface IHasher {
    function poseidon(uint256[5] calldata inputs)
        external
        pure
        returns (uint256);
}

interface IVerifier {
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[8] memory input
    ) external view returns (bool);
}

contract WordMastermind is Groth16Verifier {
    uint8 constant public MAX_ROUND = 10;
    uint8 public currentRound = 1;
    address public player;
    mapping (address => uint256) solutionHashes;

    IHasher public hasher;
    IVerifier public verifier;

    constructor(IVerifier _verifier, IHasher _hasher) {
        verifier = _verifier;
        hasher = _hasher;
    }

    enum Result {
        Win,
        Lose
    }
    Result public result;

    enum Stages {
        Register,
        CommitSolutionHash,
        Playing,
        Reveal 
    }
    Stages public stage = Stages.Register;

    modifier atStage(Stages _stage) {
        require(stage == _stage, "not allowed! ");
        _;
    }

    struct Guess {
        uint8 one;
        uint8 two;
        uint8 three;
        uint8 four;
        bool submitted;
    }

    struct BC {
        uint8 bull;
        uint8 cow;
        bool submitted;
    }

    mapping(address => Guess)[MAX_ROUND] public submittedGuess;
    mapping(address => BC)[MAX_ROUND] public submittedBC;

    event SubmitGuess(
        address indexed player,
        uint8 currentRound,
        uint8 a,
        uint8 b,
        uint8 c,
        uint8 d
    );
    event SubmitBC(
        address indexed player,
        uint8 currentRound,
        uint8 bull,
        uint8 cow
    );

    event StageChange(Stages stage);
    event RoundChange(uint8 round);
    event Register(address indexed player);
    event CommitSolutionHash(address indexed player, uint256 solutionHash);
    event Reveal(address indexed player, uint8 a, uint8 b, uint8 c, uint8 d);
    event GameFinish(Result indexed result);
    event Initialize();

    function initialize() public {
        require(
            msg.sender == player,
            "not allowed"
        );
        initGameState();
    }

    function initGameState() private {
        stage = Stages.Register;
        currentRound = 1;
        // looking for better way...
        for (uint8 i = 0; i < MAX_ROUND; i++) {
            delete submittedGuess[i][player];
            delete submittedBC[i][player];
        }
        solutionHashes[player] = 0;
        player = address(0);
        emit Initialize();
    }

    function getplayer() public view returns (address) {
        return player;
    }

    function getSubmittedGuess()
        public
        view
        returns (Guess[] memory)
    {
        Guess[] memory guessArray = new Guess[](currentRound);

        for (uint8 i = 0; i < currentRound; i++) {
            guessArray[i] = submittedGuess[i][player];
        }
        return guessArray;
    }

    function getSubmittedBC() public view returns (BC[] memory) {
        BC[] memory bcArray = new BC[](currentRound);

        for (uint8 i = 0; i < currentRound; i++) {
            bcArray[i] = submittedBC[i][player];
        }
        return bcArray;
    }

    function register() public atStage(Stages.Register) {
        if (player == msg.sender) {
            revert("already registered!");
        }

        player = msg.sender;
        stage = Stages.CommitSolutionHash;

        emit Register(msg.sender);
        emit StageChange(Stages.CommitSolutionHash);
    }

    function commitSolutionHash(uint256 solutionHash)
        public
        atStage(Stages.CommitSolutionHash)
    {
        solutionHashes[msg.sender] = solutionHash;
        emit CommitSolutionHash(msg.sender, solutionHash);

        if (solutionHashes[msg.sender] != 0) {
            stage = Stages.Playing;
            emit StageChange(Stages.Playing);
        }
    }

    function submitGuess(
        uint8 guess1,
        uint8 guess2,
        uint8 guess3,
        uint8 guess4
    ) public atStage(Stages.Playing) {
        require(
            !submittedGuess[currentRound - 1][msg.sender].submitted,
            "already submitted!"
        );

        Guess memory guess = Guess(guess1, guess2, guess3, guess4, true);
        submittedGuess[currentRound - 1][msg.sender] = guess;

        emit SubmitGuess(
            msg.sender,
            currentRound,
            guess1,
            guess2,
            guess3,
            guess4
        );

        currentRound++;
    }

    function submitBcProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[8] memory input
    ) public atStage(Stages.Playing) {
        require(
            IVerifier(verifier).verifyProof(a, b, c, input),
            "verification error"
        );
        uint8 bull = uint8(input[5]);
        uint8 cow = uint8(input[6]);
        BC memory bc = BC(bull, cow, true);
        submittedBC[currentRound - 1][msg.sender] = bc;

        if (bull == 4) {
            emit GameFinish(Result.Win);

            result = Result.Win;
            stage = Stages.Reveal;
        } else {
            if (currentRound == MAX_ROUND) {
                emit GameFinish(Result.Lose);

                result = Result.Lose;
                stage = Stages.Reveal;
            }
        }

        emit SubmitBC(msg.sender, currentRound, bull, cow);
    }

    function reveal(
        uint256 salt,
        uint8 a,
        uint8 b,
        uint8 c,
        uint8 d
    ) public atStage(Stages.Reveal) {
        // Check the hash to ensure the solution is correct
        require(
            hasher.poseidon([salt, a, b, c, d]) == solutionHashes[msg.sender],
            "invalid hash"
        );

        emit Reveal(msg.sender, a, b, c, d);

        if (result == Result.Win) {
            initGameState();
            emit GameFinish(Result.Win);
        }
    }
}
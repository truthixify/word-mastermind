import { useEffect, useState } from 'react';
import Button from './Button';
import GameBoard from './GameBoard';
import { ethers } from 'ethers';
import { buildPoseidon } from "circomlibjs";

const Main = ({ contract, account }) => {
    const [start, setStart] = useState(false);
    const [soln, setSoln] = useState('');
    const [guesses, setGuesses] = useState([]);
    const [solution, setSolution] = useState('');
    const [solutionHash, setSolutionHash] = useState('');


    useEffect(() => {
        fetch("/word.json")
        .then(res => res.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * 477);
            const word = data[randomIndex];
            const solnArray = word.split('');
            const asciiArray = solnArray.map(letter => letter.toUpperCase().charCodeAt(0));
            setSolution(asciiArray);
        })
        .catch(err => {
            console.error(err);
        });
    }, [contract]);

    const handleStart = async () => {
        if (!contract) {
            alert('Contract not initialized');
            return;
        }
        try {
            const poseidon = await buildPoseidon();
            const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
            const hash = ethers.BigNumber.from(
                poseidon.F.toObject(poseidon([salt, ...solution]))
            );

            setSolutionHash(hash);

            await contract.methods.register().send({ from: account });
            // const commitedHash = await contract.methods.commitSolutionHash(BigInt(solutionHash)).call();
            const guess = await contract.methods.getSubmittedGuess().call();

            console.log(guess);

            setStart(true);
        } catch (error) {
            alert(error.message);
        }
    }

    

    return (
        <div className='flex flex-col items-center justify-center h-screen'>
            {start ? <GameBoard  /> : <Button onClick={ handleStart }>Start Game</Button>}
        </div>
    );
};

export default Main;
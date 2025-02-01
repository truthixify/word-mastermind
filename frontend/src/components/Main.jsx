import { useEffect, useState } from 'react'
import Button from './Button'
import GameBoard from './GameBoard'
import { ethers } from 'ethers'
import { buildPoseidon } from "circomlibjs"

const Main = ({ contract, account }) => {
    const [start, setStart] = useState(false)
    const [soln, setSoln] = useState('')
    const [guess, setGuess] = useState([])
    const [solution, setSolution] = useState('')
    const [solutionHash, setSolutionHash] = useState('')
    const [submittedGuess, setSubmittedGuess] = useState('')
    const [submittedBC, setSubmittedBC] = useState('')
    const [guessA, setGuessA] = useState('')
    const [guessB, setGuessB] = useState('')
    const [guessC, setGuessC] = useState('')
    const [guessD, setGuessD] = useState('')

    const handleStartGame = async () => {
        if (!contract) {
            alert('Contract not initialized')
            return
        }
        try {
            const poseidon = await buildPoseidon()
            const salt = ethers.BigNumber.from(ethers.utils.randomBytes(32))
            const hash = ethers.BigNumber.from(
                poseidon.F.toObject(poseidon([salt, ...solution]))
            )

            setSolutionHash(hash)

            await contract.methods.initialize().send({ from: account })
            await contract.methods.register().send({ from: account })
            await contract.methods.commitSolutionHash(BigInt(solutionHash)).send({ from: account })

            setStart(true)
        } catch (error) {
            alert(error.message)
        }
    }

    const handleSubmitGuess = async () => {
        try {
            const guess = [guessA, guessB, guessC, guessD]
            const asciiArray = guess.map(letter => letter.toUpperCase().charCodeAt(0))

            await contract.methods.submitGuess(...asciiArray).send({ from: account })
            console.log(contract)
            // await contract.methods.commitSolutionHash(BigInt(solutionHash)).send({ from: account })

            const stage = await contract.methods.stage().call()
            alert(stage)
            const guesses = await contract.methods.getSubmittedGuess().call()
            setGuess(guesses)
        } catch (error) {
            alert(error.message)
        }
    }

    useEffect(() => {
        fetch("/word.json")
        .then(res => res.json())
        .then(data => {
            const randomIndex = Math.floor(Math.random() * 477)
            const word = data[randomIndex]
            const solnArray = word.split('')
            const asciiArray = solnArray.map(letter => letter.toUpperCase().charCodeAt(0))
            setSolution(asciiArray)
        })
        .catch(error => {
            console.error(error)
        })
    }, [handleStartGame])

    return (
        <div className='flex flex-col items-center justify-center h-full max-w-[500px] min-h-[500px] mx-auto'>
            {start ? 
            <div className="game w-full h-full flex items-center justify-between px-2">
                <div className='w-1/2 flex flex-col items-center justify-center'>
                    <div className="guess flex gap-2 my-4">
                        <input type="text" className='w-8 h-8 rounded-lg border-1 border-teal-500 text-center outline-none uppercase' onChange={(e) => setGuessA(e.target.value)}/>
                        <input type="text" className='w-8 h-8 rounded-lg border-1 border-teal-500 text-center outline-none uppercase' onChange={(e) => setGuessB(e.target.value)}/>
                        <input type="text" className='w-8 h-8 rounded-lg border-1 border-teal-500 text-center outline-none uppercase' onChange={(e) => setGuessC(e.target.value)}/>
                        <input type="text" className='w-8 h-8 rounded-lg border-1 border-teal-500 text-center outline-none uppercase' onChange={(e) => setGuessD(e.target.value)}/>
                    </div>
                    <Button onClick={ handleSubmitGuess }>Submit</Button>
                </div>
                <div className='w-1/2 h-full min-h-[500px] border-1 border-teal-500 rounded-lg p-4'>
                    
                </div>
            </div>
            
            :
            
            <Button onClick={ handleStartGame }>Start Game</Button>}
        </div>
    )
}

export default Main
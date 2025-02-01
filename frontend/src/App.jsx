import { useState } from "react";
import Navbar from "./components/Navbar";
import Main from "./components/Main";
import { Web3 } from "web3";
import WordMastermind from "../contracts/WordMastermind.json";
import { CONTRACT_ADDRESS } from "../../utils/consts";

function App() {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);

    const handleConnectWallet = async () => {
        if (window.ethereum) {
            try {
              await window.ethereum.request({ method: "eth_requestAccounts" });
      
              const web3 = new Web3(window.ethereum);
              const accounts = await web3.eth.getAccounts();
      
              const contractInstance = new web3.eth.Contract(WordMastermind.abi, CONTRACT_ADDRESS);
      
              setAccount(accounts[0]);
              setContract(contractInstance);
            } catch (error) {
              alert(`Error loading contract: ${error}`);
            }
        } else {
            alert("No Ethereum provider found. Install MetaMask.");
        }
    };

    return (
        <>
        <Navbar handleConnectWallet={ handleConnectWallet } account={ account } />
        <Main contract={ contract } account={ account }/>
        </>
    );
}

export default App;

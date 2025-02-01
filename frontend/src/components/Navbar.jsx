import Button from "./Button";
import ellipsify from "../utils/ellipsify";

const Navbar = ({ handleConnectWallet, account }) => {
    return (
        <nav className="w-full flex justify-between items-center p-8">
            <a to="/" className='text-teal-500 text-3xl font-bold'>Word Mastermind</a>
            <Button onClick={ handleConnectWallet } className='mb-4'>{account ? `Connected: ${ellipsify(account.toString())}` : 'Connect Wallet'}</Button>
        </nav>
    );
};

export default Navbar;
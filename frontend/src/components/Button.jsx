import React from 'react';

const Button = ({ onClick, children, className, disabled }) => {
    return (
        <button 
            onClick={onClick} 
            className={`bg-teal-500 text-white rounded-lg px-4 py-2 cursor-pointer ${className}`} 
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
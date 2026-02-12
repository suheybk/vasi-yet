import React from 'react';

const Card = ({ children, className = "", onClick }) => {
    return (
        <div
            className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
};

export default Card;

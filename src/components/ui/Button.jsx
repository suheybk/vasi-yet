import React from 'react';

const Button = ({
    children,
    onClick,
    type = "button",
    variant = "primary",
    size = "md",
    className = "",
    disabled = false,
    fullWidth = false
}) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base", // min-h-[44px] touch target handled by padding+line-height usually, but let's ensure
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            type={type}
            className={`
                ${baseStyles} 
                ${variants[variant]} 
                ${sizes[size]} 
                ${fullWidth ? "w-full" : ""} 
                ${className}
                min-h-[44px] /* Ensure touch target size */
            `}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;

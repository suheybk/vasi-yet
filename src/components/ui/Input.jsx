import React from 'react';

const Input = ({
    label,
    type = "text",
    placeholder,
    value,
    onChange,
    required = false,
    className = "",
    error,
    id
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                type={type}
                id={id}
                className={`
                    w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-gray-50 disabled:text-gray-500
                    min-h-[44px] /* Ensure touch target size */
                    ${error ? "border-red-500" : "border-gray-300"}
                `}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={required}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;

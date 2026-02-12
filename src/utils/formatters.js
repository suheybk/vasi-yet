/**
 * Formats a number as Turkish Lira currency strings.
 * Example: 1234.56 -> "1.234,56 ₺"
 * @param {number} amount - The amount to format
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
    }).format(amount);
};

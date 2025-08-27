// ====== HELPERS from migration spec ======

/**
 * Converts snake_case or kebab-case to camelCase.
 * @param str The input string.
 * @returns The camelCase version of the string.
 */
export const snakeToCamel = (str: string): string => str.replace(/([-_][a-z])/g, (g) => g.toUpperCase().replace(/[_-]/, ''));

/**
 * Converts camelCase to snake_case.
 * @param str The input string.
 * @returns The snake_case version of the string.
 */
export const camelToSnake = (str: string): string => str.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);

/**
 * Recursively converts the keys of an object using a converter function.
 * Skips conversion for Date objects to prevent corruption.
 * @param obj The object or array to convert.
 * @param converter The function to apply to each key (e.g., snakeToCamel).
 * @returns A new object or array with converted keys.
 */
export const convertObjectKeys = (obj: any, converter: (key: string) => string): any => {
    if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof Blob) {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => convertObjectKeys(item, converter));
    }
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[converter(key)] = convertObjectKeys(obj[key], converter);
        }
    }
    return newObj;
};

/**
 * Parses a currency string (e.g., "R$ 1.234,56") into a number.
 * @param value The currency string.
 * @returns A number or null if parsing fails.
 */
export const parseCurrency = (value?: string | number): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || !value) return null;
    // Standardize decimal separator to a period, remove thousands separators and non-numeric characters.
    const sanitized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(sanitized);
    // Return null if parsing fails (e.g., invalid input)
    return isNaN(parsed) ? null : parsed;
};

/**
 * Checks if an interaction observation indicates a "Contato Efetivo" (CE).
 * @param text The observation text.
 * @returns True if the text starts with "CE", "CE -", or "CE:".
 */
export const isCE = (text?: string): boolean => typeof text === 'string' && /^CE(\s|[-:])?/i.test(text.trim());

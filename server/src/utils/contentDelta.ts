/**
 * Parse contentDelta from request input.
 * @param input The input to parse
 * @return The parsed contentDelta object or undefined if input is invalid or empty
 */
export const parseContentDelta = (input: unknown) => {
    if (input === undefined || input === null || input === '') return undefined;
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch {
            return undefined;
        }
    }
    return input;
};

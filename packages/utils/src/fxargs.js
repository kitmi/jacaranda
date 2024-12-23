import { typeOf } from '@kitmi/types';

/**
 * Function arguments extractor.
 * @param {Array} args - Array of function arguments
 * @param {Array} types - Array of types, with suffix `?` as optional
 * @example
 *  function withClient(...args) {
 *      const [server, authenticator, testToRun, options] = fxargs(args, ['string?', 'string?', 'function', 'object?']);
 *      // ...
 *  }
 *
 *  1. withClient('http://localhost:3000', 'admin', (app) => {});
 *      - server: 'http://localhost:3000'
 *      - authenticator: 'admin'
 *      - testToRun: (app) => {}
 *      - options: undefined
 *
 *  2. withClient('http://localhost:3000', (app) => {});
 *      - server: 'http://localhost:3000'
 *      - authenticator: undefined
 *      - testToRun: (app) => {}
 *      - options: undefined
 *
 *  3. withClient((app) => {});
 *      - server: undefined
 *      - authenticator: undefined
 *      - testToRun: (app) => {}
 *      - options: undefined
 */
function fxargs(args, types) {
    // eslint-disable-next-line no-new-array
    const result = new Array(types.length).fill(undefined);
    let argIndex = 0,
        lt = types.length,
        la = args.length;
    const optionalSpots = [];

    for (let i = 0; i < lt; i++) {
        const type = types[i];
        const isOptional = type.endsWith('?');
        const typeOptions = isOptional ? type.slice(0, -1).split('|') : type.split('|');

        let matched = false;

        // Iterate over remaining args to find a match
        while (argIndex < la && !matched) {
            const value = args[argIndex];
            if (typeOptions.some((typeOption) => typeOf(value) === typeOption)) {
                // Assign the value and increment the argument index
                result[i] = value;
                argIndex++;
                matched = true;

                if (isOptional) {
                    optionalSpots.push(i);
                } else if (
                    optionalSpots.length > 0 &&
                    typeOptions.every((typeOption) => typeOf(args[argIndex - 2]) !== typeOption)
                ) {
                    optionalSpots.length = 0;
                }
            } else if (isOptional) {
                // If the type is optional and no match found, break to allow for undefined
                break;
            } else {
                // Try pop up an optional value
                if (optionalSpots.length > 0 && lt - i >= la - argIndex + 1) {
                    const optionalIndex = optionalSpots.pop();
                    for (let j = optionalIndex + 1; j < i; j++) {
                        result[j] = result[j - 1];
                    }
                    result[optionalIndex] = undefined;
                    argIndex--;
                    continue;
                }

                // No match found for a required type
                throw new Error(`Missing or invalid argument at index ${i}, expected "${type}".`);
            }
        }

        if (!matched && !isOptional) {
            // Try pop up an optional value 2， 2-

            if (optionalSpots.length > 0 && lt - i >= la - argIndex + 1) {
                const optionalIndex = optionalSpots.pop();

                for (let j = optionalIndex + 1; j < i; j++) {
                    result[j] = result[j - 1];
                }
                result[optionalIndex] = undefined;
                argIndex--;
                i--;
            } else {
                throw new Error(`Missing argument at index ${i}, expected "${type}".`);
            }
        }
    }

    return result;
}

export default fxargs;

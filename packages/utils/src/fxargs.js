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
    const result = new Array(types.length).fill(undefined);
    let argIndex = 0, lt = types.length, la = args.length;

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
            } else if (isOptional) {
                // If the type is optional and no match found, break to allow for undefined
                break;
            } else {
                // No match found for a required type
                throw new Error(`Missing or invalid argument at index ${i}, expected "${type}".`);
            }
        }

        if (!matched && !isOptional) {
            throw new Error(`Missing argument at index ${i}, expected "${type}".`);
        }
    }

    return result;
}

export default fxargs;

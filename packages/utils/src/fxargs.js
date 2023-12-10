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
    let argIndex = 0;

    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        const isOptional = type.endsWith('?');
        const typeName = isOptional ? type.slice(0, -1) : type;
        const value = args[argIndex];

        // If there's a type mismatch and the type is optional, skip filling the result for this type
        if (value === undefined) {
            if (!isOptional) {
                throw new Error(`Missing argument at index ${i}`);
            }

            continue;
        }       

        if (typeOf(value) !== typeName) {
            if (!isOptional) {
                if (typeName !== 'any') {
                    throw new Error(`Invalid argument at index ${i}: expected type "${typeName}", got "undefined"`);
                }
            }

            continue;
        }        

        // Assign the value and increment the argument index
        result[i] = value;
        argIndex++;
    }

    return result;
}

export default fxargs;
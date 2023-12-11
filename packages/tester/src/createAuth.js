import { _ } from '@kitmi/utils';
import * as loginMethods from './login';
import * as accessMethods from './access';

// Cache for storing user tokens
const tokenCache = {};

/**
 * Returns a middleware function that adds user authentication to a client.
 * @param {string} authKey - The user tag or user authentication object.
 * @param {Object} authConfig - The user authentication settings.
 * @returns {Function} A middleware function that adds user authentication to a client.
 * @throws {Error} If the user authentication settings are missing required fields.
 * @private
 */
function createAuth(authKey, authConfig) {
    const { loginType = 'password', accessType = 'jwt' } = authConfig;

    const accessMethod = accessMethods[accessType];
    if (!accessMethod) {
        throw new Error(`Unsuppported accessType "${accessType}". Should be one of ${_.keys(accessMethods)}.`);
    }

    return async (client) => {
        let accessToken = tokenCache[authKey];

        // If the token is not cached, authenticate the user and cache the token
        if (!accessToken) {
            const loginMethod = loginMethods[loginType];
            if (!loginMethod) {
                throw new Error(`Unsuppported loginType "${loginType}". Should be one of ${_.keys(loginMethods)}.`);
            }

            accessToken = tokenCache[authKey] = await loginMethod(client, authConfig.loginOptions);
        }

        await accessMethod(client, accessToken);
    };
}

export default createAuth;

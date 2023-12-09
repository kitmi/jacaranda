import { _, get } from "@kitmi/utils";

// Cache for storing user tokens
const tokenCache = {};

/**
 * Returns a middleware function that adds user authentication to a client.
 * @param {string|Object} authKey - The user tag or user authentication object.
 * @returns {Function} A middleware function that adds user authentication to a client.
 * @throws {Error} If the user authentication settings are missing required fields.
 */
function defaultUserAuth(authKey) {
    return async (client, authConfig) => {
        // If no user tag is provided, remove the onSending function and return the client
        if (!authKey) {
            delete client.onSending;
            return client;
        }

        let token = tokenCache[authKey];

        // If the token is not cached, authenticate the user and cache the token
        if (!token) {
            if (!authConfig.endpoint || !authConfig.username || !authConfig.password) {
                throw new Error(
                    `"endpoint", "username", "password" is required for authentication of user "${authKey}".`
                );
            }

            let body = await client.post(
                authConfig.endpoint,
                {
                    username: authConfig.username,
                    password: authConfig.password,
                },
                authConfig.query,
                authConfig.headers ? { headers: authConfig.headers } : null
            );
            if (authConfig.tokenKey) {
                token = get(body, authConfig.tokenKey);
            } else {
                token = body.token;
            }
            tokenCache[authKey] = token;
        }

        // Add the token to the Authorization header of each request
        client.onSending = (req) => {
            req.set("Authorization", `Bearer ${token}`);
        };
    };
}

export default defaultUserAuth;
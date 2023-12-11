import { _, get } from '@kitmi/utils';

// Cache for storing user tokens
const tokenCache = {};

const jwtAuth = async (client, accessToken) => {
    if (accessToken == null) {
        throw new Error(`"accessToken" is required.`);
    }

    // Add the token to the Authorization header of each request
    client.onSending = (req) => {
        req.set('Authorization', `Bearer ${accessToken}`);
    };
};

const passwordAuth = async (client, loginOptions) => {
    if (!loginOptions.endpoint || !loginOptions.username || !loginOptions.password) {
        throw new Error(`"endpoint", "username", "password" is required.`);
    }

    let body = await client.post(
        loginOptions.endpoint,
        {
            username: loginOptions.username,
            password: loginOptions.password,
        },
        loginOptions.query,
        loginOptions.headers ? { headers: loginOptions.headers } : null
    );
    if (loginOptions.tokenKey) {
        accessToken = get(body, loginOptions.tokenKey);
    } else {
        accessToken = body.token;
    }
};

const loginMethods = {
    password: passwordAuth,
};
const accessMethods = {
    jwt: jwtAuth,
};

/**
 * Returns a middleware function that adds user authentication to a client.
 * @param {string} authKey - The user tag or user authentication object.
 * @param {Object} authConfig - The user authentication settings.
 * @returns {Function} A middleware function that adds user authentication to a client.
 * @throws {Error} If the user authentication settings are missing required fields.
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

            tokenCache[authKey] = accessToken = await loginMethod(client, authConfig.loginOptions);
        }

        await accessMethod(client, accessToken);
    };
}

export default createAuth;

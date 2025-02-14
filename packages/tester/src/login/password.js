import { get } from '@kitmi/utils';

/**
 * Use username and password to login and get the access token.
 * @param {*} client
 * @param {Object} loginOptions
 * @property {String} loginOptions.endpoint - The login endpoint.
 * @property {String} loginOptions.username - The username, can be customized by usernameField.
 * @property {String} loginOptions.password - The password.
 * @property {String} [loginOptions.usernameField] - The username field name, default "username".
 * @property {String} [loginOptions.tokenKey] - The token key path, default "token".
 * @property {Object} [loginOptions.query] - The query parameters.
 * @property {Object} [loginOptions.headers] - Extra headers.
 */
const passwordAuth = async (client, loginOptions) => {
    const usernameField = loginOptions.usernameField || 'username';

    if (!loginOptions.endpoint || !loginOptions[usernameField] || !loginOptions.password) {
        throw new Error(`"endpoint", "${usernameField}", "password" is required.`);
    }

    let body = await client.post(
        loginOptions.endpoint,
        {
            [usernameField]: loginOptions[usernameField],
            password: loginOptions.password,
        },
        loginOptions.query,
        loginOptions.headers ? { headers: loginOptions.headers } : null
    );
    let accessToken;

    if (loginOptions.tokenKey) {
        accessToken = get(body, loginOptions.tokenKey);
    } else {
        accessToken = body.token;
    }

    return accessToken;
};

export default passwordAuth;

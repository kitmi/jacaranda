const jwtAuth = async (client, accessToken) => {
    if (accessToken == null) {
        throw new Error(`"accessToken" is required.`);
    }

    // Add the token to the Authorization header of each request
    client.onSending = (req) => {
        req.set('Authorization', `Bearer ${accessToken}`);
    };
};

export default jwtAuth;
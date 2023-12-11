"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const jwtAuth = async (client, accessToken)=>{
    if (accessToken == null) {
        throw new Error(`"accessToken" is required.`);
    }
    // Add the token to the Authorization header of each request
    client.onSending = (req)=>{
        req.set('Authorization', `Bearer ${accessToken}`);
    };
};
const _default = jwtAuth;

//# sourceMappingURL=jwt.js.map
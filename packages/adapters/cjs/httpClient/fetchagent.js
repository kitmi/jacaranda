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
const _superagentLike = /*#__PURE__*/ _interop_require_wildcard(require("../helpers/superagentLike"));
const _utils = require("@kitmi/utils");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const fetchAdapter = ()=>{
    return {
        createRequest (method, url, _options) {
            const headers = {
                'content-type': 'application/json'
            };
            let query;
            const options = {
                redirect: "follow"
            };
            const requestWrapper = {
                set: (name, value)=>{
                    let lowerName = name.toLowerCase();
                    if (lowerName === 'type') {
                        lowerName = 'content-type';
                    }
                    headers[lowerName] = value;
                    return requestWrapper;
                },
                withCredentials: ()=>{
                    options.mode = 'cors';
                    options.credentials = 'include';
                    return requestWrapper;
                },
                send: (body)=>{
                    if ((0, _superagentLike.isJSON)(headers['content-type'])) {
                        options.body = JSON.stringify(body);
                    } else {
                        options.body = body;
                    }
                    return requestWrapper;
                },
                query: (_query)=>{
                    query = query;
                    return requestWrapper;
                },
                type: (type)=>{
                    headers['content-type'] = type;
                    return requestWrapper;
                },
                accept: (type)=>{
                    headers.accept = type.includes('/') ? type : `application/${type}`;
                    return requestWrapper;
                },
                then: async (callback)=>{
                    if (_options._method === 'download' && !headers.accept) {
                        requestWrapper.accept('octet-stream');
                    }
                    const __method = method.toUpperCase();
                    const response = await fetch(query ? (0, _utils.appendQuery)(url, query) : url, {
                        ...options,
                        method: __method,
                        headers
                    });
                    return _superagentLike.default.create_({
                        headers,
                        method: __method,
                        url
                    }, response).then(callback);
                }
            };
            return requestWrapper;
        }
    };
};
const _default = fetchAdapter;

//# sourceMappingURL=fetchagent.js.map
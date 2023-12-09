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
const _types = require("@kitmi/types");
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    packages: [
        'nanoid'
    ],
    load_: async function(app, options, name) {
        const { length, charset } = app.featureConfig(options, {
            schema: {
                length: {
                    type: 'number',
                    default: 16
                },
                charset: {
                    type: 'text',
                    enum: [
                        'up_letter_num',
                        'low_letter_num',
                        'up_letter',
                        'low_letter',
                        'url_safe_all'
                    ],
                    default: 'url_safe_all'
                }
            }
        }, name);
        const { customAlphabet } = await app.tryRequire_('nanoid');
        const { customAlphabet: customAlphabet_ } = await app.tryRequire_('nanoid/async');
        const generators = new Map();
        function getGenerator(_charset, _length, isAsync) {
            _charset || (_charset = charset);
            _length || (_length = length);
            const key = `${_charset}:${_length}${isAsync ? '_' : ''}`;
            let g = generators.get(key);
            if (g != null) {
                return g;
            }
            const charsetString = _types.charsets[_charset];
            if (charsetString == null) {
                throw new _types.InvalidArgument('Charset not supported for "nanoid" feature', {
                    chatset: _charset
                });
            }
            g = isAsync ? customAlphabet_(charsetString, _length) : customAlphabet(charsetString, _length);
            generators.set(key, g);
            return g;
        }
        const service = {
            next (_charset, _length) {
                return getGenerator(_charset, _length, false)();
            },
            async next_ (_charset, _length) {
                return getGenerator(_charset, _length, true)();
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=nanoid.js.map
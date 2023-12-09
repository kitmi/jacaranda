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
        'fast-xml-parser'
    ],
    load_: async function(app, options, name) {
        const { parser: parserOptions, builder: builderOptions } = options;
        const { XMLParser, XMLBuilder } = app.tryRequire('fast-xml-parser');
        const service = {
            parse: (xml)=>{
                const parser = new XMLParser(parserOptions);
                return parser.parse(xml);
            },
            build: (obj)=>{
                const builder = new XMLBuilder(builderOptions);
                return builder.build(obj);
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=xml.js.map
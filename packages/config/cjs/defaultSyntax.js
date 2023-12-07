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
const _utils = require("@kitmi/utils");
const PROCESSOR_PREFIX = '#!';
// syntax: <PROCESSOR_PREFIX><TOKEN>:
const JS_VALUE_TOKEN = 'jsv';
const ES6_TEMPLATE_TOKEN = 'es6';
const JS_SWIG_TOKEN = 'swig';
const FN_TOKEN = 'fn';
const esTemplateSetting = {
    interpolate: /\$\{([\s\S]+?)\}/g
};
const swigTemplateSetting = {
    interpolate: /{{([\s\S]+?)}}/g
};
const processors = {
    [JS_VALUE_TOKEN]: (str, variables)=>{
        // eslint-disable-next-line no-new-func
        return new Function('v', 'with (v) { return (' + str + ')}')(variables);
    },
    [ES6_TEMPLATE_TOKEN]: (str, variables)=>{
        str = str.trim();
        if (str) {
            return _utils._.template(str, esTemplateSetting)(variables);
        }
        return str;
    },
    [JS_SWIG_TOKEN]: (str, variables)=>{
        str = str.trim();
        if (str) {
            return _utils._.template(str, swigTemplateSetting)(variables);
        }
        return str;
    },
    [FN_TOKEN]: (str)=>{
        // eslint-disable-next-line no-new-func
        return new Function('v', `with (v) { ${str} }`);
    }
};
const _default = {
    prefix: PROCESSOR_PREFIX,
    processors
};

//# sourceMappingURL=defaultSyntax.js.map
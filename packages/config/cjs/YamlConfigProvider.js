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
const _utils = require("@kit/utils");
const _yaml = /*#__PURE__*/ _interop_require_default(require("yaml"));
const _JsonConfigProvider = /*#__PURE__*/ _interop_require_default(require("./JsonConfigProvider"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
class YamlConfigProvider extends _JsonConfigProvider.default {
    parse(fileContent) {
        return _yaml.default.parse(fileContent);
    }
    stringify() {
        return _yaml.default.stringify(this.config ?? {});
    }
}
const _default = YamlConfigProvider;

//# sourceMappingURL=YamlConfigProvider.js.map
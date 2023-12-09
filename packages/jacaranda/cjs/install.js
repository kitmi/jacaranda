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
const _ServiceInstaller = /*#__PURE__*/ _interop_require_default(require("./ServiceInstaller"));
const _Runnable = /*#__PURE__*/ _interop_require_default(require("./Runnable"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Installer cli.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceInstaller}
 */ class Installer extends (0, _Runnable.default)(_ServiceInstaller.default) {
    constructor(name, options){
        super(name || 'installer', options);
    }
}
function install(options) {
    const installer = new Installer(null, options);
    installer.start_().then((app)=>app.stop_()).catch((err)=>{
        console.error(err);
    });
}
const _default = install;

//# sourceMappingURL=install.js.map
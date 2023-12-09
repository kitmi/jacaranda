/**
 * Response action as middleware
 * @module Middleware_Action
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
const _types = require("@kitmi/types");
const _utils = require("@kitmi/utils");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
/**
 * Action middleware creator
 * @param {string} controllerAction
 * @param {Routable} app
 */ const action = (controllerAction, app)=>{
    if (typeof controllerAction !== 'string') {
        throw new _types.InvalidConfiguration('Invalid action syntax.', app);
    }
    let pos = controllerAction.lastIndexOf('.');
    if (pos < 0) {
        throw new _types.InvalidConfiguration(`Unrecognized controller & action syntax: ${controllerAction}.`, app);
    }
    let controller = controllerAction.substring(0, pos);
    let action = controllerAction.substring(pos + 1);
    let controllerPath = _nodepath.default.resolve(app.controllersPath, controller);
    let ctrl;
    try {
        ctrl = (0, _utils.esmCheck)(require(controllerPath));
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new _types.InvalidConfiguration(`Failed to load [${controller}] at ${controllerPath}. ${err.message}`, app, {
                app: app.name,
                controller
            });
        }
    }
    let actioner = ctrl[action];
    if (Array.isArray(actioner)) {
        let actionFunction = actioner.concat().pop();
        if (typeof actionFunction !== 'function') {
            throw new _types.InvalidConfiguration(`${controllerAction} does not contain a valid action in returned middleware chain.`, app);
        }
        return actioner.concat(actionFunction);
    }
    if (typeof actioner !== 'function') {
        throw new _types.InvalidConfiguration(`${controllerAction} is not a valid action.`, app);
    }
    return actioner;
};
const _default = action;

//# sourceMappingURL=action.js.map
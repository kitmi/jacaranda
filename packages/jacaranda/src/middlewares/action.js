/**
 * Response action as middleware
 * @module Middleware_Action
 */

import { InvalidConfiguration } from '@kitmi/types';

const controllerCache = {};

/**
 * Action middleware creator
 * @param {string} controllerAction
 * @param {Routable} app
 */
const action = (controllerAction, app) => {
    if (typeof controllerAction !== 'string') {
        throw new InvalidConfiguration('Invalid action syntax.', app);
    }

    let pos = controllerAction.lastIndexOf('.');
    if (pos < 0) {
        throw new InvalidConfiguration(`Unrecognized controller & action syntax: ${controllerAction}.`, app);
    }

    let controller = controllerAction.substring(0, pos);
    let action = controllerAction.substring(pos + 1);

    let ctrl = app.registry.controllers?.actions?.[controller];

    if (ctrl == null) {
        throw new InvalidConfiguration(`Action controller "${controller}" not found.`, app);
    }

    let isController = false;

    if (typeof ctrl === 'function') {    
        isController = true;

        if (!controllerCache[controller]){            
            controllerCache[controller] = new ctrl(app);
        }

        ctrl = controllerCache[controller];
    }

    // todo: path support

    let actioner = ctrl[action];
    if (isController) {
        actioner = actioner.bind(ctrl);
    }

    if (Array.isArray(actioner)) {
        let actionFunction = actioner.concat().pop();
        if (typeof actionFunction !== 'function') {
            throw new InvalidConfiguration(
                `${controllerAction} does not contain a valid action in returned middleware chain.`,
                app
            );
        }

        return actioner.concat(actionFunction);
    }

    if (typeof actioner !== 'function') {
        throw new InvalidConfiguration(`${controllerAction} is not a valid action.`, app);
    }

    return actioner;
};

export default action;

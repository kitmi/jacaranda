/**
 * Response action as middleware
 * @module Middleware_Action
 */

import path from 'node:path';
import { InvalidConfiguration } from '@kitmi/types';
import { esmCheck } from '@kitmi/utils';

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

    let controllerPath = path.resolve(app.controllersPath, controller);
    let ctrl;

    try {
        ctrl = esmCheck(require(controllerPath));
    } catch (err) {
        if (err.code === 'MODULE_NOT_FOUND') {
            throw new InvalidConfiguration(`Failed to load [${controller}] at ${controllerPath}. ${err.message}`, app, {
                app: app.name,
                controller,
            });
        }
    }

    let actioner = ctrl[action];

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

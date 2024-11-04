/**
 * Response action as middleware
 * @module Middleware_Action
 */

import path from 'node:path';
import { InvalidConfiguration } from '@kitmi/types';
import { get as _get, set as _set } from '@kitmi/utils';
import { tryLoadFrom_ } from '../helpers/loadModuleFrom_';

/**
 * Action middleware creator
 * @param {string} controllerAction
 * @param {Routable} app
 */
const action = async (controllerAction, app) => {
    app.log('verbose', 'Loading action: ', { action: controllerAction });

    if (typeof controllerAction !== 'string') {
        throw new InvalidConfiguration('Invalid action syntax.', app);
    }

    let pos = controllerAction.lastIndexOf('.');
    if (pos < 0) {
        throw new InvalidConfiguration(`Unrecognized controller & action syntax: ${controllerAction}.`, app);
    }

    let controller = controllerAction.substring(0, pos);
    let action = controllerAction.substring(pos + 1);

    let ctrl = await tryLoadFrom_(app, 'Controller', {
        registry: {
            name: controller,
            path: 'controllers.actions',
        },
        project: {
            name: controller,
            path: path.join(app.sourcePath, 'actions'),
        },
    });

    let isController = false;

    if (typeof ctrl === 'function') {
        isController = true;

        let _ctrl = _get(app.__controllerCache, controller);

        if (_ctrl == null) {
            if (!app.__controllerCache) {
                app.__controllerCache = {};
            }

            _ctrl = new ctrl(app);
            _set(app.__controllerCache, controller, _ctrl);
        }

        ctrl = _ctrl;
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

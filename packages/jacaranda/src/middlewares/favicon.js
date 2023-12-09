/**
 * Middleware to serve favicon request.
 * @module Middleware_Favicon
 */

import { _ } from '@kitmi/utils';
import { fs } from '@kitmi/sys';
import path from 'node:path';
import { HttpCode, InvalidConfiguration } from '@kitmi/types';

const favicon = (options, app) => {
    if (typeof options === 'string') {
        options = { path: options };
    }

    let faviconPath =
        (options && options.path && app.toAbsolutePath(options.path)) || path.join(app.publicPath, 'favicon.ico');
    if (!fs.existsSync(faviconPath)) {
        throw new InvalidConfiguration(`Favicon path "${faviconPath}" not exists.`, app, 'middlewares.favicon');
    }

    let icon;
    const maxAge = options.maxAge == null ? 86400000 : Math.min(Math.max(0, options.maxAge), 31556926000);
    const cacheControl = `public, max-age=${(maxAge / 1000) | 0}`;

    return async (ctx, next) => {
        if ('/favicon.ico' !== ctx.path || ('GET' !== ctx.method && 'HEAD' !== ctx.method)) {
            return next();
        }

        if (!icon) {
            let stats = await fs.stat(faviconPath);
            //maximum 1M
            if (stats.size > 1048576) {
                app.log('warn', 'favicon.ico too large.', stats);
                ctx.throw(HttpCode.NOT_FOUND);
            }

            icon = await fs.readFile(faviconPath);
        }
        ctx.set('Cache-Control', cacheControl);
        ctx.type = 'image/x-icon';
        ctx.body = icon;
    };
};

export default favicon;

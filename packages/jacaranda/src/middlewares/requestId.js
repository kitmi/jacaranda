/**
 * Middleware to generate a unique request id for tracking in log.
 * @module Middleware_RequestId
 */

import { ntob64 } from '@kitmi/utils';

const BASE_LINE = 1733961600000;
const MAX_SEQ = 16777216;
let counter = 0;

const middlewareCreator = () => {
    return (ctx, next) => {
        const instanceId = ntob64(parseInt(process.env.NODE_APP_INSTANCE || '0') + 1);
        counter = ++counter % MAX_SEQ;
        const seqId = ntob64(counter); // from restart of the server, max 4 chars
        const timestamp = ntob64(Date.now() - BASE_LINE);
        const reqId = `${timestamp}:${instanceId}:${seqId}`;

        console.log('reqId', 'in middleware', reqId);

        ctx.state.reqId = ctx.req.id = reqId;
        if (!ctx.header['x-request-id']) {
            ctx.set('x-request-id', reqId);
        }
        return next();
    };
};

export default middlewareCreator;

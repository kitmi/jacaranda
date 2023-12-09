const IPV4_PREFIX = '::ffff:';
const IPV4_LOCALHOST = '::1';

const ip = async (options, app) => {
    const requestIp = await app.tryRequire_('request-ip');

    return async (ctx, next) => {
        let ip = requestIp.getClientIp(ctx.req);

        if (ip.startsWith(IPV4_PREFIX)) {
            ip = ip.substring(IPV4_PREFIX.length);
        }

        if (ip === IPV4_LOCALHOST) {
            ip = '127.0.0.1';
        }

        ctx.request.ip = ip;
        ctx.req.info = { remoteAddress: ip, remotePort: ctx.req.socket.remotePort };
        return next();
    };
};

export default ip;

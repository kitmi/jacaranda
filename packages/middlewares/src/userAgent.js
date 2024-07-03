import DeviceDetector from 'node-device-detector';
import ClientHints from 'node-device-detector/client-hints';

const userAgent = async (options, app) => {
    const detector = new DeviceDetector({
        clientIndexes: true,
        deviceIndexes: true,
        deviceAliasCode: false,
        deviceTrusted: false,
        deviceInfo: false,
        maxUserAgentSize: 500,
    });

    const clientHints = new ClientHints();

    return async (ctx, next) => {
        const hints = clientHints.parse(ctx.headers);
        const result = detector.detect(ctx.headers['user-agent'], hints);
        ctx.request.ua = result;
        return next();
    };
};

export default userAgent;

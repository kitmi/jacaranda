import RuntimeRegistry from "./helpers/RuntimeRegistry";

export const NS_APP = 'apps';
export const NS_LIB = 'libs';
export const NS_FEAT = 'features';
export const NS_MIDDLEWARE = 'middlewares';
export const NS_ROUTER = 'routers';

export const K_ENV = 'env';

const runtime = new RuntimeRegistry();

export default runtime;
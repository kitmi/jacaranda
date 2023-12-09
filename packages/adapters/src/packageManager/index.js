import npmPackageManager from './npm';
import bunPackageManager from './bun';
import pnpmPackageManager from './pnpm';
import yarnPackageManager from './yarn';

const managers = {
    npm: npmPackageManager,
    bun: bunPackageManager,
    pnpm: pnpmPackageManager,
    yarn: yarnPackageManager,
};

export default managers;

import { isRunAsEsm } from '@kitmi/utils';
import ServiceContainer from './ServiceContainer';
import Runnable from './Runnable';

const isEsm = isRunAsEsm();

/**
 * Cli app.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceContainer}
 */
class App extends Runnable(ServiceContainer) {
    constructor(name, options) {
        super(name || 'app', options);

        /**
         * Whether it is running as ESM.
         * @member {boolean}
         */
        this.isEsm = isEsm;
    }
}

export default App;

import ServiceContainer from './ServiceContainer';
import Runnable from './Runnable';

/**
 * Cli app.
 * @class
 * @mixes {Runnable}
 * @extends {ServiceContainer}
 */
class App extends Runnable(ServiceContainer) {
    constructor(name, options) {
        super(name || 'app', options);
    }
}

export default App;

import { sleep_ } from '@kitmi/utils';
import testShouldThrow_ from '@kitmi/utils/testShouldThrow_';
import { startLoopWorker } from '../src';

describe('startLoopWorker', () => {
    let worker, app, counter;

    function init(_app) {
        app = _app;
    }

    beforeEach(() => {
        counter = 0;

        worker = () => {
            console.log(++counter);
        };
    });

    afterEach(() => {});

    it('should call the worker function repeatedly with the specified interval', async () => {
        const stopPromise = startLoopWorker(worker, { interval: 100, initializer: init });
        await sleep_(50);
        
        counter.should.be.exactly(1);
        await sleep_(110);
        counter.should.be.exactly(2);
        await sleep_(110);
        counter.should.be.exactly(3);
        await app.stop_();
        await stopPromise;
    });

    it('should handle errors thrown by the worker function', async () => {
        const worker2 = () => {
            throw new Error('test error');
        };

        await testShouldThrow_(() => startLoopWorker(worker2, { interval: 100, initializer: init }), 'test error');

        await app.stop_();
    });

    it('should return the result of the startWorker function', async () => {
        const worker2 = (app, result) => {
            if (result) {
                return result + 1;
            } else {
                return 1;
            }
        };
        const stopPromise = startLoopWorker(worker2, { interval: 100, initializer: init });
        await sleep_(220);
        await app.stop_();
        const result = await stopPromise;
        result.should.be.exactly(3);
    });
});

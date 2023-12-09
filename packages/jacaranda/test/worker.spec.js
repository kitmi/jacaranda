import { startWorker } from '../src';

describe('starters:worker', function () {
    it('start', async function () {
        let a = 2;

        await startWorker(
            () => {
                console.log('work');
                a += 1;
            },
            {
                initializer: (app) => {
                    console.log('init');
                    a *= app.settings.num; // 10
                },
                loadConfigFromOptions: true,
                config: {
                    settings: {
                        num: 5,
                    },
                },
            }
        );

        a.should.be.exactly(11);
    });
});

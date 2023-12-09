import { startWorker } from '../src';

describe('nanoid', function () {
    it('default', async function () {
        await startWorker(
            async (app) => {
                const nanoid = app.getService('nanoid');
                const id1 = nanoid.next()
                id1.length.should.be.exactly(16);

                const id2 = await nanoid.next_();
                id2.length.should.be.exactly(16);
            },
            {                
                loadConfigFromOptions: true,
                config: {
                    nanoid: {                        
                    }
                },
            }
        );
    });

    it('custom', async function () {
        await startWorker(
            async (app) => {
                const nanoid = app.getService('nanoid');
                const id1 = nanoid.next('low_letter_num', 32);
                id1.should.be.lowercase;
                id1.length.should.be.exactly(32);

                const id2 = await nanoid.next_('up_letter_num', 24);
                id2.should.be.uppercase;
                id2.length.should.be.exactly(24);
            },
            {                
                loadConfigFromOptions: true,
                config: {
                    nanoid: {                        
                    }
                },
            }
        );
    });
});

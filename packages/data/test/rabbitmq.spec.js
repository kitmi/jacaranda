import { sleep_ } from '@kitmi/utils';

describe('rabbitmq', function () {
    it('bvt', async function () {
        await tester.startMQ_(async (app) => {
            const mq = app.getService('rabbitmq.test');
            const msg = { hello: 'world' };
            let msgReceived;

            mq.waitForJob('test-queue', async ({ body }) => {
                msgReceived = body;
            });

            await mq.postJob_('test-queue', msg);

            await sleep_(1000);

            expect(msgReceived).to.deep.equal(msg);
        });
    });   
});

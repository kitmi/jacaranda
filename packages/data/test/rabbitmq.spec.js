import { sleep_ } from '@kitmi/utils';

describe('rabbitmq', function () {
    it('work-queue', async function () {
        await tester.startMQ_(async (app) => {
            const mq = app.getService('rabbitmq.test');
            const msg = { hello: 'world', t: Date.now() };
            let msgReceived;

            await mq.waitForJob_('test-queue', async ({ body }) => {
                msgReceived = body;
            });

            await mq.postJob_('test-queue', msg);

            await sleep_(1000);

            expect(msgReceived).to.deep.equal(msg);

            await mq.conn.queueDelete({ queue: 'test-queue' });
        });
    });

    it('pub-sub', async function () {
        await tester.startMQ_(async (app) => {
            const mq = app.getService('rabbitmq.test');
            const msg = { hello: 'world', t: Date.now() };
            let msgReceived, msgReceived2;

            await mq.subscribe_(
                'testlogs',
                async ({ body }) => {
                    //console.log('client1', body);
                    msgReceived = body;
                },
                { deleteOnStop: true, durable: false }
            );

            await mq.subscribe_(
                'testlogs',
                async ({ body }) => {
                    //console.log('client2', body);
                    msgReceived2 = body;
                },
                { deleteOnStop: true, durable: false }
            );

            await mq.publish_('testlogs', msg);

            await sleep_(1000);

            expect(msgReceived).to.deep.equal(msg);
            expect(msgReceived2).to.deep.equal(msg);

            await mq.conn.exchangeDelete({ exchange: 'testlogs' });
        });
    });
});

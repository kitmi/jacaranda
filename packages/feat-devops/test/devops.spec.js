describe('gitea', function () {
    before(async () => {
       
    });

    it('getUser', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('gitea');
            const r = await service.getUser()
            expect(r.ok).to.equal(true);

        });
    });
    it('getRepositories', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('gitea');
            const r = await service.getRepositories()
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('gitea');
            const r = await service.createRepository('myRepo')
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository with namespace(username)', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('gitea');
            const r = await service.createRepository('userRepo', { namespace: 'user1' })
            expect(r.ok).to.equal(true);
        });
    });
    
    it('createRepository with namespace(org/groups)', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('gitea');
            const r = await service.createRepository('orgRepo1', { namespace: 'org1' })
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository with namespace not exist', async function () {
        await tester.start2_(async (app) => {
                try {
                const service = app.getService('gitea');
                const r = await service.createRepository('orgRepo2', { namespace: 'noExistNamespace' })
            } catch (error) {
                expect(error).to.be.an('error');
            }
            });
       
    });
});


describe('devops', function () {
    before(async () => {
       
    });

    it.only('getUser', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('devops');
            const r = await service.getUser()
            expect(r.ok).to.equal(true);
        });
    });
    it('getRepositories', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('devops');
            const r = await service.getRepositories()
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('devops');
            const r = await service.createRepository('myRepo')
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository with namespace(username)', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('devops');
            const r = await service.createRepository('userRepo', { namespace: 'user1' })
            expect(r.ok).to.equal(true);
        });
    });
    
    it('createRepository with namespace(org/groups)', async function () {
        await tester.start2_(async (app) => {
            const service = app.getService('devops');
            const r = await service.createRepository('orgRepo1', { namespace: 'org1' })
            expect(r.ok).to.equal(true);
        });
    });

    it('createRepository with namespace not exist', async function () {
        await tester.start2_(async (app) => {
                try {
                const service = app.getService('devops');
                const r = await service.createRepository('orgRepo2', { namespace: 'noExistNamespace' })
            } catch (error) {
                expect(error).to.be.an('error');
            }
            });
    });
});

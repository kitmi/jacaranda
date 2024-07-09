import { startWorker } from '../src';

describe('jwt', function () {
    it('bvt', async function () {
        await startWorker(
            async (app) => {
                const jwt = app.getService('jwt');
                const obj = { a: 1, b: 2 };
                const token = jwt.sign(obj);
                console.log(token);
                const obj2 = jwt.verify(token);
                delete obj2.iat;
                obj2.should.be.eql(obj);
            },
            {                
                loadConfigFromOptions: true,
                config: {
                    jwt: {  
                        key: 'AAA1ADA8-33EF-459B-931B-44CD93A1251F'                      
                    }
                },
            }
        );
    });

    it('asym', async function () {
        await startWorker(
            async (app) => {
                const jwt = app.getService('jwt');
                const obj = { a: 1, b: 2 };
                const token = jwt.sign(obj);
                console.log(token);
                const obj2 = jwt.verify(token);
                delete obj2.iat;
                obj2.should.be.eql(obj);
            },
            {
                throwOnError: true,                
                loadConfigFromOptions: true,
                config: {
                    jwt: {  
                        privateKey: `-----BEGIN PRIVATE KEY-----
                        MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCo1CWmeM0xVpD1
                        Y2gPWfFgJPWjH0vqWhuEePsJ2MVlNwcBb7RtcEmJ9x+/zBTZSIp35Gfzblt6yHO7
                        JGO+tnJjzIGHL6DF6yl9Z/vYN8TP7D61l1ErJXASSgW/7vWxJZ6fFIOYCaw28aIY
                        POPTup3wFuOXM8IUCoFtrkT9WIPsctqXGVdTUEcOSzUaksyp1t5I2hkf6Qa19ZkD
                        HmPDHC7bQSLou7NRnlwmhRFdsNoRwdOMdpGFqjAwVOSv8qmxPX59R1r6wA6BJny4
                        9FgqFmnXFpnFvvX23/Iawnia1Jyd6DPcp0WTIKNPE4Vjef5YGAQQH/KMh7vlm1qp
                        n2hZlFKLAgMBAAECggEAAr0GK1AUS/OSgFhvbKhR0PRog4/TZGa3wYtQzxUUBpNA
                        6tYMACZtGu7GNg8yW1/g1xb+VKV6mGA9+FAbyhEdg97iTvYHzo4E60LPg+9Lou+7
                        CKj+qQt/aNyIgVd35rqsevoTNFkb0PxUW75JF7sUKrvET0SIpliRRt0nw1A3O5OO
                        kB4co/0ps1Yo01caMes1XK2dofNtV1bQ8mAQ7AvR0id0pu0TqAi10PFyMjxacWix
                        jUpbQpjOOzno/It6WUJEk1Mo5jwv8rLtXR+bT8xg4qgAbbcmQi7yakF/pLpHzxuC
                        SdfhfqU72xEHRCnKR1hafV+GsxCFhTIrearSFwzEQQKBgQC9abiyB6YO9dM4zf7o
                        WhCv060UdbfZ2qF2Pd7q/KF7XrhrqvTPTXJcE/iPYKlgHk/9v19HZLZ4qPlga8Pf
                        MpvRtAGxYK/NriGIS7dj2boNBAM3fYxaSMwPiVtkDhIh3bYlRt69gp6SMON4YANL
                        HCBCcw5AimlbHns0YQVeForHawKBgQDkLe//GZ678u7qW4bCG+Yk2haL36Q4eQhy
                        cDuMA7Y3tQ/d7DOaxyd167Zg1K25ljYeiPVw6clfYMp8sOzUbpajAqckz4Gjl1L3
                        yT3QF5mb6b2g9yPshJsWDmnA7Zc99/2ztUp/RJee5KhidhWKQsywGVUcEjNuF2VY
                        p+X1lPQJYQKBgCI7LQnfn/8sJhQqBltvi3x7QNhlveg9PtjjrZnCNlzZbXLn3n5o
                        fLZvVYhz66hXUhWFtG5uoRuFTixCzY9U0hw/795inuMJCT5ckLQW8SzRANPSeL8I
                        UPit1jpq4JQGQZjTCgYtyQKam0Fx+KZmWt4ndPftC8VP6Ow6bIHoiQQpAoGAGlXi
                        +UJvu6mSQaJGr2ig62fwajxpq8rsWqjxdnuHMG7JYge8/QQ3XbjS1+I0GtNnc6bD
                        DUEuaL+3HyUccHhDEpVfzTPV9pekj8y+QaI3rHMR294qW0YC0Ezhj87cQd65fWBT
                        NNUp2sDxXkvauJZ1IW4LEK5ZGT/CBrV6KRoEAIECgYEAuuZcGKV45TqtN1qprP9/
                        PIB7OgdZwSzsoMdNC6kl6cyDOOLDQg4p1dG7/15AnLITF+OsnKia+E9Dalc1Nn4b
                        dlNf+U9XdCTC3K/vvvdE2AjRiA8iTbp8mMvlGbl36fKw+yGJKnfUJbzVSXzz9WhB
                        R5bwlvlCSbtZ5dy0j4cHdPs=
                        -----END PRIVATE KEY-----
                        `,
                        publicKey: `-----BEGIN PUBLIC KEY-----
                        MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqNQlpnjNMVaQ9WNoD1nx
                        YCT1ox9L6lobhHj7CdjFZTcHAW+0bXBJifcfv8wU2UiKd+Rn825beshzuyRjvrZy
                        Y8yBhy+gxespfWf72DfEz+w+tZdRKyVwEkoFv+71sSWenxSDmAmsNvGiGDzj07qd
                        8BbjlzPCFAqBba5E/ViD7HLalxlXU1BHDks1GpLMqdbeSNoZH+kGtfWZAx5jwxwu
                        20Ei6LuzUZ5cJoURXbDaEcHTjHaRhaowMFTkr/KpsT1+fUda+sAOgSZ8uPRYKhZp
                        1xaZxb719t/yGsJ4mtScnegz3KdFkyCjTxOFY3n+WBgEEB/yjIe75ZtaqZ9oWZRS
                        iwIDAQAB
                        -----END PUBLIC KEY-----
                        `                      
                    }
                },
            }
        );
    });
});

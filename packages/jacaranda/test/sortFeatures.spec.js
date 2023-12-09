import { startWorker } from '../src';

describe('sortFeatures', function () {
    it('bug-verify', async function () {
        await startWorker(
            (app) => {
                const features = [[
                    {
                      stage: 'Plugins',
                      groupable: true,
                      depends: ['settings'],
                      load_: [],
                      name: 'wechaty'
                    },
                    {
                      name: 'wechaty'
                    }
                  ]
                ];

                const sorted = app._sortFeatures([[
                    {
                      stage: 'Plugins',
                      groupable: true,
                      depends: ['settings'],
                      load_: [],
                      name: 'wechaty'
                    },
                    {
                      name: 'wechaty'
                    }
                  ]
                ]);

                sorted.should.be.eql(features);
            },
            {                
                loadConfigFromOptions: true,
                config: {        
                    "settings": {}           
                },
            }
        );
    });
});




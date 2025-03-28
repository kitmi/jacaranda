/**
 * Module dependencies.
 */

import path from 'node:path';
import ConfigLoader, { EnvAwareYamlConfigProvider } from '../src/ConfigLoader';

const cfgDir = path.resolve(__dirname, './data-yaml');

describe('bvt:yaml', function () {
    describe('yaml config', function () {
        it('load config', async function () {
            let config = ConfigLoader.createEnvAwareYamlLoader(cfgDir, 'test', 'production');

            const cfg = await config.load_();
            cfg.should.have.keys('key1');
            cfg['key1'].should.have.keys('key1_1', 'key1_3');
            cfg['key1']['key1_1'].should.be.eql({ key1_1_2: 'value1_1_2_override', key1_1_1: 'value1_1_1' });
            cfg['key1']['key1_3'].should.equal('original2');
        });

        it('interpolated config', function (done) {
            let config = new ConfigLoader(new EnvAwareYamlConfigProvider(cfgDir, 'test-itpl'));

            const obj = { name: 'Bob', place: 'Sydney', value1: 10, value2: 20, newKey: 'newKey' };

            config
                .load_(obj)
                .then((cfg) => {
                    cfg.should.have.keys('key', 'key2', 'newKey');
                    cfg.should.not.have.keys('[${newKey}]');
                    cfg['key'].should.be.exactly('Hello Bob, welcome to Sydney!');
                    cfg['key2'].should.have.keys('array', 'object');
                    cfg['key2']['array'][0].should.equal('value1: 10');
                    cfg['key2']['array'][1].should.equal('value2: 20');
                    cfg['key2']['array'][2].should.equal('sum: 30');
                    cfg['key2']['object'].should.have.keys('non', 'itpl');
                    cfg['key2']['object']['non'].should.equal('nothing');
                    cfg['key2']['jsv1'].should.be.exactly(200);
                    cfg['key2']['jsv2'].should.equal('Bob Sydney');
                    cfg['key2']['jsv3'].should.equal('Bob - Sydney');
                    (typeof cfg['key2']['fn']).should.equal('function');
                    cfg['key2']['fn'](obj).should.equal('Bob Sydney!');
                    cfg['newKey'].should.equal('ok');

                    done();
                })
                .catch(done);
        });

        it('rewrite config', function (done) {
            let config = new ConfigLoader(new EnvAwareYamlConfigProvider(cfgDir, 'test', 'production'));

            config
                .load_()
                .then((cfg) => {
                    config.provider.setItem('key9.key10', 'newly added');

                    return config.provider.save_();
                })
                .then(() => config.reload_())
                .then((cfg2) => {
                    cfg2.should.have.keys('key1');
                    cfg2['key1'].should.have.keys('key1_1', 'key1_3');
                    cfg2['key1']['key1_1'].should.be.eql({ key1_1_2: 'value1_1_2_override', key1_1_1: 'value1_1_1' });

                    let value = config.provider.getItem('key9.key10');
                    value.should.equal('newly added');

                    delete config.provider._envConfigProvider.config.key9;
                    value = config.provider._envConfigProvider.getItem('key9.key10');
                    should.not.exist(value);

                    return config.provider.save_();
                })
                .then(() => done())
                .catch(done);
        });
    });
});

import _ from 'lodash';
import Benchmark from 'benchmark';

async function benchmark_(mapOfMethods, payload) {
    const suite = new Benchmark.Suite();

    _.each(mapOfMethods, (f, name) => {
        suite.add(name, function () {
            f(payload);
        });
    });

    return new Promise((resolve, reject) => {
        suite
            .on('cycle', (event) => {
                const cycleMessage = String(event.target);
                console.log(cycleMessage);
            })
            .on('complete', function () {
                const completeMessage = 'The fastest is ' + this.filter('fastest').map('name');
                console.log(completeMessage);
                resolve();
            })
            .on('error', (event) => reject(String(event.target)))
            .run({ async: true });
    });
}

export default benchmark_;

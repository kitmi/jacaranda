import { cmd } from '@kitmi/sys';
import path from 'node:path';

describe('test-benchmark', function () {
    const files = ['./benchmarkCase1.js'/*, './benchmarkCase2.js'*/];

    files.forEach((fileName, index) => {
        it(`node and bun ${index}`, async function () {
            const testees = {
                node: (file) => cmd.runSync(`node ${file}`),
                bun: (file) => cmd.runSync(`bun ${file}`),
            };

            const verify = (result) => {
                return result.trim() === 'done.';
            };

            const file = path.relative(process.cwd(), path.resolve(__dirname, fileName));

            await jacat.benchmark_(testees, verify, file);
        });
    });
});

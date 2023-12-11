import { cmd } from '@kitmi/sys';
import path from 'node:path';

describe.only('test-profiling', function () {
    it(`benchmarkCase1`, async function () {
        await jacat.profile_('benchmarkCase1', () => {
            const file = path.relative(process.cwd(), path.resolve(__dirname, './benchmarkCase1.js'));
            cmd.runSync(`node ${file}`);
        });
    });
});

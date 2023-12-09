import dbgGetCallerFile from '@kitmi/utils/dbgGetCallerFile';
import path from 'node:path';
import { fs } from '@kitmi/sys';

export default function loadFixtures(testCase) {
    const callerFileName = dbgGetCallerFile();
    const baseName = path.basename(callerFileName, '.spec.js');
    const testCaseDir = path.resolve('./test/fixtures', baseName);

    if (!fs.existsSync(testCaseDir)) {
        throw new Error('Fixtures directory not exist: ' + testCaseDir);
    }

    const files = fs.readdirSync(testCaseDir);
    files.forEach((fixtureFile) => {
        const fixtureFilePath = path.join(testCaseDir, fixtureFile);
        const testCaseName = path.basename(fixtureFilePath, '.json');
        const testCaseData = fs.readJsonSync(fixtureFilePath);

        it(testCaseName, () => testCase(testCaseData));
    });
}

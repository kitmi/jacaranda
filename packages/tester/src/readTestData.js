import yaml from 'yaml';
import { fs } from '@kitmi/sys';

function readTestData(fixtureFilePath, fixtureType) {
    const fileContent = fs.readFileSync(fixtureFilePath, 'utf8');
    if (fixtureType === 'json') {
        return JSON.parse(fileContent);
    } else if (fixtureType === 'yaml') {
        return yaml.parse(fileContent);
    } else {
        throw new Error('Unsupported fixture type: ' + fixtureType);
    }
}

export default readTestData;

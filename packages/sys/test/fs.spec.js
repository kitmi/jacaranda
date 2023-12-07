import { isDir, isDir_, isDirEmpty, isDirEmpty_ } from '../src/fsUtils';
import fs from 'fs-extra';

describe('unit:fs', function () {
    it('fs isDir', function () {
        assert.isNotOk(isDir(__filename));
        assert.isOk(isDir(__dirname));
    });

    it('fs isDir_', async function () {
        assert.isNotOk(await isDir_(__filename));
        assert.isOk(await isDir_(__dirname));
    });

    it('fs isDirEmpty', function () {
        assert.isNotOk(isDirEmpty(__dirname));

        fs.mkdirSync(__dirname + '/test');
        assert.isOk(isDirEmpty(__dirname + '/test'));
        fs.rmdirSync(__dirname + '/test');
    });

    it('fs isDirEmpty_', async function () {
        assert.isNotOk(await isDirEmpty_(__dirname));
        fs.mkdirSync(__dirname + '/test');
        assert.isOk(await isDirEmpty_(__dirname + '/test'));
        fs.rmdirSync(__dirname + '/test');
    });
});

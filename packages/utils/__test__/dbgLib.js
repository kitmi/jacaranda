import dbgGetCallerFile from '../src/dbgGetCallerFile';

function mockFn() {
    const file = dbgGetCallerFile();

    return file;
}

export default mockFn;

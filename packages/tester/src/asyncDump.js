import { createHook } from 'node:async_hooks';
import { stackTraceFilter } from 'mocha/lib/utils';
import path from 'node:path';
import fs from 'node:fs/promises';
const allResources = new Map();

// this will pull Mocha internals out of the stacks
const filterStack = stackTraceFilter();

const hook = createHook({
    init(asyncId, type, triggerAsyncId) {
        allResources.set(asyncId, { type, triggerAsyncId, stack: new Error().stack });
    },
    destroy(asyncId) {
        allResources.delete(asyncId);
    },
    promiseResolve(asyncId) {
        allResources.delete(asyncId);
    },
}).enable();

const asyncDump = async (dumpFile) => {
    hook.disable();

    const logs = [];

    allResources.forEach((value) => {
        const filteredStack = filterStack(value.stack);
        if (filteredStack.includes('at promiseInitHookWithDestroyTracking')) {
            // ignore promiseInitHookWithDestroyTracking
            return;
        }

        logs.push(`Type: ${value.type}`);
        logs.push(filteredStack);
        logs.push('\n');
    });

    dumpFile = path.resolve(process.cwd(), dumpFile || './async-dump.log');
    await fs.writeFile(dumpFile, logs.join('\n'), 'utf8');
    console.log(`Async dump written to ${dumpFile}`);
};

export default asyncDump;

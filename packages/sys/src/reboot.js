import childProcess from 'node:child_process';

/**
 * Restart the current process.
 * @param {Object} envVariables - Environment variables
 */
const reboot = (envVariables) => {
    let processOptions = {
        env: { ...process.env, ...envVariables },
        detached: true,
        stdio: 'ignore',
    };

    let cp = childProcess.spawn(process.argv[0], process.argv.slice(1), processOptions);
    cp.unref();
    process.exit(0);
};

export default reboot;

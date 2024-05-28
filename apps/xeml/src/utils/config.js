const path = require('node:path');
const fs = require('node:fs');

exports.readConfig_ = async function (configFile) {
    const configFullPath = path.resolve(configFile);

    if (!fs.existsSync(configFullPath)) {
        throw new Error(`Config "${configFile}" not found! cwd: ${process.cwd()}`);
    }

    
}
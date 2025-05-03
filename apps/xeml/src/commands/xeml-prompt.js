const path = require('node:path');
const { fs, cmd } = require('@kitmi/sys');
const { _, eachAsync_, isEmpty, sleep_ } = require('@kitmi/utils');
const { globSync } = require('glob');
const { getPackageRoot } = require('../utils/helpers');

/**
 * Build database scripts and entity models from xeml files.
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} build`);
    
    const outputFile = path.resolve(app.options.argv['o']);
    let content = '<entities>\n';

    const modelService = app.getService('dataModel');
    _.each(modelService.config.dependencies, (pkg, namespace) => {
        const basePath = path.join(getPackageRoot(pkg), 'xeml');
        const scanPath = path.join('**', '*.xeml');
        const files = globSync(scanPath, { cwd: basePath });
        if (files.length > 0) {
            content += `<namespace name="${namespace}">\n`;

            files.forEach(file => {
                const fileContent = fs.readFileSync(path.join(basePath, file), 'utf-8');
                if (fileContent.includes('\nschema ')) {
                    return;
                }

                const moduleName = file.slice(0, -5);

                content += `<module name="${moduleName}">\n<![CDATA[\n${fileContent}\n]]>\n</module>\n`;
            });            

            content += `</namespace">\n`;
        }
    });        

    content += `</entities">\n`;

    await fs.writeFile(outputFile, content, 'utf-8');
};

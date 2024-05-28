const { fs } = require("@genx/sys");
const { template } = require("@genx/july");

module.exports = async (templateFile, destFile, variables) => {
    let templateContent = await fs.readFile(templateFile, "utf8");
    let content = template(templateContent, variables);
    await fs.outputFile(destFile, content, "utf8");
};

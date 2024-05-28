const { cmd } = require("@genx/sys");

module.exports = async (app, targetPath, packages) => {
    const lastCwd = process.cwd();
    process.chdir(targetPath);

    app.log("info", "Installing dependencies...");

    try {
        await cmd.runLive_(
            "npm",
            ["install", ...(packages ?? [])],
            (data) => {
                app.log("verbose", data.toString());
            },
            (data) => {
                app.log("error", data.toString());
            }
        );

        app.log("info", "Installed all dependencies.");
    } finally {
        process.chdir(lastCwd);
    }
};

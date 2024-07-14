/**
 * Create pull request
 * @param {ServiceContainer} app
 * @returns {Promise}
 */
module.exports = async (app) => {
    app.log('verbose', `${app.name} pr`);

    const { owner, repo, pr } = app.commandLine.argv;
    const prNumber = parseInt(pr, 10);
    if (isNaN(prNumber)) {
        throw new Error(`Invalid pull request number "${pr}".`);
    }

    const gitea = app.getService('gitea');

    let prData;

    try {
        const res = await gitea.repos.repoGetPullRequest(owner, repo, prNumber);
        prData = res.data;
    } catch (e) {
        if (e instanceof Error) {
            throw e;
        }

        throw new Error(`Failed to get pull request, status: ${e.status}, text: ${e.statusText}`);
    }

    if (!prData.mergeable) {
        throw new Error(`Pull request #${prNumber} is not mergeable.`);
    }

    try {
        await gitea.repos.repoMergePullRequest(owner, repo, pr.number, {
            Do: 'merge',
        });
    } catch (e) {
        if (e instanceof Error) {
            throw e;
        }

        throw new Error(`Failed to merge pull request, status: ${e.status}, text: ${e.statusText}`);
    }

    app.log('info', `Successfully merged pull request.`, {
        id: prData.id,
        index: prData.number,
        url: prData.url,
    });
};

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

    const { data: prData } = await gitea.repos.repoGetPullRequest(owner, repo, prNumber);

    if (!prData.mergeable) {
        throw new Error(`Pull request #${prNumber} is not mergeable.`);
    }

    await gitea.repos.repoMergePullRequest(owner, repo, prNumber, {
        Do: 'merge',
    });

    app.log('info', `Successfully merged pull request.`, {
        id: prData.id,
        index: prData.number,
        url: prData.url,
    });
};

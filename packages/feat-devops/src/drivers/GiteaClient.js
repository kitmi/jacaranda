import { giteaApi } from 'gitea-js';
import GitClientInterface from './GitClientInterface';

const { Buffer } = globalThis;

export default class GiteaClient extends GitClientInterface {
  constructor() {
    super();
    this.api = null;
  }

  initialize(config) {
    this.api = giteaApi(config.host, { token: config.token })
  }

  async createRepository(name, { privateRepo = false, namespace = null } = {}) {
    if (!this.api) throw new Error('Client not initialized');
  
    const options = { name, private: privateRepo };
  
    if (namespace === null) {
      return await this.api.user.createCurrentUserRepo(options);
    } else {
      // 假设 namespace 是组织名，直接尝试创建组织仓库
      try {
        return await this.api.orgs.createOrgRepo(namespace, options);
      } catch (err) {
        // 如果失败，尝试管理员创建（需根据实际错误码区分）
        return await this.api.admin.adminCreateRepo(namespace, options);
      }
    }
  }

  async getRepositories({ perPage = 20, page = 1 } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.repos.repoSearch({ limit: perPage, page });
  }

  async getRepository(project) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoGet({ owner, repo });
  }

  async getUser() {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.user.userGetCurrent();
  }

  async getBranches(project, { perPage = 20, page = 1 } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoListBranches({ owner, repo, limit: perPage, page });
  }

  async createBranch(project, branchName, ref) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoCreateBranch({ owner, repo, branch_name: branchName, old_branch_name: ref });
  }

  async push(project, branch, filePath, content, message = `Add ${filePath}`) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoCreateFile({
      owner,
      repo,
      filepath: filePath,
      branch,
      content: Buffer.from(content).toString('base64'),
      message,
    });
  }

  async createPullRequest(project, sourceBranch, targetBranch, title, { description = '' } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoCreatePullRequest({
      owner,
      repo,
      head: sourceBranch,
      base: targetBranch,
      title,
      body: description,
    });
  }

  async getPullRequests(project, { perPage = 20, page = 1, state = 'all' } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    const [owner, repo] = project.split('/');
    return await this.api.repos.repoListPullRequests({ owner, repo, limit: perPage, page, state });
  }
}

import { Gitlab } from '@gitbeaker/rest';
import GitClientInterface from './GitClientInterface';

export default class GitLabClient extends GitClientInterface {
  constructor() {
    super();
    this.api = null;
  }

  initialize(config) {
    this.api = new Gitlab({
      host: config.host,
      token: config.token,
    });
  }

  // 辅助方法：将字符串形式的 namespace 解析为 namespace_id
  async resolveNamespace(namespace) {
    if (!this.api) throw new Error('Client not initialized');

    // 如果 namespace 已经是数字，直接返回
    if (typeof namespace === 'number') return namespace;

    // 如果是字符串，尝试通过 /namespaces API 查找
    const namespaces = await this.api.Namespaces.all({ search: namespace });
    const matchedNamespace = namespaces.find((ns) => ns.path === namespace || ns.name === namespace);

    if (!matchedNamespace) {
      throw new Error(`Namespace "${namespace}" not found`);
    }

    return matchedNamespace.id;
  }

  async createRepository(name, { privateRepo = false, namespace = null } = {}) {
    if (!this.api) throw new Error('Client not initialized');

    const options = {
      name,
      visibility: privateRepo ? 'private' : 'public',
    };

    // 处理 namespace
    if (namespace !== null) {
      // 将字符串形式的 namespace 转换为 namespace_id
      options.namespace_id = await this.resolveNamespace(namespace);
    } else {
      // 默认使用当前用户的 namespace_id
      const user = await this.getUser();
      options.namespace_id = user.id;
    }

    return await this.api.Projects.create(options);
  }

  async getRepositories({ perPage = 20, page = 1 } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Projects.all({ perPage, page });
  }

  async getRepository(project) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Projects.show(project);
  }

  async getUser() {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Users.current();
  }

  async getBranches(project, { perPage = 20, page = 1 } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Branches.all(project, { perPage, page });
  }

  async createBranch(project, branchName, ref) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Branches.create(project, branchName, ref);
  }

  async push(project, branch, filePath, content, message = `Add ${filePath}`) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.Commits.create({
      projectId: project,
      branch,
      commit_message: message,
      actions: [{ action: 'create', file_path: filePath, content }],
    });
  }

  async createPullRequest(project, sourceBranch, targetBranch, title, { description = '' } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.MergeRequests.create(project, {
      source_branch: sourceBranch,
      target_branch: targetBranch,
      title,
      description,
    });
  }

  async getPullRequests(project, { perPage = 20, page = 1, state = 'all' } = {}) {
    if (!this.api) throw new Error('Client not initialized');
    return await this.api.MergeRequests.all(project, { perPage, page, state });
  }
}

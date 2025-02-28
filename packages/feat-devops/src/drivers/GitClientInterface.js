export default class GitClientInterface {
    initialize(config) {
      throw new Error('Method not implemented');
    }
  
    async getRepositories({ perPage = 20, page = 1 } = {}) {
      throw new Error('Method not implemented');
    }
  
    async getRepository(project) {
      throw new Error('Method not implemented');
    }
  
    async createRepository(name, { privateRepo = false, namespace = null } = {}) {
      throw new Error('Method not implemented');
    }
  
    async getUser() {
      throw new Error('Method not implemented');
    }
  
    async getBranches(project, { perPage = 20, page = 1 } = {}) {
      throw new Error('Method not implemented');
    }
  
    async createBranch(project, branchName, ref) {
      throw new Error('Method not implemented');
    }
  
    async push(project, branch, filePath, content, message = `Add ${filePath}`) {
      throw new Error('Method not implemented');
    }
  
    async createPullRequest(project, sourceBranch, targetBranch, title, { description = '' } = {}) {
      throw new Error('Method not implemented');
    }
  
    async getPullRequests(project, { perPage = 20, page = 1, state = 'all' } = {}) {
      throw new Error('Method not implemented');
    }
  }
  
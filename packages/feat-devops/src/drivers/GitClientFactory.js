import GiteaClient from './GiteaClient';
import GitLabClient from './GitLabClient';

// 客户端类型映射
const CLIENT_TYPES = {
    gitea: GiteaClient,
    gitlab: GitLabClient
};

class GitClientFactory {
    /**
     * 创建 Git 客户端
     * @param {string} type - 客户端类型
     * @returns {Object} Git 客户端实例
     */
    static createClient(type) {
        const ClientClass = CLIENT_TYPES[type.toLowerCase()];
        
        if (!ClientClass) {
            throw new Error(`不支持的 Git 客户端类型: ${type}`);
        }
        
        return new ClientClass();
    }
    
    /**
     * 注册新的客户端类型
     * @param {string} type - 客户端类型
     * @param {Class} ClientClass - 客户端类
     */
    static registerClientType(type, ClientClass) {
        CLIENT_TYPES[type.toLowerCase()] = ClientClass;
    }
}

export default GitClientFactory;
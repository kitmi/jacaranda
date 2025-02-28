import { Feature, DeferredService } from '@kitmi/jacaranda';

const { console } = globalThis;

/**
 * 创建 Git 服务
 * @param {Object} client - Git 客户端实例
 * @returns {Object} 服务对象
 */
export function createGitService(client, extraServices = {}, logger = console) {
    // 添加错误处理
    const wrapMethod = (method, methodName) => {
        return async (...args) => {
            try {
                logger.log?.('info', `执行 Git 操作: ${methodName}`, { args });
                const result = await method(...args);
                logger.log?.('info', `Git 操作成功: ${methodName}`);
                return result;
            } catch (error) {
                const context = {
                    method: methodName,
                    args: args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg) : arg
                    ).join(', '),
                    originalError: error.message ?? error?.error?.message
                };
                
                logger.log?.('error', `Git 操作失败:`, context);
                
                const enhancedError = new Error(`Git 操作 ${methodName} 失败: ${error.message ?? error?.error?.message}`);
                enhancedError.originalError = error;
                enhancedError.context = context;
                throw enhancedError;
            }
        };
    };

    const wrappedServices = { client };
    
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client))
        .filter(name => 
            name !== 'constructor' && 
            typeof client[name] === 'function' && 
            !name.startsWith('_')
        );
    
    for (const methodName of methods) {
        wrappedServices[methodName] = wrapMethod(
            (...args) => client[methodName](...args), 
            methodName
        );
    }
    
    const aliases = {
        'createRepository': 'createRepo',
        'getRepositories': 'getRepos',
        'getRepository': 'getRepo',
        'createPullRequest': 'pullRequest',
        'getPullRequests': 'getPullRequests'
        // 可以根据需要添加更多别名
    };
    
    for (const [original, alias] of Object.entries(aliases)) {
        if (wrappedServices[original] && !wrappedServices[alias]) {
            wrappedServices[alias] = wrappedServices[original];
        }
    }

    return {
        ...wrappedServices,
        ...extraServices
    };
}

/**
 * 创建 Git 服务特性
 * @param {Function} clientFactory - 创建客户端的工厂函数
 * @param {Object} extraConfig - 额外的配置项
 * @param {Object} extraServices - 额外的服务方法
 * @returns {Object} 特性对象
 */
export function createGitFeature(clientFactory, extraConfig = {}, extraServices = {}) {
    return {
        stage: Feature.SERVICE,
        groupable: true,
        load_: async function (app, opts, name) {
            const service = new DeferredService(() => {
                const config = app.featureConfig(
                    opts,
                    {
                        schema: {
                            url: { type: 'text' },
                            token: { type: 'text' },
                            ...extraConfig
                        },
                    },
                    name
                );

                const { client, extraClientServices } = clientFactory(config);
                return createGitService(client, { ...extraServices, ...extraClientServices }, app.logger);
            });

            app.registerService(name, service);
        }
    };
}
class DeferredService {
    constructor(serviceFactory) {
        this.instance = null;

        // 创建一个 Proxy 来拦截属性和方法访问
        return new Proxy(this, {
            get: (target, prop) => {
                // 延迟创建 service 实例
                if (!target.instance) {
                    target.instance = serviceFactory();
                }

                // 获取实例上的属性或方法
                const serviceInstanceProp = target.instance[prop];

                // 如果是方法，返回一个绑定到实例的方法
                if (typeof serviceInstanceProp === 'function') {
                    return serviceInstanceProp.bind(target.instance);
                }

                // 否则返回属性值
                return serviceInstanceProp;
            },

            set: (target, prop, value) => {
                if (!target.instance) {
                    target.instance = serviceFactory();
                }
                target.instance[prop] = value;
                return true;
            },
        });
    }
}

export default DeferredService;

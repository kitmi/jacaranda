class DbModel {
    constructor(ownerModule, db, name) {
        this.db = db;
        this.ownerModule = ownerModule;
        this.name = name;
        this.model = db[this.name];
    }

    async retryCreate_(createOptions, onDuplicate_, maxRetry) {
        maxRetry || (maxRetry = 99);
        let retry = 0;
        let error;

        while (retry++ < maxRetry) {
            try {
                return await this.model.create(createOptions);
            } catch (err) {
                //P2002: Unique constraint failed
                if (err.code !== this.E_CODE_DUPLICATE) {
                    throw err;
                }

                createOptions = await onDuplicate_(createOptions);
                error = err;
            }
        }

        throw error;
    }

    async getCachedUnique_(key, query, ttl) {
        const cacheService = this.db._$env.cacheService;
        const cacheKey = `db:${this.name}:${key}`;
        return cacheService.get_(cacheKey, () => modelInstance.model.findUnique(query), ttl);
    }

    async getCachedMany_(key, findMany, ttl) {
        const cacheService = this.db._$env.cacheService;
        const cacheKey = `db:${this.name}:${key}`;
        return cacheService.get_(cacheKey, () => modelInstance.model.findMany(findMany), ttl);
    }
}

export class PrismaModel extends DbModel {
    E_CODE_DUPLICATE = 'P2002';
}

export default DbModel;
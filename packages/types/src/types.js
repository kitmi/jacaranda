import { InvalidArgument, ValidationError, ApplicationError } from './errors';

let counter = 0;

const defaultTypeClasses = [];
const defaultPlugins = [];

export class TypeSystem {
    primitives = new Set();
    scalarTypes = new Set();
    plugins = {};
    types = {};
    sanitize = this.callType('sanitize');
    sanitize_ = this.callType('sanitize_');
    serialize = this.callType('serialize');
    validate = this.callType('validate');

    constructor() {
        this._counter = counter++;
    }

    static fromDefault() {
        const ts = new TypeSystem();

        defaultTypeClasses.forEach(({ name, TypeMeta }) => {
            ts.addType(name, TypeMeta);
        });

        defaultPlugins.forEach(({ name, plugin }) => {
            ts.addPlugin(name, plugin);
        });

        return ts;
    }

    addPlugin(name, plugin) {
        this.plugins[name] = plugin;
    }

    removePlugin(name) {
        delete this.plugins[name];
    }

    _addType(name, typeMeta) {
        if (name in this.types) {
            throw new ApplicationError(`Type "${name}" already exist.`, { name });
        }

        this.types[name] = typeMeta;
        if (typeMeta.primitive) {
            this.primitives.add(name);
        }
        if (typeMeta.scalar) {
            this.scalarTypes.add(name);
        }
    }

    addType(name, TypeMeta) {
        const typeMeta = new TypeMeta(this);

        typeMeta.sanitize = (value, meta, i18n, path) => {
            meta = { type: typeMeta.name, ...meta };
            const opts = { rawValue: value, i18n, path, system: this };
            const [isDone, sanitized] = this.beginSanitize(value, meta, opts);
            return this.endSanitize(isDone ? sanitized : typeMeta._sanitize(value, meta, opts), meta, opts);
        };

        typeMeta.sanitize_ = async (value, meta, i18n, path) => {
            meta = { type: typeMeta.name, ...meta };
            const opts = { rawValue: value, i18n, path, system: this };
            const [isDone, sanitized] = await this.beginSanitize(value, meta, opts);
            return this.endSanitize(
                isDone
                    ? sanitized
                    : typeMeta._sanitizeAsync
                    ? await typeMeta._sanitizeAsync(value, meta, opts)
                    : typeMeta._sanitize(value, meta, opts),
                meta,
                opts
            );
        };

        this._addType(name, typeMeta);
        this._addType(typeMeta.name, typeMeta);

        typeMeta.alias?.forEach((a) => {
            this._addType(a, typeMeta);
        });
    }

    callType(method) {
        return (value, typeInfo, i18n, fieldPath) => {
            if (typeInfo.type == null) {
                throw new InvalidArgument(`Missing type info: ${JSON.stringify(typeInfo)}`);
            }

            if (!this.primitives.has(typeInfo.type)) {
                throw new InvalidArgument(`Unsupported primitive type: "${typeInfo.type}".`);
            }

            const typeObject = this.types[typeInfo.type];            
            return typeObject[method](value, typeInfo, i18n, fieldPath);
        };
    }

    safeJsonStringify(value) {
        const bigintWriter = this.plugins['bigintWriter'];
        if (bigintWriter) {
            const replacer = (_, value) => (typeof value === 'bigint' ? bigintWriter(value) : value);

            return JSON.stringify(value, replacer);
        }

        return JSON.stringify(value);
    }

    getStringifier() {
        const bigintWriter = this.plugins['bigintWriter'];
        if (bigintWriter) {
            return (value) => (typeof value === 'bigint' ? bigintWriter(value) : value.toString());
        }

        return null;
    }

    beginSanitize(value, meta, opts) {
        if (value == null) {
            if (meta.default != null) {
                return [true, meta.default];
            } else if (meta.optional) {
                return [true, null];
            }

            throw new ValidationError('Missing a required value.', {
                value,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path,
            });
        }

        if (meta.rawValue) return [true, value];

        // more prerequisites here ...
        if (this.plugins.preProcess) {
            return this.plugins.preProcess(value, meta, opts);
        }

        return [false];
    }

    endSanitize(value, meta, opts) {
        if (this.scalarTypes.has(meta.type)) {
            this.verifyEnum(value, meta, opts);
        }

        if (this.plugins.postProcess) {
            return this.plugins.postProcess(value, meta, opts);
        }

        return value;
    }

    verifyEnum(value, meta, opts) {
        if (meta.enum && !meta.enum.includes(value)) {
            throw new ValidationError('Invalid enum value.', {
                value,
                meta,
                rawValue: opts.rawValue,
                i18n: opts.i18n,
                path: opts.path,
            });
        }
    }
}

const defaultTypeSystem = new TypeSystem();

export const addType = (name, TypeMeta) => {
    defaultTypeSystem.addType(name, TypeMeta);
    defaultTypeClasses.push({ name, TypeMeta });
};

export const addPlugin = (name, plugin) => {
    defaultTypeSystem.addPlugin(name, plugin);
    defaultPlugins.push({ name, plugin });
};

export const createTypeSystem = (emptySystem) => {
    return emptySystem ? new TypeSystem() : TypeSystem.fromDefault();
};

export const Types = defaultTypeSystem.types;

// compatibility
Types.sanitize = defaultTypeSystem.sanitize.bind(defaultTypeSystem);
Types.sanitize_ = defaultTypeSystem.sanitize_.bind(defaultTypeSystem);
Types.serialize = defaultTypeSystem.serialize.bind(defaultTypeSystem);
Types.primitives = defaultTypeSystem.primitives;

export const charsets = {
    up_letter_num: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    low_letter_num: '0123456789abcdefghijklmnopqrstuvwxyz',
    up_letter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    low_letter: 'abcdefghijklmnopqrstuvwxyz',
    url_safe_all: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_',
};

export default defaultTypeSystem;

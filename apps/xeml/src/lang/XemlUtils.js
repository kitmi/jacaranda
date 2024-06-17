const { _ } = require('@kitmi/utils');
const pluralize = require('pluralize');

class Clonable {
    linked = false;

    clone() {      
        if (!this.linked) {
            throw new Error('An element becomes clonable only after being linked.');
        }
    }
}

const deepClone = (value) => _.cloneDeepWith(value, el => (el instanceof Clonable) ? el.clone() : undefined);

const deepCloneField = (src, dest, field) => {
    if (field in src) dest[field] = deepClone(src[field]);
};

const isDotSeparateName = (name) => (name.indexOf('.') > 0);

const isIdWithNamespace = (name) => (name.indexOf(':') > 0);

const extractNamespace = (name) => { 
    const pos = name.lastIndexOf(':');
    return [ name.substring(0, pos), name.substring(pos+1) ];
};

const extractDotSeparateName = (name) => name.split('.');

const extractReferenceBaseName = (name) => extractDotSeparateName(name).pop();

const prefixNaming = (prefix, name) => {
    let leftParts = _.kebabCase(prefix).split('-');
    let rightParts = _.kebabCase(extractReferenceBaseName(name)).split('-');
    
    let reservedLeft, reservedRight;

    if (leftParts.length > rightParts.length) {
        reservedLeft = leftParts.splice(0, leftParts.length - rightParts.length);
        reservedRight = [];
    } else {
        reservedLeft = [];
        reservedRight = rightParts.splice(leftParts.length, rightParts.length - leftParts.length);
    }

    const combine = () => _.camelCase(reservedLeft.concat(leftParts).concat(reservedRight).join('-'));

    if (_.isEqual(leftParts, rightParts)) {
        return combine();
    }
    
    while (leftParts.length > 0) {
        reservedLeft.push(leftParts.shift());
        reservedRight.unshift(rightParts.pop());
        if (_.isEqual(leftParts, rightParts)) {
            break;
        }
    } 

    return combine();
};

const getReferenceNameIfItIs = (obj) => {
    if (_.isPlainObject(obj) && obj.$xt === 'ObjectReference') {
        return extractDotSeparateName(obj.name)[0];
    }

    return undefined;
};

exports.parseReferenceInDocument = (schema, doc, ref) => {    
    let parts = ref.split('.');
    let parent;
    let l = parts.length;
    let entityNode, entity, field;
    
    for (let i = 0; i < l; i++) {
        let p = parts[i];
        
        if (!entityNode) {
            if (doc.entity === p) {
                entityNode = doc;
                continue;
            }

            throw new Error(`Reference by path "${ref}" not found in given document.`);
        }

        if (entityNode && p[0] === '$') {
            entity = schema.entities[entityNode.entity];
            let attr = entity.getEntityAttribute(p);

            if (attr instanceof Field) {
                field = attr;
                if (i !== l-1) {
                    throw new Error(`Reference by path "${ref}" not found in given document.`);
                }

                return {
                    entityNode,
                    entity,
                    field
                };
            } else {
                parent = attr;
            }

            continue;
        }
        
        if (parent) {
            parent = parent[p];
        } else {
            if (i === l-1) {
                //last part
                entity = schema.entities[entityNode.entity];
                field = entity.getEntityAttribute(p);

                return {
                    entityNode,
                    entity,
                    field
                };
            }

            entityNode = entityNode.subDocuments && entityNode.subDocuments[p];
            if (!entityNode) {
                throw new Error(`Reference by path "${ref}" not found in given document.`);
            }
        }
    }

    if (!field) {
        if (typeof parent !== 'string') {
            throw new Error(`Reference by path "${ref}" not found in given document.`);
        }

        if (!entity) {
            throw new Error(`Reference by path "${ref}" not found in given document.`);
        }

        field = entity.getEntityAttribute(parent);
        if (!(field instanceof Field)) {
            throw new Error(`Reference by path "${ref}" not found in given document.`);
        }
    }
    
    return {
        entityNode,
        entity,
        field
    };
};

exports.pluralize = (name) => {
    let parts = _.kebabCase(name).split('-');
    let last = pluralize(parts.pop().toLowerCase());
    parts.push(last);
    return _.camelCase(parts.join('-'));
};

exports.deepClone = deepClone;
exports.deepCloneField = deepCloneField;
exports.isIdWithNamespace = isIdWithNamespace;
exports.isDotSeparateName = isDotSeparateName;
exports.extractNamespace = extractNamespace;
exports.extractDotSeparateName = extractDotSeparateName;
exports.extractReferenceBaseName = extractReferenceBaseName;
exports.getReferenceNameIfItIs = getReferenceNameIfItIs;
exports.schemaNaming = name => _.camelCase(name);
exports.entityNaming = name => _.camelCase(name);
exports.fieldNaming = name => _.camelCase(name);
exports.prefixNaming = prefixNaming;
exports.generateDisplayName = name => _.startCase(name);
exports.formatFields = field => Array.isArray(field) ? field.join(', ') : field;
exports.Clonable = Clonable;
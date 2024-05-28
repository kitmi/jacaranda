const { Types } = require('@genx/data');
const { _, pascalCase }  = require('@genx/july');

const mapOfGemlTypesToGraphQL = {
    'integer': 'Int',
    'number': 'Float',
    'text': 'String',
    'boolean': 'Boolean'
};

function toGraphQLType(fieldMeta) {
    const result = {};

    switch (fieldMeta.type) {
        case 'datetime': 
            result.newType = 'Date';
            result.typeName = 'scalar';
            result.type = result.newType;
            break;

        case 'enum':
            result.newType = pascalCase(fieldMeta.subClass && fieldMeta.subClass.length > 0 ? _.last(fieldMeta.subClass) : fieldMeta.name);
            result.typeName = 'enum';
            result.values = fieldMeta.values;
            result.type = result.newType;
            break;
        
        //todo: to support other elements
        case 'array':
            result.type = '[String!]';
            break;

        //todo: to support object schema    
        case 'object':
            result.type = 'String';
            break;
        
        case 'binary':
            result.newType = 'Blob';
            result.typeName = 'scalar';
            result.type = result.newType;
            break;    

        default:
            const scalarType = mapOfGemlTypesToGraphQL[fieldMeta.type];
            if (scalarType) {
                result.type = scalarType;
            } else {
                throw new Error(`Invalid field type: ${fieldMeta.type}`);
            }
    }

    if (!fieldMeta.optional) {
        result.type += '!';
    }

    return result;
}

exports.toGraphQLType = toGraphQLType;


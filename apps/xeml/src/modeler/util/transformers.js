const MAP_META_TO_MODIFIER = {
    fixedLength: 'length',
    maxLength: 'maxLength',
    minLength: 'minLength',
};

exports.INPUT_SCHEMA_DERIVED_KEYS = [
    'type',
    'noTrim',
    'emptyAsNull',
    'plain',
    'const',
    'encoding',
    'format',
    'schema',
    'element',
    'keepUnsanitized',
    'valueSchema',
    'delimiter',
    'csv',
    'enum',
];

exports.DATASET_FIELD_KEYS = [...exports.INPUT_SCHEMA_DERIVED_KEYS, 'optional', 'default'];

exports.fieldMetaToModifiers = (fieldMeta) => {
    const result = [];
    for (let key in fieldMeta) {
        const mapped = MAP_META_TO_MODIFIER[key];
        if (mapped) {
            result.push([`~${mapped}`, fieldMeta[key]]);
        }
    }

    return result;
};
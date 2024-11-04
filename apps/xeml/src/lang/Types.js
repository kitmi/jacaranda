const { createTypeSystem } = require('@kitmi/types');

const system = createTypeSystem();
const Types = system.types;

const commonQualifiers = [
    'code',
    'optional',
    'default',
    'auto',    
    'autoByDb',    
    'updateByDb',
    'fillByRule',
    'readOnly',
    'writeOnce',    
    'forceUpdate',
    'freezeAfterNonDefault',
    'comment',
    'displayName',
    'constraintOnUpdate',
    'constraintOnDelete',
];

Types.ASSOC_EXCLUDE_QUALIFIERS = [
    'code',
    'optional',
    'default',
    'auto',
    'autoByDb',
    'updateByDb',
    'fillByRule',
    'readOnly',
    'writeOnce',
    'forceUpdate',
    'freezeAfterNonDefault',
    'constraintOnUpdate',
    'constraintOnDelete',
    'hasActivator',
];

Types.RESERVED_QUALIFIERS = new Set(['name', 'type', 'modifiers', 'subClass']);

// array1: @kitmi/types qualifiers, array2: modeler qualifiers
Types.array.qualifiers = commonQualifiers.concat(['csv', 'delimiter', 'element'], ['fixedLength', 'vector']);
Types.bigint.qualifiers = commonQualifiers.concat(['enum'], ['unsigned']);
Types.binary.qualifiers = commonQualifiers.concat(['encoding'], ['fixedLength', 'maxLength']);
Types.boolean.qualifiers = commonQualifiers.concat([]);
Types.datetime.qualifiers = commonQualifiers.concat(['enum', 'format'], ['range']);
Types.integer.qualifiers = commonQualifiers.concat(['enum'], ['bytes', 'digits', 'unsigned']);
Types.number.qualifiers = commonQualifiers.concat(
    ['enum'],
    ['exact', 'totalDigits', 'decimalDigits', 'bytes', 'double']
);
Types.object.qualifiers = commonQualifiers.concat(['schema', 'valueSchema', 'keepUnsanitized'], ['jsonb']);
Types.text.qualifiers = commonQualifiers.concat(['emptyAsNull', 'enum', 'noTrim'], ['fixedLength', 'maxLength']);

module.exports = Types;

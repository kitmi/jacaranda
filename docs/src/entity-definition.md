# XEML Entity Definition Guide

XEML (XGENT.ai Entity Modeling Language).

## Overview

XEML is a domain-specific language for defining data entities, their relationships, and behaviors. It provides a concise way to describe database schemas, validation rules, and data transformations.

## Entity Structure

An entity definition in XEML typically contains the following sections, recommended to be defined in this order:

- **with**: Feature definitions that provide special capabilities to the entity and add required fields
- **has**: Field definitions
- **associations**: Relationship definitions
- **key**: Primary key definition (currently only supports single primary key)
- **index**: Non-foreign key indexes (foreign keys are automatically added in relationship definitions)
- **views**: Common output view dataset definitions (predefined field selections and joined relationships)
- **modifiers**: Entity owned modifiers (validator, processor and activator) definitions (e.g. `passwordHasher` as a processor)
- **data**: Predefined initialization data (excluding test data, which can be added manually in the migration directory)

## Inheritance

XEML supports inheritance for the following definitions:
- features
- fields
- key
- index
- views
- associations (when a relationship is inherited, the left side is automatically modified to the current entity)
- modifiers

Multiple inheritance is supported, with definitions applied in reverse order:

```xeml
entity A extends B, C
```

In this example, A first inherits definitions from C, then from B.

XEML also supports entity templates with generic parameters:

```xeml
// A closureTable template
entity closureTable(IdType)
  with
    autoId
  
  has
    ancestorId : IdType
    descendantId : IdType
    depth : integer

  index
    [ ancestorId, descendantId ] is unique

// Using the template
entity documentTable extends closureTable(bigint)
  associations
    refers to document on ancestorId
    refers to document on descendantId
```

## Features

Features provide special capabilities to entities and add required fields. They are treated specially in the database access layer.

### Syntax

```xeml
with 
    <feature_name>["(" [ <optional_parameters> ]  ")"]
    ...
```

### Examples

```xeml
with
  autoId
  createTimestamp
  updateTimestamp
  changeLog
```

With parameters:

```xeml
with
  autoId({ type: 'bigint' })
```

or

```xeml
with
  autoId({ type: 'uuid' })
```

### Available Features

- **atLeastOneNotNull**: Automatically checks that at least one of the specified fields is not null
  - Parameters: `fields` - Array or string of field names to check

- **autoId**: Auto-incrementing or auto-generated ID field
  - Parameters: `options` - Optional configuration object or string (field name)
    - `name` (default: 'id') - Field name
    - `type` (default: 'integer') - Field type ('integer', 'bigint', 'uuid')
    - `startFrom` - Starting value for auto-increment (for integer/bigint types)

- **changeLog**: Keeps track of changes made to the entity
  - Parameters: `options` - Optional configuration object
    - `storeEntity` (default: 'changeLog') - Entity to store change logs

- **createAfter**: Automatically creates associated entity after the main entity is created
  - Parameters: `relation, initData`
    - `relation` - Target associated entity anchor
    - `initData` - Optional initial data for the associated entity

- **createBefore**: Automatically creates associated entity before the main entity is created
  - Parameters: `relation, initData`
    - `relation` - Target associated entity anchor
    - `initData` - Optional initial data for the associated entity

- **createTimestamp**: Saves record creation time
  - Parameters: `options` - Optional configuration object or string (field name)
    - `name` (default: 'createdAt') - Field name
    - Other datetime field properties

- **hasClosureTable**: Automatically creates self-referencing closure table record with depth being 0
  - Parameters: `closureTable, orderField`
    - `closureTable` - Associated closure table name
    - `orderField` - Optional field for ordering

- **i18n**: Multilingual support
  - Parameters: `options`
    - `field` - Field name to internationalize
    - `locales` - Locale mapping object

- **isCacheTable**: Cache table feature with optional auto expiry
  - Parameters: `autoExpiry`
    - `autoExpiry` - Optional auto expiry configuration

- **logicalDeletion**: Logical deletion
  - Parameters: `options` - Optional configuration object or string (field name)
    - When string: Name for the deletion flag field (default: 'isDeleted')
    - When object: `{fieldName: value}` - Field and value to indicate deletion

- **stateTracking**: Tracks changes to state fields with `enum` property, recording state change times
  - Parameters: `options`
    - `field` - Field name with enum values to track
    - `reversible` - Whether state changes can be reversed

- **updateTimestamp**: Saves record update time
  - Parameters: `options` - Optional configuration object or string (field name)
    - `name` (default: 'updatedAt') - Field name
    - Other datetime field properties

- **userEditTracking**: Tracks user edits, recording the users who created and updated records
  - Parameters: `options`
    - `userEntity` (default: 'user') - User entity name
    - `uidSource` (default: 'state.user.id') - Source of user ID
    - `trackCreate` (default: 'createdBy') - Field to track creator
    - `trackUpdate` (default: 'updatedBy') - Field to track updater
    - `revisionField` (default: 'revision') - Field to track revision number
    - `addFieldsOnly` (default: false) - Only add fields without tracking
    - `migrationUser` - User ID for migration

Each feature provides specific functionality that can be applied to extend entity behavior in entity definitions. These features typically add additional fields, associations, or validation rules to entities.

## Field Definitions

### Basic Field Types

- **array**: Array/list of values
- **binary, blob, buffer**: Binary data
- **boolean, bool**: Boolean values
- **datetime, timestamp**: Date and time values
- **integer, int**: Integer numbers
- **bigint**: Large integers
- **number, float, decimal**: Decimal numbers
- **object, json**: JSON objects
- **string, text**: Text values

### Field Qualifiers

#### Common Qualifiers
- **code**: Reserved for database field name (currently uses the model-defined name by default)
- **optional**: Indicates the field is optional
- **default**: Default value
- **auto**: Field value generated automatically (implementation varies by database)
- **autoByDb**: True if generated by database internal mechanism
- **updateByDb**: True if field is automatically set by DB during updates
- **fillByRule**: Marks field to be filled when executing rules
- **readOnly**: Read-only field, typically provided by rules or database
- **writeOnce**: Field that can be written only once
- **forceUpdate**: Field updated on every entity modification
- **freezeAfterNonDefault**: Field locked after value changed to non-default
- **-- "comment"**: Database field comment (requires quotes)
- **displayName**: Display name for the field
- **constraintOnUpdate**: Constraint behavior on update
- **constraintOnDelete**: Constraint behavior on delete

#### Type-Specific Qualifiers

Different field types support different qualifiers:

- **array**: csv, delimiter, element, fixedLength, vector
- **bigint**: enum, unsigned
- **binary**: encoding, fixedLength, maxLength
- **datetime**: enum, format, range
- **integer**: enum, bytes, digits, unsigned
- **number**: enum, exact, totalDigits, decimalDigits, bytes, double
- **object**: schema, valueSchema, keepUnsanitized, jsonb
- **text**: emptyAsNull, enum, noTrim, fixedLength, maxLength

### Field Modifiers

Modifiers enhance fields with validation, processing, or generation capabilities:

- **Validators**: `|~name[(optional_params)]` - Validate field values
- **Processors**: `|>name[(optional_params)]` - Process field values
- **Generators**: `|=name[(optional_params)]` - Generate field values

#### Example

```xeml
password : text maxLength(200) |~strongPassword |>hashPassword(@latest.passwordSalt) -- "User password"

passwordSalt : text fixedLength(16) readOnly |=random -- "User password salt"
```

In this example:
- `passwordSalt` is a read-only field with a randomly generated 16-character string
- `password` is validated with `strongPassword` and processed with a custom `hashPassword` processor

## Relationship Definitions

### Single Reference (refers to)

```xeml
// Form 1 - References the primary key of the target entity
refers to <target_entity> [with <condition>] [[as <local_field>] [optional] [default(<value>)] [...modifiers] | [on <local_field>]]

// Form 2 - References a specific field of the target entity
refers to <target_field> of <target_entity> [with <condition>] [[as <local_field>] [optional] [default(<value>)] [...modifiers] | [on <local_field>]]
```

### One-to-Many (hasMany + belongsTo)

```xeml
// "One" side
belongs to <target_entity> [with <condition>] [[as <local_field>] [optional] [default(<value>)] [...modifiers] | [on <local_field>]]

// "Many" side
has many <target_entity> [being <target_field>]
```

### One-to-One (hasOne + belongsTo)

```xeml
// "One" side with foreign key
belongs to <target_entity> [with <condition>] [[as <local_field>] [optional] [default(<value>)] [...modifiers] | [on <local_field>]]

// "One" side without foreign key
has one <target_entity> [being <target_field>]
```

### Many-to-Many (hasMany + hasMany)

Many-to-many relationships can be defined either by manually creating a junction table or by letting XEML automatically generate one.

## Primary Key (key)

By default, the primary key is the first field or a field described in features (like `autoId`). You can explicitly specify it with:

```xeml
key <field_name>
```

## Indexes (index)

Define non-foreign key indexes (foreign keys are automatically added in relationship definitions):

```xeml
index
  <field> [is unique]
  "[" <field_array> "]" [is unique]
```

Remove an inherited index:

```xeml
index
  "-" (<field>|"[" <field_array> "]")
```

## Views

Define common output view dataset definitions:

```xeml
views
  <view_name>
    $select
```

## Initialization Data

Define predefined initialization data:

```xeml
data [<optional_dataset_name>] [in <environment>] [
    { ...key_value_pairs }
]
```

Example:

```xeml
data [
    { code: 'PUB', name: 'Public', desc: 'All user can see' },
    { code: 'CNT', name: 'Contact', desc: 'Only your contacts can see' },
    { code: 'PRI', name: 'Private', desc: 'Only yourself can see' }
]

data "test" in "development" [
    { code: 'PUB', name: 'Public', desc: 'All user can see' },
    { code: 'CNT', name: 'Contact', desc: 'Only your contacts can see' },
    { code: 'PRI', name: 'Private', desc: 'Only yourself can see' }
]
```

## Type Definitions

XEML allows defining reusable types:

```xeml
type
  idString : text maxLength(64) emptyAsNull 
  uuid : text fixedLength(36)
  shortName : text maxLength(60) emptyAsNull
  // ...
```

## Abstract Entities

Abstract entities serve as templates that can be extended by other entities:

```xeml
abstract entity dictionaryByAutoId            
  with 
    autoId({ startFrom: 100 })
    createTimestamp
    updateTimestamp
    logicalDeletion
    
  has 
    name
    desc 
  
  index
    name is unique
```

These abstract entities can be extended to create concrete entities with all the inherited features, fields, and behaviors.
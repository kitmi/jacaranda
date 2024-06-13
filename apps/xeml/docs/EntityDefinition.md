# Entity Definition

## Inheriance

## features

* Syntax: 

    ```
    with 
      <feature>["(" [ <list of options> ]  ")"]
      ...

* Available features
    * atLeastOneNotNull
    * autoId
    * createTimestamp
    * i18n
    * logicalDeletion
    * stateTracking
    * updateTimestamp

## fields

### field qualifier

* any
    * code
    * optional
    * default
    * auto
    * readOnly
    * writeOnce
    * forceUpdate

* int
    * bytes
    * digits    
    * unsigned

* number    
    * exact
    * totalDigits
    * decimalDigits

* text
    * fixedLength
    * maxLength
    * encoding

### field modifiers

* validator
    * syntax: |~
* processor
    * syntax: |>
* activator
    * syntax: |=

## relationship (associations)

* hasOne - user.profile
* hasMany - user.groups
* belongsTo - profile.user
* refersTo - profile.gender, entity.code     

 * hasMany/hasOne - belongsTo      
 * hasMany/hasOne - hasMany/hasOne [connectedBy] [with] 
 * hasMany/hasOne - hasMany/hasOne [being] [with] 
 * hasMany - semi connection       
 * refersTo - semi connection
 * refersTo <remote field> of <remote entity> [optional]


association_type_referee identifier_or_string (association_through)? (association_as)? type_info_or_not field_comment_or_not -> { type: $1, destEntity: $2, ...$3, ...$4, fieldProps: { ...$5, ...$6} }    
    | association_type_referee NEWLINE INDENT identifier_or_string association_cases_block (association_as)? type_info_or_not field_comment_or_not NEWLINE DEDENT -> { type: $1, destEntity: $4, ...$5, ...$6, fieldProps: { ...$7, ...$8 } }
    | belongs_to_keywords identifier_or_string (association_extra_condition)? (association_as)? type_info_or_not type_modifiers_or_not field_comment_or_not -> { type: $1, destEntity: $2, ...$3, ...$4, fieldProps: { ...$5, ...$6, ...$7 } }      
    | refers_to_keywords identifier_or_string (association_extra_condition)? (association_as)? type_info_or_not type_modifiers_or_not field_comment_or_not -> { type: $1, destEntity: $2, ...$3, ...$4, fieldProps: { ...$5, ...$6, ...$7 } }      
    | refers_to_keywords identifier_or_string "of" identifier_or_string (association_extra_condition)? (association_as)? type_info_or_not type_modifiers_or_not field_comment_or_not -> { type: $1, destEntity: $4, destField: $2, ...$5, ...$6, fieldProps: { ...$7, ...$8, ...$9 } }      

"type": "refersTo",
"destEntity": "auAddressInfo",
"srcField": "auAddress",
"fieldProps": {}

## key

## indexes

Index does not include foreign keys which are covered by associations.

## interface

### accept parameters

  * defined as a modifiable variable
  * defined by the type of an entity field

### do something

### return result

## data

    data [<data set name>] ["in" <runtime environment>] <collection>

### examples of data definition 

    data [
        { code: 'PUB', name: 'Public', desc: 'All user can see' },
        { code: 'CNT', name: 'Contact', desc: 'Only your contacts can see' },
        { code: 'PRI', name: 'Private', desc: 'Only yourself can see' }
    ]  


###
Activators will always applied when forceUpdate is set to true
# Entity Definition

## code

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
 * hasMany/hasOne - hasMany/hasOne [connectedBy] [connectedWith]
 * hasMany - semi connection       
 * refersTo - semi connection

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
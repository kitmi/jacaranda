# Todo Features

## Completed features

- [X] join with logicalDeletion
- [X] type with modifiers and hoisted field reference 
- [X] add qualifiers into validators
- [X] create or update by reference to related entity
- [X] closureTable general procedures
- [X] override entity with multiple namespaces
- [X] database migration
 
## Developing features

- [ ] directed graph with recersive query
- [ ] i18n feature
- [ ] input schema
- [ ] api generation
- [ ] predefined view
- [ ] add triggers for calculated fields 
- [ ] triggers for insert and update - (update timestamp finished)
- [ ] data template
- [ ] activator on update only
- [ ] api scheme

## Planned features

- detect closure table feature
- inherit hasMany (abstract & reverse replacement of base into subClass)
- aggregation with window functions
- select for update
- alias of entity for enabling plug&play of xeml module (e.g. @adminUser mapping to admin entity or adminAccount entity in different xeml modules)
## Features backlog

- Semantic condition translation
e.g. 
```
  query status=In-progress
  translate to status=Open or status=Pending
```

- Offline SQL generation

## Known issues

- [ ] saveIntermediate should not save JSON to dependency package
- [ ] modifiers from dependent package wrongly generated in the referencing package
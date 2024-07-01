# Todo Features

## Completed features

- [X] join with logicalDeletion
- [X] type with modifiers and hoisted field reference 
- [X] add qualifiers into validators
- [X] create or update by reference to related entity
- [X] closureTable general procedures
- [X] override entity with multiple namespaces
 
## Developing features

- [ ] database migration
- [ ] multiple override
- [ ] i18n feature
- [ ] input schema
- [ ] api generation
- [ ] predefined view
- [ ] add triggers for calculated fields 
- [ ] triggers for insert and update - (update timestamp finished)
- [ ] data template

## Planned features

- inherit hasMany (abstract & reverse replacement of base into subClass)
- aggregation with window functions
- select for update

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
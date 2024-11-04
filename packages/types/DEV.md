## sanitizer options

- rawValue
- root
- path
- i18n
  - locale
  - timezone
- system: TypeSystem instance

Note: options is only used in a type instance's internal sanitizer 

## sanitizer context (i.e. the path in old version)

- path
- root
- parent

Note: context is used for sanitizing child entries and post-processors
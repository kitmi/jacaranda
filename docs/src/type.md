# Jacaranda Types & Validation

In the realm of web development, JavaScript has long been the cornerstone language, driving both client-side and server-side interactions. However, JavaScript's type system is fundamentally based on variable types rather than the semantics of the values they hold. This discrepancy can lead to challenges when developers need to work with data that has a specific business context.

For instance, JavaScript treats a string containing a number ("123") as a string type, even though, semantically, it might represent an integer in a business context. Similarly, a date represented as a string ("2021-01-01") remains a string type, despite its semantic meaning as a date.

This discrepancy between type recognition and business logic necessitates a semantic type system that aligns with the context in which data is used. The `@kitmi/types` library addresses this need by defining semantic data types that include validation and sanitization, tailored to business logic rather than just the form of data. It allows for the creation of an independent and extensible type system that can be customized to fit the unique requirements of a business application.

## Semantic Type System with Validation and Sanitization

The `@kitmi/types` library is not just a collection of predefined data types; it also allows the creation of an independent and extensible type system. This flexibility is crucial for business applications where the context and semantics of data are paramount. By defining types semantically, developers can ensure that data conforms to business rules and expectations, such as treating a numeric string as an integer or a date string as a datetime object.

Building on the capabilities of `@kitmi/types`, the `@kitmi/validators` library introduces a `postProcess` hook to perform validations and transformations based on the JSON Type Modifiers Syntax (JTMS). This approach enables dynamic and complex validation strategies that are defined using data descriptors rather than code, allowing for the configuration and storage of these rules in a standardized format.

### Conventions and Types

The `@kitmi/types` library defines a variety of types, including `any`, `array`, `bigint`, `binary`, `boolean`, `datetime`, `integer`, `number`, `object`, and `text`. Each type follows a specific interface that includes a name, aliases, defaultValue, sanitize, and serialize method.

### Type Metadata

The type interface provides a blueprint for how each type should be structured. Common metadata properties such as `plain`, `optional`, and `default` allow for additional customization of how values are processed.

Enumerable types (like `bigint`, `integer`, `number`, and `text`) have a `enum` property used for specifying a set of allowed values.

Object type has a `schema` object property (can also be a functor to return a schema object) used for specifying the schema used to verify and process the object value.

Array type has a `element` object property (can also be a functor to return a schema object) used for specifying the schema used to verify and process its element value.

Binary type has a `encoding` text property.

Datetime type has a `format` text property.

Note: some more specific properties may not be covered here.

### Plugins

The `@kitmi/types` library also supports plugins as serializer, deserializer, pre-processor, post-processor.

## Dynamic Validation with Declarative Syntax

Building on the foundation of `@kitmi/types`, the `@kitmi/validators` library introduces a dynamic validation system using the JSON Type Modifiers Syntax (JTMS). This declarative syntax allows developers to specify complex validation rules by combining different types of modifiers.

### Modifier Syntax

Modifiers in JTMS can be standalone or require arguments, with the latter being expressed in object or array style.

-   Standalone Modifiers: "<type-prefix><modifier-name>", e.g. `~ip`, `~email`, `~strongPassword`
-   Modifiers with Arguments: These can be expressed either as objects or arrays:
    -   Object Style:
        -   `name`: Modifier name with prefix (e.g., `~mobile`)
        -   `options`: Arguments for the modifier (e.g., `{ locale: 'en-US' }`)
    -   Two-tuple Array Style:
        -   Index 0: Modifier name with prefix
        -   Index 1: Modifier options argument

### Types of Modifiers

There are three types of modifiers with different prefix symbols:

-   Validator (`~`): Validates the value.
-   Processor (`>`): Transforms the value.
-   Activator (`=`): Provides a value if the current value is null.

### Sample

An optional config object for koa is described with JTMS as below:

```json
{
    "type": "object",
    "schema": {
        "trustProxy": { "type": "boolean", "optional": true },
        "subdomainOffset": { "type": "integer", "optional": true, "post": [["~min", 2]] },
        "port": { "type": "integer", "optional": true, "default": 2331 },
        "keys": [
            {
                "type": "text"
            },
            {
                "type": "array",
                "optional": true,
                "element": { "type": "text" },
                "post": [["~minLength", 1]]
            }
        ]
    },
    "optional": true
}
```

Note: the keys property above can be one of a text value or an array of text with at least one element.

## Why Not Use Code-Based Validation Libraries?

While libraries like Joi or Yup provide powerful code-based solutions for data validation, `@kitmi/validators` takes a different approach by using data to describe data formats. This methodology shifts the focus from writing validation code to defining data formats and rules as configurations. As a result, data format definitions, validations, and even processing rules become standardized and can be managed as configurations, enhancing reusability and maintainability.

## Validators and Processors Extension

Furthermore, `@kitmi/validators` incorporates the `@kitmi/jsonv` and `@kitmi/jsonx` libraries, which introduce a series of validation and transformation operators inspired by MongoDB query operators. The `@kitmi/jsonv` library is utilized through the `~jsv` validator, and `@kitmi/jsonx` is applied via the `|jsx` processor within JTMS. This integration equips `@kitmi/validators` with a robust set of validators and processors capable of not just validating data but also transforming it, thus creating a comprehensive data processing pipeline.

## Use JTMS to Describe JTMS

```yaml
type: object,
schema:
    type:
        type: text
        enum:
            - "any"
            - "array"
            - "bigint"
            - "binary"
            - "boolean"
            - "datetime"
            - "integer"
            - "number"
            - "object"
    plain:
        type: boolean
        optional: true
    optional
        type: boolean
        optional: true
    default:
        type: any
        optional: true
    enum
        onlyWhen: 
            $$PARENT.type: 
                $in:
                    - "bigint"
                    - "integer" 
                    - "number"
                    - "text"
        type: array
        element: 
            type: '$$'

```

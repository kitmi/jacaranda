# API Schema Documentation 

The API schema is defined through YAML files located in the `xeml/api` directory of an app module. The system processes these files to generate API controllers with proper validation and business logic.

## Directory Structure

```
/xeml/
  /api/
    __types.yaml       # Shared type definitions
    __groups.yaml      # API group definitions
    __responses.yaml   # Response definitions
    resource1.yaml     # Resource API definitions
    resource2.yaml     # Another resource API definitions
    ...
```

Note: `__types`, `__groups`, and `__responses` are special files that are not processed as resources and can be extended from packages configured in `dataModel.apiExtends`.

Example `dataModel` configuration:
```yaml
dataModel:
    schemaPath: './xeml'
    schemaSet:
        forApi:
            dataSource: postgres.forApi
    apiExtends:
        - '@xgent/xem-base'      
    dependencies:
        commons: '@xgent/xem-commons'
        base: '@xgent/xem-base'
```    

## Type Definitions (`__types.yaml`)

This file defines reusable types that can be referenced in API respones using JTMS syntax from `@kimit/validators`.

```yaml
# Example __types.yaml
UserCredentials:
  type: object
  schema:
    username:
      type: text
      post: 
        - ['~minLength', 3] # post validation for username
    password:
      type: text
      post: 
        - ['~minLength', 8]

PaginationParams:
  type: object
  schema:
    page:
      type: integer
      default: 1
    pageSize:
      type: integer
      default: 20
```

Types can also be parameterized using the `$args` property:

```yaml
ListResult:
    $args:
        - itemType
    $base: $type.PaginationResponse # extends from a type from __types
    status:
        type: 'const'
        value: 'ok'
    data:
        type: array
        element:
            $ref: $args.itemType # use the itemType parameter
```

### Type References

- Directly use other type 

```yaml
typeOrField: $type.OtherType
```

- Extend from a type 

```yaml
typeOrField: 
  $base: $type.OtherType
  extraField1: # add more fields
    type: text
```

## Group Definitions (`__groups.yaml`)

This file defines API groups that organize controllers into different directory.

```yaml
# Example __groups.yaml
users:
  moduleSource: project
  controllerPath: controllers/users
  
auth:
  moduleSource: project
  controllerPath: controllers/auth
```

## Resource API Definitions

Each resource file (e.g., `users.yaml`) defines one or more resources with their endpoints.

```yaml
# Example users.yaml
/users:
  description: User management API
  group: users
  endpoints:
    get:
      description: List all users
      request:
        query:
          $base: $type.PaginationParams # extends from a type from __types
          name:
            type: text
            optional: true
      responses:
        200:
          description: List of users
      implementation:
        - $business.users.listUsers_($local.query)

    post:
      description: Create a new user
      request:
        body: $type.UserCredentials # directly uses a type from __types
      responses:
        201:
          description: User created
      implementation:
        - $business.users.createUser_($local.body)

  /{id}:
    get:
      description: Get user by ID
      request:
        params:
          id:
            type: integer
      responses:
        200:
          description: User details
      implementation:
        - $business.users.getUser_($local.id)
```

## Schema Components

## Base Endpoint Definition

Each resource file contains one or more base endpoints:

```yaml
/endpoint-path: # base endpoint path
  description: Description of the resource
  group: groupName
  endpoints:
    # HTTP methods and their handlers
```

## Endpoint Definition

Each endpoint is defined by HTTP method or sub-routes:

```yaml
get:
  description: Description of the endpoint
  request:
    # Request validation
  responses:
    # Response definitions
  implementation:
    # Business logic implementation

/{projectRef}: # sub-route with parameter :projectRef
    # ...endpoints
```

## Request Validation

The `request` section defines validation for different parts of the request:

```yaml
request:
  headers:
    authorization:
      type: text
  query:
    search:
      type: text
      optional: true
  params:
    id:
      type: integer
  body:
    $base: $type.SomeType # extends from a type from __types
    extraField:
      type: text
  state:
    - user.id
    - user.role
```

Note: `request` currently support 5 data sources: `headers`, `query`, `params`, `body`, and `state`.
- `headers`: ctx.headers
- `query`: ctx.query
- `params`: ctx.params
- `body`: ctx.request.body
- `state` ctx.state

The schema of data source is the same the `__types` section using JTMS syntax.

## Data References

The system supports several reference types:

1. **Type References**: `$type.TypeName` - References a type from `__types`
2. **Dataset References**: `$dataset.EntityName.DatasetName` - References a dataset schema
3. **Entity Field References**: `$entity.EntityName.FieldName` - References an entity field
4. **View References**: `$view.EntityName.ViewName` - References an entity view

## Implementation

The `implementation` section defines the business logic to execute:

```yaml
implementation:
  - $business.serviceName.methodName($local.param1, $local.param2)
```

Business methods can be synchronous or asynchronous (with a trailing underscore).

All business mehthods should return an object containing `result` and `payload`, i.e. `{ result, payload }`;

## Code Generation

The system generates:

1. API controller classes for each resource
2. Index files for each group that exports all controllers

## Special Features

## Sub-Routes with Parameters

Routes with parameters are defined using the `/{paramName}` syntax:

```yaml
/{id}:
  get:
    # Get by ID endpoint
  put:
    # Update by ID endpoint
  delete:
    # Delete by ID endpoint
```

## Request Data Processing

The system supports:

1. **Base Types**: Using `$base` to extend existing types
2. **Type Specialization**: Using parameterized types
3. **Field Validation**: Using `@kimit/validators` to do validation

## Response Handling

All endpoints use a standard response format through the `send` method:

```javascript
this.send(ctx, result, payload);
```

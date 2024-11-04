const { _, quote, dropIfEndsWith } = require('@kitmi/utils');
const { extractDotSeparateName } = require('../../lang/XemlUtils');
const JsLang = require('../util/ast');

const _applyModifiersHeader = [
    {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: {
                    type: 'ObjectPattern',
                    properties: [
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'raw',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'raw',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'latest',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'latest',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'existing',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'existing',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'i18n',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'i18n',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                    ],
                },
                init: {
                    type: 'Identifier',
                    name: 'context',
                },
            },
        ],
        kind: 'let',
    },
    {
        type: 'VariableDeclaration',
        declarations: [
            {
                type: 'VariableDeclarator',
                id: {
                    type: 'Identifier',
                    name: 'fMeta',
                },
                init: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'ThisExpression',
                        },
                        property: {
                            type: 'Identifier',
                            name: 'meta',
                        },
                    },
                    property: {
                        type: 'Identifier',
                        name: 'fields',
                    },
                },
            },
        ],
        kind: 'const',
    },
    {
        type: 'ExpressionStatement',
        expression: {
            type: 'LogicalExpression',
            operator: '||',
            left: {
                type: 'Identifier',
                name: 'existing',
            },
            right: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'Identifier',
                    name: 'existing',
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [],
                },
            },
        },
    },
];

const _checkAndAssign = (astBlock, assignTo, comment) => {
    return [
        JsLang.astVarDeclare('activated', astBlock, false, false, comment),
        {
            type: 'IfStatement',
            test: {
                type: 'BinaryExpression',
                operator: '!==',
                left: {
                    type: 'UnaryExpression',
                    operator: 'typeof',
                    argument: {
                        type: 'Identifier',
                        name: 'activated',
                    },
                    prefix: true,
                },
                right: {
                    type: 'Literal',
                    value: 'undefined',
                    raw: "'undefined'",
                },
            },
            consequent: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ExpressionStatement',
                        expression: {
                            type: 'AssignmentExpression',
                            operator: '=',
                            left: assignTo,
                            right: {
                                type: 'Identifier',
                                name: 'activated',
                            },
                        },
                    },
                ],
            },
            alternate: null,
        },
    ];
};

const _validateCheck = (fieldName, validatingCall) => {
    let comment = `Validating "${fieldName}"`;

    return {
        type: 'ExpressionStatement',
        expression: validatingCall,
        leadingComments: [
            {
                type: 'Line',
                value: comment,
                range: [1, comment.length + 1],
            },
        ],
    };
};

/**
 * Check existence of all required fields
 * @param {string} fieldName - Target field name
 * @param {*} references - All references to other fields
 * @param {*} content - Content code block
 * @param {bool} requireTargetField - Whether the function requires target field as input
 */
const _fieldRequirementCheck = (fieldName, references, content, requireTargetField) => {
    if (!references) references = [];

    references = references.map((ref) => extractDotSeparateName(ref).pop());

    let throwMessage = `"${fieldName}" is required due to change of its dependencies. (e.g: ${references.join(
        ' or '
    )})`;

    let checks =
        requireTargetField && references.length > 0
            ? [
                  {
                      type: 'IfStatement',
                      test: {
                          type: 'LogicalExpression',
                          operator: '&&',
                          left: {
                              type: 'Identifier',
                              name: 'isUpdating',
                          },
                          right: {
                              type: 'BinaryExpression',
                              operator: '==',
                              left: {
                                  type: 'MemberExpression',
                                  computed: true,
                                  object: {
                                      type: 'Identifier',
                                      name: 'latest',
                                  },
                                  property: {
                                      type: 'Literal',
                                      value: fieldName,
                                      raw: quote(fieldName, "'"),
                                  },
                              },
                              right: {
                                  type: 'Literal',
                                  value: null,
                                  raw: 'null',
                              },
                          },
                      },
                      consequent: {
                          type: 'BlockStatement',
                          body: [
                              {
                                  type: 'ThrowStatement',
                                  argument: {
                                      type: 'NewExpression',
                                      callee: {
                                          type: 'Identifier',
                                          name: 'ValidationError',
                                      },
                                      arguments: [
                                          {
                                              type: 'Literal',
                                              value: throwMessage,
                                              raw: quote(throwMessage, "'"),
                                          },
                                      ],
                                  },
                              },
                          ],
                      },
                      alternate: null,
                  },
              ]
            : [];

    /*
    references.forEach(ref => {
        let refThrowMessage = `Missing "${ref}" value, which is a dependency of "${fieldName}".`;

        checks.push({
            "type": "IfStatement",
            "test": {
                "type": "LogicalExpression",
                "operator": "&&",
                "left": {
                    "type": "UnaryExpression",
                    "operator": "!",
                    "argument": {
                        "type": "BinaryExpression",
                        "operator": "in",
                        "left": {
                            "type": "Literal",
                            "value": ref,
                            "raw": quote(ref, "'")
                        },
                        "right": {
                            "type": "Identifier",
                            "name": "latest"
                        }
                    },
                    "prefix": true
                },
                "right": {
                    "type": "UnaryExpression",
                    "operator": "!",
                    "argument": {
                        "type": "BinaryExpression",
                        "operator": "in",
                        "left": {
                            "type": "Literal",
                            "value": ref,
                            "raw": quote(ref, "'")
                        },
                        "right": {
                            "type": "Identifier",
                            "name": "existing"
                        }
                    },
                    "prefix": true
                }                    
            },
            "consequent": {
                "type": "BlockStatement",
                "body": [
                    {
                        "type": "ThrowStatement",
                        "argument": {
                            "type": "NewExpression",
                            "callee": {
                                "type": "Identifier",
                                "name": "ValidationError"
                            },
                            "arguments": [
                                {
                                    "type": "Literal",
                                    "value": refThrowMessage,
                                    "raw": quote(refThrowMessage, "'")
                                }
                            ]
                        }
                    }
                ]
            },
            "alternate": null
        });
    });
    */

    return requireTargetField
        ? {
              type: 'IfStatement',
              test: {
                  type: 'LogicalExpression',
                  operator: '&&',
                  left: {
                      type: 'BinaryExpression',
                      operator: '!=',
                      left: {
                          type: 'MemberExpression',
                          computed: true,
                          object: {
                              type: 'Identifier',
                              name: 'latest',
                          },
                          property: {
                              type: 'Literal',
                              value: fieldName,
                              raw: quote(fieldName, "'"),
                          },
                      },
                      right: {
                          type: 'Literal',
                          value: null,
                          raw: 'null',
                      },
                  },
                  right: {
                      type: 'UnaryExpression',
                      operator: '!',
                      argument: {
                          type: 'MemberExpression',
                          computed: false,
                          object: {
                              type: 'MemberExpression',
                              computed: true,
                              object: {
                                  type: 'Identifier',
                                  name: 'latest',
                              },
                              property: {
                                  type: 'Literal',
                                  value: fieldName,
                                  raw: quote(fieldName, "'"),
                              },
                          },
                          property: {
                              type: 'Identifier',
                              name: '$xr',
                          },
                      },
                      prefix: true,
                  },
              },
              consequent: {
                  type: 'BlockStatement',
                  body: checks.concat(content),
              },
              alternate: null,
          }
        : {
              // for activator
              type: 'IfStatement',
              test: {
                  type: 'LogicalExpression',
                  operator: '||',
                  left: {
                      type: 'LogicalExpression',
                      operator: '&&',
                      left: {
                          type: 'Identifier',
                          name: 'isUpdating',
                      },
                      right: {
                          type: 'LogicalExpression',
                          operator: '||',
                          left: {
                              type: 'MemberExpression',
                              computed: false,
                              object: {
                                  type: 'MemberExpression',
                                  computed: true,
                                  object: {
                                      type: 'Identifier',
                                      name: 'fMeta',
                                  },
                                  property: {
                                      type: 'Literal',
                                      value: fieldName,
                                      raw: quote(fieldName, "'"),
                                  },
                              },
                              property: {
                                  type: 'Identifier',
                                  name: 'forceUpdate',
                              },
                          },
                          right: {
                              type: 'CallExpression',
                              callee: {
                                  type: 'MemberExpression',
                                  computed: false,
                                  object: {
                                      type: 'ThisExpression',
                                  },
                                  property: {
                                      type: 'Identifier',
                                      name: '_dependencyExist',
                                  },
                              },
                              arguments: [
                                  {
                                      type: 'Literal',
                                      value: fieldName,
                                      raw: quote(fieldName, "'"),
                                  },
                                  {
                                      type: 'Identifier',
                                      name: 'context',
                                  },
                              ],
                          },
                      },
                  },
                  right: {
                      type: 'LogicalExpression',
                      operator: '&&',
                      left: {
                          type: 'LogicalExpression',
                          operator: '&&',
                          left: {
                              type: 'UnaryExpression',
                              operator: '!',
                              argument: {
                                  type: 'Identifier',
                                  name: 'isUpdating',
                              },
                              prefix: true,
                          },
                          right: {
                              type: 'BinaryExpression',
                              operator: '==',
                              left: {
                                  type: 'MemberExpression',
                                  computed: true,
                                  object: {
                                      type: 'Identifier',
                                      name: 'latest',
                                  },
                                  property: {
                                      type: 'Literal',
                                      value: fieldName,
                                      raw: quote(fieldName, "'"),
                                  },
                              },
                              right: {
                                  type: 'Literal',
                                  value: null,
                                  raw: 'null',
                              },
                          },
                      },
                      right: {
                          type: 'CallExpression',
                          callee: {
                              type: 'MemberExpression',
                              computed: false,
                              object: {
                                  type: 'ThisExpression',
                              },
                              property: {
                                  type: 'Identifier',
                                  name: '_noDependencyOrExist',
                              },
                          },
                          arguments: [
                              {
                                  type: 'Literal',
                                  value: fieldName,
                                  raw: quote(fieldName, "'"),
                              },
                              {
                                  type: 'Identifier',
                                  name: 'context',
                              },
                          ],
                      },
                  },
              },
              consequent: {
                  type: 'BlockStatement',
                  body: checks.concat(content),
              },
              alternate: null,
          };
};

const restMethods = (serviceId, entityName, className) => ({
    type: 'Program',
    body: [
        {
            type: 'ExpressionStatement',
            expression: {
                type: 'Literal',
                value: 'use strict',
                raw: '"use strict"',
            },
            directive: 'use strict',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'Mowa',
                    },
                    init: {
                        type: 'CallExpression',
                        callee: {
                            type: 'Identifier',
                            name: 'require',
                        },
                        arguments: [
                            {
                                type: 'Literal',
                                value: 'mowa',
                                raw: "'mowa'",
                            },
                        ],
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'dbId',
                    },
                    init: {
                        type: 'Literal',
                        value: serviceId,
                        raw: `'${serviceId}'`,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'modelName',
                    },
                    init: {
                        type: 'Literal',
                        value: entityName,
                        raw: `'${entityName}'`,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'query',
                    },
                    init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [
                            {
                                type: 'Identifier',
                                name: 'ctx',
                            },
                        ],
                        body: {
                            type: 'BlockStatement',
                            body: [
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'db',
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'ctx',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'appModule',
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'dbId',
                                                    },
                                                    {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'model',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'modelName',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'CallExpression',
                                        callee: {
                                            type: 'MemberExpression',
                                            computed: false,
                                            object: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            property: {
                                                type: 'Identifier',
                                                name: 'find',
                                            },
                                        },
                                        arguments: [
                                            {
                                                type: 'MemberExpression',
                                                computed: false,
                                                object: {
                                                    type: 'Identifier',
                                                    name: 'ctx',
                                                },
                                                property: {
                                                    type: 'Identifier',
                                                    name: 'query',
                                                },
                                            },
                                            {
                                                type: 'Literal',
                                                value: true,
                                                raw: 'true',
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                        generator: false,
                        expression: false,
                        async: true,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'detail',
                    },
                    init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [
                            {
                                type: 'Identifier',
                                name: 'ctx',
                            },
                        ],
                        body: {
                            type: 'BlockStatement',
                            body: [
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'id',
                                            },
                                            init: {
                                                type: 'MemberExpression',
                                                computed: false,
                                                object: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'params',
                                                    },
                                                },
                                                property: {
                                                    type: 'Identifier',
                                                    name: 'id',
                                                },
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'db',
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'ctx',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'appModule',
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'dbId',
                                                    },
                                                    {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'model',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'modelName',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: entityName,
                                            },
                                            init: {
                                                type: 'AwaitExpression',
                                                argument: {
                                                    type: 'CallExpression',
                                                    callee: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: className,
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'findOne',
                                                        },
                                                    },
                                                    arguments: [
                                                        {
                                                            type: 'Identifier',
                                                            name: 'id',
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'IfStatement',
                                    test: {
                                        type: 'UnaryExpression',
                                        operator: '!',
                                        argument: {
                                            type: 'Identifier',
                                            name: entityName,
                                        },
                                        prefix: true,
                                    },
                                    consequent: {
                                        type: 'BlockStatement',
                                        body: [
                                            {
                                                type: 'ReturnStatement',
                                                argument: {
                                                    type: 'ObjectExpression',
                                                    properties: [
                                                        {
                                                            type: 'Property',
                                                            key: {
                                                                type: 'Identifier',
                                                                name: 'error',
                                                            },
                                                            computed: false,
                                                            value: {
                                                                type: 'Literal',
                                                                value: 'record_not_found',
                                                                raw: "'record_not_found'",
                                                            },
                                                            kind: 'init',
                                                            method: false,
                                                            shorthand: false,
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                    alternate: null,
                                },
                                {
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: {
                                            type: 'Identifier',
                                            name: entityName,
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'data',
                                        },
                                    },
                                },
                            ],
                        },
                        generator: false,
                        expression: false,
                        async: true,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'create',
                    },
                    init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [
                            {
                                type: 'Identifier',
                                name: 'ctx',
                            },
                        ],
                        body: {
                            type: 'BlockStatement',
                            body: [
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'db',
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'ctx',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'appModule',
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'dbId',
                                                    },
                                                    {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'model',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'modelName',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: entityName,
                                            },
                                            init: {
                                                type: 'NewExpression',
                                                callee: {
                                                    type: 'Identifier',
                                                    name: className,
                                                },
                                                arguments: [
                                                    {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'MemberExpression',
                                                            computed: false,
                                                            object: {
                                                                type: 'Identifier',
                                                                name: 'ctx',
                                                            },
                                                            property: {
                                                                type: 'Identifier',
                                                                name: 'request',
                                                            },
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'fields',
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: {
                                            type: 'AwaitExpression',
                                            argument: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: entityName,
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'save',
                                                    },
                                                },
                                                arguments: [],
                                            },
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'data',
                                        },
                                    },
                                },
                            ],
                        },
                        generator: false,
                        expression: false,
                        async: true,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'update',
                    },
                    init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [
                            {
                                type: 'Identifier',
                                name: 'ctx',
                            },
                        ],
                        body: {
                            type: 'BlockStatement',
                            body: [
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'id',
                                            },
                                            init: {
                                                type: 'MemberExpression',
                                                computed: false,
                                                object: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'params',
                                                    },
                                                },
                                                property: {
                                                    type: 'Identifier',
                                                    name: 'id',
                                                },
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'db',
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'ctx',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'appModule',
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'dbId',
                                                    },
                                                    {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'model',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'modelName',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: entityName,
                                            },
                                            init: {
                                                type: 'AwaitExpression',
                                                argument: {
                                                    type: 'CallExpression',
                                                    callee: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: className,
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'findOne',
                                                        },
                                                    },
                                                    arguments: [
                                                        {
                                                            type: 'Identifier',
                                                            name: 'id',
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'IfStatement',
                                    test: {
                                        type: 'Identifier',
                                        name: entityName,
                                    },
                                    consequent: {
                                        type: 'BlockStatement',
                                        body: [
                                            {
                                                type: 'ExpressionStatement',
                                                expression: {
                                                    type: 'CallExpression',
                                                    callee: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'Object',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'assign',
                                                        },
                                                    },
                                                    arguments: [
                                                        {
                                                            type: 'MemberExpression',
                                                            computed: false,
                                                            object: {
                                                                type: 'Identifier',
                                                                name: entityName,
                                                            },
                                                            property: {
                                                                type: 'Identifier',
                                                                name: 'data',
                                                            },
                                                        },
                                                        {
                                                            type: 'MemberExpression',
                                                            computed: false,
                                                            object: {
                                                                type: 'MemberExpression',
                                                                computed: false,
                                                                object: {
                                                                    type: 'Identifier',
                                                                    name: 'ctx',
                                                                },
                                                                property: {
                                                                    type: 'Identifier',
                                                                    name: 'request',
                                                                },
                                                            },
                                                            property: {
                                                                type: 'Identifier',
                                                                name: 'fields',
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                            {
                                                type: 'ReturnStatement',
                                                argument: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'AwaitExpression',
                                                        argument: {
                                                            type: 'CallExpression',
                                                            callee: {
                                                                type: 'MemberExpression',
                                                                computed: false,
                                                                object: {
                                                                    type: 'Identifier',
                                                                    name: entityName,
                                                                },
                                                                property: {
                                                                    type: 'Identifier',
                                                                    name: 'save',
                                                                },
                                                            },
                                                            arguments: [],
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'data',
                                                    },
                                                },
                                            },
                                        ],
                                    },
                                    alternate: null,
                                },
                                {
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'ObjectExpression',
                                        properties: [
                                            {
                                                type: 'Property',
                                                key: {
                                                    type: 'Identifier',
                                                    name: 'error',
                                                },
                                                computed: false,
                                                value: {
                                                    type: 'Literal',
                                                    value: 'record_not_found',
                                                    raw: "'record_not_found'",
                                                },
                                                kind: 'init',
                                                method: false,
                                                shorthand: false,
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                        generator: false,
                        expression: false,
                        async: true,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'VariableDeclaration',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: 'remove',
                    },
                    init: {
                        type: 'ArrowFunctionExpression',
                        id: null,
                        params: [
                            {
                                type: 'Identifier',
                                name: 'ctx',
                            },
                        ],
                        body: {
                            type: 'BlockStatement',
                            body: [
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'id',
                                            },
                                            init: {
                                                type: 'MemberExpression',
                                                computed: false,
                                                object: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'params',
                                                    },
                                                },
                                                property: {
                                                    type: 'Identifier',
                                                    name: 'id',
                                                },
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: 'db',
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'MemberExpression',
                                                        computed: false,
                                                        object: {
                                                            type: 'Identifier',
                                                            name: 'ctx',
                                                        },
                                                        property: {
                                                            type: 'Identifier',
                                                            name: 'appModule',
                                                        },
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'dbId',
                                                    },
                                                    {
                                                        type: 'Identifier',
                                                        name: 'ctx',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'VariableDeclaration',
                                    declarations: [
                                        {
                                            type: 'VariableDeclarator',
                                            id: {
                                                type: 'Identifier',
                                                name: className,
                                            },
                                            init: {
                                                type: 'CallExpression',
                                                callee: {
                                                    type: 'MemberExpression',
                                                    computed: false,
                                                    object: {
                                                        type: 'Identifier',
                                                        name: 'db',
                                                    },
                                                    property: {
                                                        type: 'Identifier',
                                                        name: 'model',
                                                    },
                                                },
                                                arguments: [
                                                    {
                                                        type: 'Identifier',
                                                        name: 'modelName',
                                                    },
                                                ],
                                            },
                                        },
                                    ],
                                    kind: 'let',
                                },
                                {
                                    type: 'ExpressionStatement',
                                    expression: {
                                        type: 'AwaitExpression',
                                        argument: {
                                            type: 'CallExpression',
                                            callee: {
                                                type: 'MemberExpression',
                                                computed: false,
                                                object: {
                                                    type: 'Identifier',
                                                    name: className,
                                                },
                                                property: {
                                                    type: 'Identifier',
                                                    name: 'removeOne',
                                                },
                                            },
                                            arguments: [
                                                {
                                                    type: 'Identifier',
                                                    name: 'id',
                                                },
                                            ],
                                        },
                                    },
                                },
                                {
                                    type: 'ReturnStatement',
                                    argument: {
                                        type: 'ObjectExpression',
                                        properties: [
                                            {
                                                type: 'Property',
                                                key: {
                                                    type: 'Identifier',
                                                    name: 'status',
                                                },
                                                computed: false,
                                                value: {
                                                    type: 'Literal',
                                                    value: 'ok',
                                                    raw: "'ok'",
                                                },
                                                kind: 'init',
                                                method: false,
                                                shorthand: false,
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                        generator: false,
                        expression: false,
                        async: true,
                    },
                },
            ],
            kind: 'const',
        },
        {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'Identifier',
                        name: 'module',
                    },
                    property: {
                        type: 'Identifier',
                        name: 'exports',
                    },
                },
                right: {
                    type: 'ObjectExpression',
                    properties: [
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'query',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'query',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'detail',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'detail',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'create',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'create',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'update',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'update',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                        {
                            type: 'Property',
                            key: {
                                type: 'Identifier',
                                name: 'remove',
                            },
                            computed: false,
                            value: {
                                type: 'Identifier',
                                name: 'remove',
                            },
                            kind: 'init',
                            method: false,
                            shorthand: true,
                        },
                    ],
                },
            },
        },
    ],
    sourceType: 'script',
});

const processorMethod = (functor) => {
    const args = functor.args.slice(3).map((arg) => ({
        type: 'Identifier',
        name: arg,
    }));
    return {
        type: 'MethodDefinition',
        key: {
            type: 'Identifier',
            name: functor.functionName,
        },
        computed: false,
        value: {
            type: 'FunctionExpression',
            id: null,
            params: [
                {
                    type: 'Identifier',
                    name: 'fieldName',
                },
                ...args,
            ],
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: `${functor.functionName}Processor`,
                            },
                            arguments: [
                                {
                                    type: 'ThisExpression',
                                },
                                {
                                    type: 'MemberExpression',
                                    computed: true,
                                    object: {
                                        type: 'MemberExpression',
                                        computed: false,
                                        object: {
                                            type: 'MemberExpression',
                                            computed: false,
                                            object: {
                                                type: 'ThisExpression',
                                            },
                                            property: {
                                                type: 'Identifier',
                                                name: 'meta',
                                            },
                                        },
                                        property: {
                                            type: 'Identifier',
                                            name: 'fields',
                                        },
                                    },
                                    property: {
                                        type: 'Identifier',
                                        name: 'fieldName',
                                    },
                                },
                                {
                                    type: 'Literal',
                                    value: null,
                                    raw: 'null',
                                },
                                ...args,
                            ],
                        },
                    },
                ],
            },
            generator: false,
            expression: false,
            async: functor.functionName.endsWith('_'),
        },
        kind: 'method',
        static: false,
    };
};

const modifierMethod = (functor) => {
    const args = functor.args
        ? unctor.args.slice(3).map((arg) => ({
              type: 'Identifier',
              name: arg,
          }))
        : [];
    return {
        type: 'MethodDefinition',
        key: {
            type: 'Identifier',
            name: functor.name,
        },
        computed: false,
        value: {
            type: 'FunctionExpression',
            id: null,
            params: args,
            body: {
                type: 'BlockStatement',
                body: [
                    {
                        type: 'ReturnStatement',
                        argument: {
                            type: 'CallExpression',
                            callee: {
                                type: 'Identifier',
                                name: `${dropIfEndsWith(functor.name, '_')}${functor.$xt}${
                                    functor.name.endsWith('_') ? '_' : ''
                                }`,
                            },
                            arguments: [
                                {
                                    type: 'ThisExpression',
                                },
                                {
                                    type: 'Literal',
                                    value: null,
                                    raw: 'null',
                                },
                                {
                                    type: 'Literal',
                                    value: null,
                                    raw: 'null',
                                },
                                ...args,
                            ],
                        },
                    },
                ],
            },
            generator: false,
            expression: false,
            async: functor.name.endsWith('_'),
        },
        kind: 'method',
        static: false,
    };
};

const importFromData = (extra) => ({
    type: 'ImportDeclaration',
    specifiers: [
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: '_Activators',
            },
            imported: {
                type: 'Identifier',
                name: '_Activators',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: '_Processors',
            },
            imported: {
                type: 'Identifier',
                name: '_Processors',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: '_Validators',
            },
            imported: {
                type: 'Identifier',
                name: '_Validators',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrCol',
            },
            imported: {
                type: 'Identifier',
                name: 'xrCol',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrExpr',
            },
            imported: {
                type: 'Identifier',
                name: 'xrExpr',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrCall',
            },
            imported: {
                type: 'Identifier',
                name: 'xrCall',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrRaw',
            },
            imported: {
                type: 'Identifier',
                name: 'xrRaw',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrAlias',
            },
            imported: {
                type: 'Identifier',
                name: 'xrAlias',
            },
        },
        {
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: 'xrDataSet',
            },
            imported: {
                type: 'Identifier',
                name: 'xrDataSet',
            },
        },
        ...(extra ?? []).map(({ local, imported }) => ({
            type: 'ImportSpecifier',
            local: {
                type: 'Identifier',
                name: local,
            },
            imported: {
                type: 'Identifier',
                name: imported,
            },
        })),
    ],
    source: {
        type: 'Literal',
        value: '@kitmi/data',
        raw: "'@kitmi/data'",
    },
});

module.exports = {
    _checkAndAssign,
    _applyModifiersHeader,
    _validateCheck,
    _fieldRequirementCheck,
    restMethods,
    processorMethod,
    modifierMethod,
    importFromData,
};

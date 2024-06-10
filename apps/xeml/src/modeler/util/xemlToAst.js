/**
 * @module
 * @ignore
 */

const { _ } = require('@kitmi/utils');
const { TopoSort } = require('@kitmi/algo');
const { Activators, Processors, Validators } = require('@kitmi/data');
const JsLang = require('./ast');
const XemlTypes = require('../../lang/XemlTypes');
const { isDotSeparateName, extractDotSeparateName, extractReferenceBaseName } = require('../../lang/XemlUtils');
const Types = require('../../lang/Types');

const defaultError = 'InvalidRequest';

const AST_BLK_FIELD_PRE_PROCESS = 'FieldPreProcess';
const AST_BLK_PARAM_SANITIZE = 'ParameterSanitize';
const AST_BLK_PROCESSOR_CALL = 'ProcessorCall';
const AST_BLK_VALIDATOR_CALL = 'ValidatorCall';
const AST_BLK_ACTIVATOR_CALL = 'ActivatorCall';
const AST_BLK_VIEW_OPERATION = 'ViewOperation';
const AST_BLK_VIEW_RETURN = 'ViewReturn';
const AST_BLK_INTERFACE_OPERATION = 'InterfaceOperation';
const AST_BLK_INTERFACE_RETURN = 'InterfaceReturn';
const AST_BLK_EXCEPTION_ITEM = 'ExceptionItem';

const XEML_MODIFIER_CODE_FLAG = {
    [XemlTypes.Modifier.VALIDATOR]: AST_BLK_VALIDATOR_CALL,
    [XemlTypes.Modifier.PROCESSOR]: AST_BLK_PROCESSOR_CALL,
    [XemlTypes.Modifier.ACTIVATOR]: AST_BLK_ACTIVATOR_CALL,
};

const XEML_MODIFIER_OP = {
    [XemlTypes.Modifier.VALIDATOR]: '|~',
    [XemlTypes.Modifier.PROCESSOR]: '|>',
    [XemlTypes.Modifier.ACTIVATOR]: '|=',
};

const XEML_MODIFIER_PATH = {
    [XemlTypes.Modifier.VALIDATOR]: 'validators',
    [XemlTypes.Modifier.PROCESSOR]: 'processors',
    [XemlTypes.Modifier.ACTIVATOR]: 'activators',
};

const XEML_MODIFIER_BUILTIN = {
    [XemlTypes.Modifier.VALIDATOR]: Validators,
    [XemlTypes.Modifier.PROCESSOR]: Processors,
    [XemlTypes.Modifier.ACTIVATOR]: Activators,
};

const OPERATOR_TOKEN = {
    '>': '$gt',
    '<': '$lt',
    '>=': '$gte',
    '<=': '$lte',
    '==': '$eq',
    '!=': '$ne',
    'in': '$in',
    'notIn': '$nin',
};

/**
 * Compile a conditional expression
 * @param {object} test
 * @param {object} compileContext
 * @property {string} compileContext.moduleName
 * @property {TopoSort} compileContext.topoSort
 * @property {object} compileContext.astMap - Topo Id to ast map
 * @param {string} startTopoId
 * @returns {string} Topo Id
 */
function compileConditionalExpression(test, compileContext, startTopoId) {
    if (_.isPlainObject(test)) {
        if (test.$xt === 'ValidateExpression') {
            let endTopoId = createTopoId(compileContext, startTopoId + '$valiOp:done');
            let operandTopoId = createTopoId(compileContext, startTopoId + '$valiOp');

            dependsOn(compileContext, startTopoId, operandTopoId);

            let lastOperandTopoId = compileConcreteValueExpression(operandTopoId, test.caller, compileContext);
            dependsOn(compileContext, lastOperandTopoId, endTopoId);

            let astArgument = getCodeRepresentationOf(lastOperandTopoId, compileContext);

            let retTopoId = compileAdHocValidator(endTopoId, astArgument, test.callee, compileContext);

            assert: retTopoId === endTopoId;

            /*
            compileContext.astMap[endTopoId] = JsLang.astCall('_.isEmpty', astArgument);

            switch (test.operator) {
                case 'exists':
                    compileContext.astMap[endTopoId] = JsLang.astNot(JsLang.astCall('_.isEmpty', astArgument));
                    break;

                case 'is-not-null':
                    compileContext.astMap[endTopoId] = JsLang.astNot(JsLang.astCall('_.isNil', astArgument));
                    break;

                case 'not-exists':
                    
                    break;

                case 'is-null':
                    compileContext.astMap[endTopoId] = JsLang.astCall('_.isNil', astArgument);
                    break;

                case 'not':
                    compileContext.astMap[endTopoId] = JsLang.astNot(astArgument);
                    break;

                default:
                    throw new Error('Unsupported test operator: ' + test.operator);
            }
            */

            return endTopoId;
        } else if (test.$xt === 'LogicalExpression') {
            let endTopoId = createTopoId(compileContext, startTopoId + '$lopOp:done');

            let op;

            switch (test.operator) {
                case 'and':
                    op = '&&';
                    break;

                case 'or':
                    op = '||';
                    break;

                default:
                    throw new Error('Unsupported test operator: ' + test.operator);
            }

            let leftTopoId = createTopoId(compileContext, startTopoId + '$lopOp:left');
            let rightTopoId = createTopoId(compileContext, startTopoId + '$lopOp:right');

            dependsOn(compileContext, startTopoId, leftTopoId);
            dependsOn(compileContext, startTopoId, rightTopoId);

            let lastLeftId = compileConditionalExpression(test.left, compileContext, leftTopoId);
            let lastRightId = compileConditionalExpression(test.right, compileContext, rightTopoId);

            dependsOn(compileContext, lastLeftId, endTopoId);
            dependsOn(compileContext, lastRightId, endTopoId);

            compileContext.astMap[endTopoId] = JsLang.astBinExp(
                getCodeRepresentationOf(lastLeftId, compileContext),
                op,
                getCodeRepresentationOf(lastRightId, compileContext)
            );

            return endTopoId;
        } else if (test.$xt === 'BinaryExpression') {
            let endTopoId = createTopoId(compileContext, startTopoId + '$binOp:done');

            let op;

            switch (test.operator) {
                case '>':
                case '<':
                case '>=':
                case '<=':
                case 'in':
                    op = test.operator;
                    break;

                case '==':
                    op = '===';
                    break;

                case '!=':
                    op = '!==';
                    break;

                default:
                    throw new Error('Unsupported test operator: ' + test.operator);
            }

            let leftTopoId = createTopoId(compileContext, startTopoId + '$binOp:left');
            let rightTopoId = createTopoId(compileContext, startTopoId + '$binOp:right');

            dependsOn(compileContext, startTopoId, leftTopoId);
            dependsOn(compileContext, startTopoId, rightTopoId);

            let lastLeftId = compileConcreteValueExpression(leftTopoId, test.left, compileContext);
            let lastRightId = compileConcreteValueExpression(rightTopoId, test.right, compileContext);

            dependsOn(compileContext, lastLeftId, endTopoId);
            dependsOn(compileContext, lastRightId, endTopoId);

            compileContext.astMap[endTopoId] = JsLang.astBinExp(
                getCodeRepresentationOf(lastLeftId, compileContext),
                op,
                getCodeRepresentationOf(lastRightId, compileContext)
            );

            return endTopoId;
        } else if (test.$xt === 'UnaryExpression') {
            let endTopoId = createTopoId(compileContext, startTopoId + '$unaOp:done');
            let operandTopoId = createTopoId(compileContext, startTopoId + '$unaOp');

            dependsOn(compileContext, startTopoId, operandTopoId);

            let lastOperandTopoId =
                test.operator === 'not'
                    ? compileConcreteValueExpression(operandTopoId, test.argument, compileContext)
                    : compileConditionalExpression(test.argument, compileContext, operandTopoId);
            dependsOn(compileContext, lastOperandTopoId, endTopoId);

            let astArgument = getCodeRepresentationOf(lastOperandTopoId, compileContext);

            switch (test.operator) {
                case 'exists':
                    compileContext.astMap[endTopoId] = JsLang.astNot(JsLang.astCall('_.isEmpty', astArgument));
                    break;

                case 'is-not-null':
                    compileContext.astMap[endTopoId] = JsLang.astNot(JsLang.astCall('_.isNil', astArgument));
                    break;

                case 'not-exists':
                    compileContext.astMap[endTopoId] = JsLang.astCall('_.isEmpty', astArgument);
                    break;

                case 'is-null':
                    compileContext.astMap[endTopoId] = JsLang.astCall('_.isNil', astArgument);
                    break;

                case 'not':
                    compileContext.astMap[endTopoId] = JsLang.astNot(astArgument);
                    break;

                default:
                    throw new Error('Unsupported test operator: ' + test.operator);
            }

            return endTopoId;
        } else {
            let valueStartTopoId = createTopoId(compileContext, startTopoId + '$value');
            dependsOn(compileContext, startTopoId, valueStartTopoId);
            return compileConcreteValueExpression(valueStartTopoId, test, compileContext);
        }
    }

    compileContext.astMap[startTopoId] = JsLang.astValue(test);
    return startTopoId;
}

/**
 * Compile a validator called in a logical expression.
 * @param value
 * @param functors
 * @param compileContext
 * @param topoInfo
 * @property {string} topoInfo.topoIdPrefix
 * @property {string} topoInfo.lastTopoId
 * @returns {*|string}
 */
function compileAdHocValidator(topoId, value, functor, compileContext) {
    assert: functor.$xt === XemlTypes.Modifier.VALIDATOR;

    let callArgs;

    if (functor.args) {
        callArgs = translateArgs(topoId, functor.args, compileContext);
    } else {
        callArgs = [];
    }

    let arg0 = value;

    compileContext.astMap[topoId] = JsLang.astCall('Validators.' + functor.name, [arg0].concat(callArgs));

    return topoId;
}

/**
 * Compile a modifier from xeml to ast.
 * @param topoId - startTopoId
 * @param value
 * @param functors
 * @param compileContext
 * @param topoInfo
 * @property {string} topoInfo.topoIdPrefix
 * @property {string} topoInfo.lastTopoId
 * @returns {*|string}
 */
function compileModifier(topoId, value, functor, compileContext) {
    let declareParams;

    if (functor.$xt === XemlTypes.Modifier.ACTIVATOR) {
        declareParams = translateFunctionParams(
            [{ name: compileContext.moduleName }, { name: 'meta' }, { name: 'context' }].concat(functor.args ?? [])
        );        
    } else {
        declareParams = translateFunctionParams(
            [{ name: compileContext.moduleName }, { name: 'meta' }, { name: 'context' }].concat(
                _.isEmpty(functor.args) ? [value] : [value].concat(functor.args ?? [])
            )
        );
    }

    let functorId = translateModifier(functor, compileContext, declareParams);

    let callArgs, references;

    if (functor.args) {
        callArgs = translateArgs(topoId, functor.args, compileContext);
        references = extractReferencedFields(functor.args);

        if (_.find(references, (ref) => ref === value.name)) {
            throw new Error('Cannot use the target field itself as an argument of a modifier.');
        }
    } else {
        callArgs = [];
    }

    if (functor.$xt === XemlTypes.Modifier.ACTIVATOR) {        
        compileContext.astMap[topoId] = JsLang.astAwait(
            functorId,
            [
                JsLang.astVarRef('this'),
                JsLang.astArrayAccess(JsLang.astVarRef('fMeta'), extractReferenceBaseName(value.name)),
                JsLang.astVarRef('context'),
            ].concat(callArgs)
        );
    } else {
        let arg0 = value;
        if (
            !isTopLevelBlock(topoId) &&
            _.isPlainObject(value) &&
            value.$xt === 'ObjectReference' &&
            value.name.startsWith('latest.')
        ) {
            //let existingRef =
            arg0 = JsLang.astConditional(
                JsLang.astCall('latest.hasOwnProperty', [extractReferenceBaseName(value.name)]) /** test */,
                value /** consequent */,
                replaceVarRefScope(value, 'existing')
            );
        }
        compileContext.astMap[topoId] = JsLang.astCall(
            functorId,
            [
                JsLang.astVarRef('this'),
                JsLang.astArrayAccess(JsLang.astVarRef('fMeta'), extractReferenceBaseName(value.name)),
                JsLang.astVarRef('context'),
                arg0,
            ].concat(callArgs)
        );
    }

    if (isTopLevelBlock(topoId)) {
        let targetVarName = value.name;
        let needDeclare = false;

        if (
            !isDotSeparateName(value.name) &&
            compileContext.variables[value.name] &&
            functor.$xt !== XemlTypes.Modifier.VALIDATOR
        ) {
            //conflict with existing variables, need to rename to another variable
            let counter = 1;
            do {
                counter++;
                targetVarName = value.name + counter.toString();
            } while (compileContext.variables.hasOwnProperty(targetVarName));

            compileContext.variables[targetVarName] = { type: 'localVariable', source: 'modifier' };
            needDeclare = true;
        }

        //if (compileContext.variables[])

        addCodeBlock(compileContext, topoId, {
            type: XEML_MODIFIER_CODE_FLAG[functor.$xt],
            target: targetVarName,
            references, // latest., exsiting., raw.
            needDeclare,
        });
    }

    return topoId;
}

function extractReferencedFields(xemlArgs) {
    xemlArgs = _.castArray(xemlArgs);

    let refs = [];

    xemlArgs.forEach((a) => {
        if (Array.isArray(a)) {
            refs = refs.concat(extractReferencedFields(a));
            return;
        }

        let result = checkReferenceToField(a);
        if (result) {
            refs.push(result);
        }
    });

    return refs;
}

function checkReferenceToField(obj) {
    if (_.isPlainObject(obj) && obj.$xt) {
        if (obj.$xt === 'PipedValue') return checkReferenceToField(obj.value);
        if (obj.$xt === 'ObjectReference') {
            return obj.name;
        }
    }

    return undefined;
}

function addModifierToMap(functorId, functorType, functorJsFile, mapOfFunctorToFile) {
    if (mapOfFunctorToFile[functorId] && mapOfFunctorToFile[functorId] !== functorJsFile) {
        throw new Error(`Conflict: ${functorType} naming "${functorId}" conflicts!`);
    }
    mapOfFunctorToFile[functorId] = functorJsFile;
}

/**
 * Check whether a functor is user-defined or built-in
 * @param functor
 * @param compileContext
 * @param args - Used to make up the function signature
 * @returns {string} functor id
 */
function translateModifier(functor, compileContext, args) {
    let functionName, fileName, functorId;

    //extract validator naming and import information
    if (isDotSeparateName(functor.name)) {
        let names = extractDotSeparateName(functor.name);
        if (names.length > 2) {
            throw new Error('Not supported reference type: ' + functor.name);
        }

        //reference to other entity file
        let refEntityName = names[0];
        functionName = names[1];
        fileName = './' + XEML_MODIFIER_PATH[functor.$xt] + '/' + refEntityName + '-' + functionName + '.js';
        functorId = refEntityName + _.upperFirst(functionName) + functor.$xt;
        addModifierToMap(functorId, functor.$xt, fileName, compileContext.mapOfFunctorToFile);
    } else {
        functionName = functor.name;

        let builtins = XEML_MODIFIER_BUILTIN[functor.$xt];

        if (!(functionName in builtins)) {
            fileName =
                './' + XEML_MODIFIER_PATH[functor.$xt] + '/' + compileContext.moduleName + '-' + functionName + '.js';
            functorId = functionName + functor.$xt;

            if (!compileContext.mapOfFunctorToFile[functorId]) {
                compileContext.newFunctorFiles.push({
                    functionName,
                    functorType: functor.$xt,
                    fileName,
                    args,
                });
            }

            addModifierToMap(functorId, functor.$xt, fileName, compileContext.mapOfFunctorToFile);
        } else {
            functorId = functor.$xt + 's.' + functionName;
        }
    }

    return functorId;
}

/**
 * Compile a piped value from xeml to ast.
 * @param {string} startTopoId - The topological id of the starting process to the target value, default as the param name
 * @param {object} varXeml - Target value xeml node.
 * @param {object} compileContext - Compilation context.
 * @property {string} compileContext.moduleName
 * @property {TopoSort} compileContext.topoSort
 * @property {object} compileContext.astMap - Topo Id to ast map
 * @returns {string} Last topo Id
 */
function compilePipedValue(startTopoId, varXeml, compileContext) {
    let lastTopoId = compileConcreteValueExpression(startTopoId, varXeml.value, compileContext);

    varXeml.modifiers.forEach((modifier) => {
        let modifierStartTopoId = createTopoId(
            compileContext,
            startTopoId + XEML_MODIFIER_OP[modifier.$xt] + modifier.name
        );
        dependsOn(compileContext, lastTopoId, modifierStartTopoId);

        lastTopoId = compileModifier(modifierStartTopoId, varXeml.value, modifier, compileContext);
    });

    return lastTopoId;
}

/**
 * Compile a variable reference from xeml to ast.
 * @param {string} startTopoId - The topological id of the starting process to the target value, default as the param name
 * @param {object} varXeml - Target value xeml node.
 * @param {object} compileContext - Compilation context.
 * @property {string} compileContext.moduleName
 * @property {TopoSort} compileContext.topoSort
 * @property {object} compileContext.astMap - Topo Id to ast map
 * @returns {string} Last topo Id
 */
function compileVariableReference(startTopoId, varXeml, compileContext) {
    pre: _.isPlainObject(varXeml) && varXeml.$xt === 'ObjectReference';

    //let [ baseName, others ] = varOol.name.split('.', 2);
    /*
    if (compileContext.modelVars && compileContext.modelVars.has(baseName) && others) {
        varOol.name = baseName + '.data' + '.' + others;
    }*/

    //simple value
    compileContext.astMap[startTopoId] = JsLang.astValue(varXeml);
    return startTopoId;
}

/**
 * Get an array of parameter names.
 * @param {array} args - An array of arguments in xeml syntax
 * @returns {array}
 */
function translateFunctionParams(args) {
    if (_.isEmpty(args)) return [];

    let names = new Set();

    function translateFunctionParam(arg, i) {
        if (_.isPlainObject(arg)) {
            if (arg.$xt === 'PipedValue') {
                return translateFunctionParam(arg.value);
            }

            if (arg.$xt === 'ObjectReference') {
                if (isDotSeparateName(arg.name)) {
                    return extractDotSeparateName(arg.name).pop();
                }
            }

            return arg.name;
        }

        return 'param' + (i + 1).toString();
    }

    return _.map(args, (arg, i) => {
        let baseName = translateFunctionParam(arg, i);
        let name = baseName;
        let count = 2;

        while (names.has(name)) {
            name = baseName + count.toString();
            count++;
        }

        names.add(name);
        return name;
    });
}

/**
 * Compile a concrete value expression from xeml to ast
 * @param {string} startTopoId - The topo id of the starting process to the target value expression
 * @param {object} value - Xeml node
 * @param {object} compileContext - Compilation context
 * @returns {string} Last topoId
 */
function compileConcreteValueExpression(startTopoId, value, compileContext) {
    if (_.isPlainObject(value)) {
        if (value.$xt === 'PipedValue') {
            return compilePipedValue(startTopoId, value, compileContext);
        }

        if (value.$xt === 'ObjectReference') {
            let [refBase, ...rest] = extractDotSeparateName(value.name);

            let dependency;

            if (!compileContext.variables[refBase]) {
                throw new Error(`Referenced undefined variable: ${value.name}`);
            }

            if (compileContext.variables[refBase].type === 'entity' && !compileContext.variables[refBase].ongoing) {
                dependency = refBase;
            } else if (refBase === 'latest' && rest.length > 0) {
                //latest.password
                let refFieldName = rest.pop();
                if (refFieldName !== startTopoId) {
                    dependency = refFieldName + ':ready';
                }
            } else if (_.isEmpty(rest)) {
                dependency = refBase + ':ready';
            }

            if (dependency) {
                dependsOn(compileContext, dependency, startTopoId);
            }

            return compileVariableReference(startTopoId, value, compileContext);
        }

        if (value.$xt === 'RegExp') {
            compileContext.astMap[startTopoId] = JsLang.astValue(value);
            return startTopoId;
        }

        if (value.$xt === 'SymbolToken') {
            compileContext.astMap[startTopoId] = JsLang.astValue(translateSymbolToken(value.name));
            return startTopoId;
        }

        value = _.mapValues(value, (valueOfElement, key) => {
            let sid = createTopoId(compileContext, startTopoId + '.' + key);
            let eid = compileConcreteValueExpression(sid, valueOfElement, compileContext);
            if (sid !== eid) {
                dependsOn(compileContext, eid, startTopoId);
            }
            return compileContext.astMap[eid];
        });
    } else if (Array.isArray(value)) {
        value = _.map(value, (valueOfElement, index) => {
            let sid = createTopoId(compileContext, startTopoId + '[' + index + ']');
            let eid = compileConcreteValueExpression(sid, valueOfElement, compileContext);
            if (sid !== eid) {
                dependsOn(compileContext, eid, startTopoId);
            }
            return compileContext.astMap[eid];
        });
    }

    compileContext.astMap[startTopoId] = JsLang.astValue(value);
    return startTopoId;
}

function translateSymbolToken(name) {
    if (name === 'NOW') {
        return {
            type: 'CallExpression',
            callee: {
                type: 'MemberExpression',
                computed: false,
                object: {
                    type: 'MemberExpression',
                    computed: false,
                    object: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'Identifier',
                            name: 'Types',
                        },
                        property: {
                            type: 'Identifier',
                            name: 'DATETIME',
                        },
                    },
                    property: {
                        type: 'Identifier',
                        name: 'typeObject',
                    },
                },
                property: {
                    type: 'Identifier',
                    name: 'local',
                },
            },
            arguments: [],
        };
    }

    throw new Error('not support: ' + name);
}

/**
 * Translate an array of function arguments from xeml into ast.
 * @param topoId - The modifier function topo
 * @param args -
 * @param compileContext -
 * @returns {Array}
 */
function translateArgs(topoId, args, compileContext) {
    args = _.castArray(args);
    if (_.isEmpty(args)) return [];

    let callArgs = [];

    _.each(args, (arg, i) => {
        let argTopoId = createTopoId(compileContext, topoId + ':arg[' + (i + 1).toString() + ']');
        let lastTopoId = compileConcreteValueExpression(argTopoId, arg, compileContext);

        dependsOn(compileContext, lastTopoId, topoId);

        callArgs = callArgs.concat(_.castArray(getCodeRepresentationOf(lastTopoId, compileContext)));
    });

    return callArgs;
}

/**
 * Compile a param of interface from xeml into ast
 * @param index
 * @param param
 * @param compileContext
 * @returns {string}
 */
function compileParam(index, param, compileContext) {
    let type = param.type;

    let typeObject = Types[type];

    if (!typeObject) {
        throw new Error('Unknown field type: ' + type);
    }

    let sanitizerName = `Types.${type.toUpperCase()}.sanitize`;

    let varRef = JsLang.astVarRef(param.name);
    let callAst = JsLang.astCall(sanitizerName, [
        varRef,
        JsLang.astArrayAccess('$meta.params', index),
        JsLang.astVarRef('this.db.i18n'),
    ]);

    let prepareTopoId = createTopoId(compileContext, '$params:sanitize[' + index.toString() + ']');
    //let sanitizeStarting;

    //if (index === 0) {
    //declare $sanitizeState variable for the first time
    //    sanitizeStarting = JsLang.astVarDeclare(varRef, callAst, false, false, `Sanitize param "${param.name}"`);
    //} else {
    //let sanitizeStarting = ;

    //let lastPrepareTopoId = '$params:sanitize[' + (index - 1).toString() + ']';
    //dependsOn(compileContext, lastPrepareTopoId, prepareTopoId);
    //}

    compileContext.astMap[prepareTopoId] = [JsLang.astAssign(varRef, callAst, `Sanitize argument "${param.name}"`)];

    addCodeBlock(compileContext, prepareTopoId, {
        type: AST_BLK_PARAM_SANITIZE,
    });

    dependsOn(compileContext, prepareTopoId, compileContext.mainStartId);

    let topoId = createTopoId(compileContext, param.name);
    dependsOn(compileContext, compileContext.mainStartId, topoId);

    let value = wrapParamReference(param.name, param);
    let endTopoId = compileVariableReference(topoId, value, compileContext);

    let readyTopoId = createTopoId(compileContext, topoId + ':ready');
    dependsOn(compileContext, endTopoId, readyTopoId);

    return readyTopoId;
}

/**
 * Compile a model field preprocess information into ast.
 * @param {object} param - Field information
 * @param {object} compileContext - Compilation context
 * @returns {string}
 */
function compileField(paramName, param, compileContext) {
    // 1. reference to the latest object that is passed qualifier checks
    // 2. if modifiers exist, wrap the ref into a piped value
    // 3. process the ref (or piped ref) and mark as end
    // 4. build dependencies: latest.field -> ... -> field:ready
    let topoId = createTopoId(compileContext, paramName);
    let contextName = 'latest.' + paramName;
    //compileContext.astMap[topoId] = JsLang.astVarRef(contextName, true);

    let value = wrapParamReference(contextName, param);
    let endTopoId = compileConcreteValueExpression(topoId, value, compileContext);

    let readyTopoId = createTopoId(compileContext, topoId + ':ready');
    dependsOn(compileContext, endTopoId, readyTopoId);

    return readyTopoId;
}

function wrapParamReference(name, value) {
    let ref = Object.assign({ $xt: 'ObjectReference', name: name });

    if (!_.isEmpty(value.modifiers)) {
        return { $xt: 'PipedValue', value: ref, modifiers: value.modifiers };
    }

    return ref;
}

function hasModelField(operand, compileContext) {
    if (_.isPlainObject(operand) && operand.$xt === 'ObjectReference') {
        let [baseVar, ...rest] = operand.name.split('.');

        return compileContext.variables[baseVar] && compileContext.variables[baseVar].ongoing && rest.length > 0;
    }

    return false;
}

/**
 * Translate a then clause from xeml into ast in return block.
 * @param {string} startId
 * @param {string} endId
 * @param then
 * @param compileContext
 * @returns {object} AST object
 */
function translateReturnThenAst(startId, endId, then, compileContext) {
    if (_.isPlainObject(then)) {
        if (then.$xt === 'ThrowExpression') {
            let args;
            if (then.args) {
                args = translateArgs(startId, then.args, compileContext);
            } else {
                args = [];
            }
            return JsLang.astThrow(then.errorType || defaultError, then.message || args);
        }

        if (then.$xt === 'ReturnExpression') {
            return translateReturnValueAst(startId, endId, then.value, compileContext);
        }
    }

    //then expression is an xeml concrete value
    if (_.isArray(then) || _.isPlainObject(then)) {
        let valueEndId = compileConcreteValueExpression(startId, then, compileContext);
        then = compileContext.astMap[valueEndId];
    }

    return JsLang.astReturn(then);
}

/**
 * Translate a then clause from xeml into ast
 * @param {string} startId
 * @param {string} endId
 * @param then
 * @param compileContext
 * @param assignTo
 * @returns {object} AST object
 */
function translateThenAst(startId, endId, then, compileContext, assignTo) {
    if (_.isPlainObject(then)) {
        if (then.$xt === 'ThrowExpression') {
            let args;
            if (then.args) {
                args = translateArgs(startId, then.args, compileContext);
            } else {
                args = [];
            }
            return JsLang.astThrow(then.errorType || defaultError, then.message || args);
        }

        if (then.$xt === 'LogicalExpression') {
            /*
            switch (then.operator) {
                case 'and':
                    op = '&&';
                    break;

                case 'or':
                    op = '||';
                    break;

                default:
                    throw new Error('Unsupported test operator: ' + test.operator);
            }
            */
        }

        if (then.$xt === 'BinaryExpression') {
            if (!hasModelField(then.left, compileContext)) {
                throw new Error('Invalid query condition: the left operand need to be an entity field.');
            }

            if (hasModelField(then.right, compileContext)) {
                throw new Error(
                    'Invalid query condition: the right operand should not be an entity field. Use dataset instead if joining is required.'
                );
            }

            let condition = {};
            let startRightId = createTopoId(compileContext, startId + '$binOp:right');
            dependsOn(compileContext, startId, startRightId);

            let lastRightId = compileConcreteValueExpression(startRightId, then.right, compileContext);
            dependsOn(compileContext, lastRightId, endId);

            if (then.operator === '==') {
                condition[then.left.name.split('.', 2)[1]] = compileContext.astMap[lastRightId];
            } else {
                condition[then.left.name.split('.', 2)[1]] = {
                    [OPERATOR_TOKEN[op]]: compileContext.astMap[lastRightId],
                };
            }

            return JsLang.astAssign(assignTo, JsLang.astValue(condition));
        }

        if (then.$xt === 'UnaryExpression') {
        }
    }

    //then expression is an xeml concrete value
    if (_.isArray(then) || _.isPlainObject(then)) {
        let valueEndId = compileConcreteValueExpression(startId, then, compileContext);
        then = compileContext.astMap[valueEndId];
    }

    return JsLang.astAssign(assignTo, then);
}

/**
 * Translate a return clause from xeml into ast
 * @param {string} startTopoId - The topo id of the starting state of return clause
 * @param {string} endTopoId - The topo id of the ending state of return clause
 * @param value
 * @param compileContext
 * @returns {object} AST object
 */
function translateReturnValueAst(startTopoId, endTopoId, value, compileContext) {
    let valueTopoId = compileConcreteValueExpression(startTopoId, value, compileContext);
    if (valueTopoId !== startTopoId) {
        dependsOn(compileContext, valueTopoId, endTopoId);
    }

    return JsLang.astReturn(getCodeRepresentationOf(valueTopoId, compileContext));
}

/**
 * Compile a return clause from xeml into ast
 * @param {string} startTopoId - The topo id of the starting process to the target value expression
 * @param value
 * @param compileContext
 * @returns {object} AST object
 */
function compileReturn(startTopoId, value, compileContext) {
    let endTopoId = createTopoId(compileContext, '$return');
    dependsOn(compileContext, startTopoId, endTopoId);

    compileContext.astMap[endTopoId] = translateReturnValueAst(startTopoId, endTopoId, value, compileContext);

    addCodeBlock(compileContext, endTopoId, {
        type: AST_BLK_VIEW_RETURN,
    });

    return endTopoId;
}

/**
 * Compile a find one operation from xeml into ast
 * @param {int} index
 * @param {object} operation - Xeml node
 * @param {object} compileContext -
 * @param {string} dependency
 * @returns {string} last topoId
 */
function compileFindOne(index, operation, compileContext, dependency) {
    pre: dependency;

    let endTopoId = createTopoId(compileContext, 'op$' + index.toString());
    let conditionVarName = endTopoId + '$condition';

    let ast = [JsLang.astVarDeclare(conditionVarName)];

    assert: operation.condition;

    compileContext.variables[operation.model] = { type: 'entity', source: 'findOne', ongoing: true };

    if (operation.condition.$xt) {
        //special condition

        if (operation.condition.$xt === 'cases') {
            let topoIdPrefix = endTopoId + '$cases';
            let lastStatement;

            if (operation.condition.else) {
                let elseStart = createTopoId(compileContext, topoIdPrefix + ':else');
                let elseEnd = createTopoId(compileContext, topoIdPrefix + ':end');
                dependsOn(compileContext, elseStart, elseEnd);
                dependsOn(compileContext, elseEnd, endTopoId);

                lastStatement = translateThenAst(
                    elseStart,
                    elseEnd,
                    operation.condition.else,
                    compileContext,
                    conditionVarName
                );
            } else {
                lastStatement = JsLang.astThrow('ServerError', 'Unexpected state.');
            }

            if (_.isEmpty(operation.condition.items)) {
                throw new Error('Missing case items');
            }

            _.reverse(operation.condition.items).forEach((item, i) => {
                if (item.$xt !== 'ConditionalStatement') {
                    throw new Error('Invalid case item.');
                }

                i = operation.condition.items.length - i - 1;

                let casePrefix = topoIdPrefix + '[' + i.toString() + ']';
                let caseTopoId = createTopoId(compileContext, casePrefix);
                dependsOn(compileContext, dependency, caseTopoId);

                let caseResultVarName = '$' + topoIdPrefix + '_' + i.toString();

                let lastTopoId = compileConditionalExpression(item.test, compileContext, caseTopoId);
                let astCaseTtem = getCodeRepresentationOf(lastTopoId, compileContext);

                assert: !Array.isArray(astCaseTtem), 'Invalid case item ast.';

                astCaseTtem = JsLang.astVarDeclare(
                    caseResultVarName,
                    astCaseTtem,
                    true,
                    false,
                    `Condition ${i} for find one ${operation.model}`
                );

                let ifStart = createTopoId(compileContext, casePrefix + ':then');
                let ifEnd = createTopoId(compileContext, casePrefix + ':end');
                dependsOn(compileContext, lastTopoId, ifStart);
                dependsOn(compileContext, ifStart, ifEnd);

                lastStatement = [
                    astCaseTtem,
                    JsLang.astIf(
                        JsLang.astVarRef(caseResultVarName),
                        JsLang.astBlock(translateThenAst(ifStart, ifEnd, item.then, compileContext, conditionVarName)),
                        lastStatement
                    ),
                ];
                dependsOn(compileContext, ifEnd, endTopoId);
            });

            ast = ast.concat(_.castArray(lastStatement));
        } else {
            throw new Error('todo');
        }
    } else {
        throw new Error('todo');
    }

    ast.push(
        JsLang.astVarDeclare(operation.model, JsLang.astAwait(`this.findOne_`, JsLang.astVarRef(conditionVarName)))
    );

    delete compileContext.variables[operation.model].ongoing;

    let modelTopoId = createTopoId(compileContext, operation.model);
    dependsOn(compileContext, endTopoId, modelTopoId);
    compileContext.astMap[endTopoId] = ast;
    return endTopoId;
}

function compileDbOperation(index, operation, compileContext, dependency) {
    let lastTopoId;

    switch (operation.$xt) {
        case 'FindOneStatement':
            lastTopoId = compileFindOne(index, operation, compileContext, dependency);
            break;

        case 'find':
            //prepareDbConnection(compileContext);
            throw new Error('tbi');
            break;

        case 'update':
            throw new Error('tbi');
            //prepareDbConnection(compileContext);
            break;

        case 'create':
            throw new Error('tbi');
            //prepareDbConnection(compileContext);
            break;

        case 'delete':
            throw new Error('tbi');
            //prepareDbConnection(compileContext);
            break;

        case 'DoStatement':
            let doBlock = operation.do;
            lastTopoId = compileDoStatement(index, doBlock, compileContext, dependency);
            break;

        case 'assignment':
            throw new Error('tbi');
            break;

        default:
            throw new Error('Unsupported operation type: ' + operation.type);
    }

    addCodeBlock(compileContext, lastTopoId, {
        type: AST_BLK_INTERFACE_OPERATION,
    });

    return lastTopoId;
}

function compileDoStatement(index, operation, compileContext, dependency) {}

/**
 * Compile exceptional return
 * @param {object} xemlNode
 * @param {object} compileContext
 * @param {string} [dependency]
 * @returns {string} last topoId
 */
function compileExceptionalReturn(xemlNode, compileContext, dependency) {
    pre: _.isPlainObject(xemlNode) && xemlNode.$xt === 'ReturnExpression';

    let endTopoId = createTopoId(compileContext, '$return'),
        lastExceptionId = dependency;

    if (!_.isEmpty(xemlNode.exceptions)) {
        xemlNode.exceptions.forEach((item, i) => {
            if (_.isPlainObject(item)) {
                if (item.$xt !== 'ConditionalStatement') {
                    throw new Error('Unsupported exceptional type: ' + item.$xt);
                }

                let exceptionStartId = createTopoId(compileContext, endTopoId + ':except[' + i.toString() + ']');
                let exceptionEndId = createTopoId(compileContext, endTopoId + ':except[' + i.toString() + ']:done');
                if (lastExceptionId) {
                    dependsOn(compileContext, lastExceptionId, exceptionStartId);
                }

                let lastTopoId = compileConditionalExpression(item.test, compileContext, exceptionStartId);

                let thenStartId = createTopoId(compileContext, exceptionStartId + ':then');
                dependsOn(compileContext, lastTopoId, thenStartId);
                dependsOn(compileContext, thenStartId, exceptionEndId);

                compileContext.astMap[exceptionEndId] = JsLang.astIf(
                    getCodeRepresentationOf(lastTopoId, compileContext),
                    JsLang.astBlock(translateReturnThenAst(thenStartId, exceptionEndId, item.then, compileContext)),
                    null,
                    `Return on exception #${i}`
                );

                addCodeBlock(compileContext, exceptionEndId, {
                    type: AST_BLK_EXCEPTION_ITEM,
                });

                lastExceptionId = exceptionEndId;
            } else {
                throw new Error('Unexpected.');
            }
        });
    }

    dependsOn(compileContext, lastExceptionId, endTopoId);

    let returnStartTopoId = createTopoId(compileContext, '$return:value');
    dependsOn(compileContext, returnStartTopoId, endTopoId);

    compileContext.astMap[endTopoId] = translateReturnValueAst(
        returnStartTopoId,
        endTopoId,
        xemlNode.value,
        compileContext
    );

    addCodeBlock(compileContext, endTopoId, {
        type: AST_BLK_INTERFACE_RETURN,
    });

    return endTopoId;
}

function createTopoId(compileContext, name) {
    if (compileContext.topoNodes.has(name)) {
        throw new Error(`Topo id "${name}" already created.`);
    }

    assert: !compileContext.topoSort.hasDependency(name), 'Already in topoSort!';

    compileContext.topoNodes.add(name);

    return name;
}

function dependsOn(compileContext, previousOp, currentOp) {
    pre: previousOp !== currentOp, 'Self depending';

    compileContext.linker.log('debug', currentOp + ' \x1b[33mdepends on\x1b[0m ' + previousOp);

    if (!compileContext.topoNodes.has(currentOp)) {
        throw new Error(`Topo id "${currentOp}" not created.`);
    }

    compileContext.topoSort.add(previousOp, currentOp);
}

function addCodeBlock(compileContext, topoId, blockMeta) {
    if (!(topoId in compileContext.astMap)) {
        throw new Error(`AST not found for block with topoId: ${topoId}`);
    }

    compileContext.mapOfTokenToMeta.set(topoId, blockMeta);

    compileContext.linker.log('verbose', `Adding ${blockMeta.type} "${topoId}" into source code.`);
}

function getCodeRepresentationOf(topoId, compileContext) {
    let lastSourceType = compileContext.mapOfTokenToMeta.get(topoId);

    if (
        lastSourceType &&
        (lastSourceType.type === AST_BLK_PROCESSOR_CALL || lastSourceType.type === AST_BLK_ACTIVATOR_CALL)
    ) {
        //for modifier, just use the final result
        return JsLang.astVarRef(lastSourceType.target, true);
    }

    let ast = compileContext.astMap[topoId];
    if (ast.type === 'MemberExpression' && ast.object.name === 'latest') {
        return JsLang.astConditional(
            JsLang.astCall('latest.hasOwnProperty', [ast.property.value]) /** test */,
            ast /** consequent */,
            { ...ast, object: { ...ast.object, name: 'existing' } }
        );
    }

    return compileContext.astMap[topoId];
}

function createCompileContext(moduleName, linker, sharedContext) {
    let compileContext = {
        moduleName,
        linker,
        variables: {},
        topoNodes: new Set(),
        topoSort: new TopoSort(),
        astMap: {}, // Store the AST for a node
        mapOfTokenToMeta: new Map(), // Store the source code block point
        modelVars: new Set(),
        mapOfFunctorToFile: (sharedContext && sharedContext.mapOfFunctorToFile) || {}, // Use to record import lines
        newFunctorFiles: (sharedContext && sharedContext.newFunctorFiles) || [],
    };

    compileContext.mainStartId = createTopoId(compileContext, '$main');

    linker.log('verbose', `Created compilation context for "${moduleName}".`);

    return compileContext;
}

function isTopLevelBlock(topoId) {
    return topoId.indexOf(':arg[') === -1 && topoId.indexOf('$cases[') === -1 && topoId.indexOf('$exceptions[') === -1;
}

function replaceVarRefScope(varRef, targetScope) {
    if (_.isPlainObject(varRef)) {
        assert: varRef.$xt === 'ObjectReference';

        return { $xt: 'ObjectReference', name: replaceVarRefScope(varRef.name, targetScope) };
    }

    assert: typeof varRef === 'string';

    let parts = varRef.split('.');
    assert: parts.length > 1;

    parts.splice(0, 1, targetScope);
    return parts.join('.');
}

module.exports = {
    compileParam,
    compileField,
    compileDbOperation,
    compileExceptionalReturn,
    compileReturn,
    createTopoId,
    createCompileContext,
    dependsOn,
    addCodeBlock,

    AST_BLK_FIELD_PRE_PROCESS,
    AST_BLK_PROCESSOR_CALL,
    AST_BLK_VALIDATOR_CALL,
    AST_BLK_ACTIVATOR_CALL,
    AST_BLK_VIEW_OPERATION,
    AST_BLK_VIEW_RETURN,
    AST_BLK_INTERFACE_OPERATION,
    AST_BLK_INTERFACE_RETURN,
    AST_BLK_EXCEPTION_ITEM,

    OOL_MODIFIER_CODE_FLAG: XEML_MODIFIER_CODE_FLAG,
};

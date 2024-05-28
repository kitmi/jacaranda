"use strict";

const AST = require('../../util/ast.js');

module.exports = function (dbService, viewName, viewInfo) {
    let spName = dbService.getViewSPName(viewName);
    
    return [
        AST.astVarDeclare('viewData',
            AST.astAwait('this.db.service.query', [AST.astValue('call `' + spName + '`(??);'), AST.astValue(viewInfo.params.map(p => AST.astVarRef(p.name)))]),
            false, false, 'call stored procedure to get view data'
        )
    ];
};
"use strict";
const { tryRequire } = require('@genx/sys');
module.exports = function(info, i18n, options) {
    const { nanoid } = tryRequire('nanoid');
    return nanoid(options);
};

//# sourceMappingURL=nanoid.js.map
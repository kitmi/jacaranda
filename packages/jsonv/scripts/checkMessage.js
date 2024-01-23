#!/usr/bin/env node

import Jsv from '../src/bundle';
import ops from '../src/validateOperators';

Object.values(ops).forEach((op) => {
    // check whether message exist
    if (!(op in Jsv.config.messages.validationErrors)) {
        throw new Error(`Missing message for operator "${op}".`);
    }
});

delete Jsv.config.messages.validationErrors;
Jsv.config.setLocale('zh');
Object.values(ops).forEach((op) => {
    // check whether message exist
    if (!(op in Jsv.config.messages.validationErrors)) {
        throw new Error(`Missing message for operator "${op}".`);
    }
});

delete Jsv.config.messages.validationErrors;
Jsv.config.setLocale('zh-HK');
Object.values(ops).forEach((op) => {
    // check whether message exist
    if (!(op in Jsv.config.messages.validationErrors)) {
        throw new Error(`Missing message for operator "${op}".`);
    }
});

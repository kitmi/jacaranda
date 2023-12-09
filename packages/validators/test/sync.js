import { Types } from "../src/allSync";

Types.OBJECT.sanitize({ a: 1 }, { schema: 
    { a: { type: 'number', mod: [ [ '~jsv', { $gt: 2 } ] ] } } 
});
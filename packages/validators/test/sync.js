import { Types } from "../src/allSync";

Types.OBJECT.sanitize({ a: 1 }, { schema: 
    { a: { type: 'number', post: [ [ '~jsv', { $gt: 2 } ] ] } } 
});
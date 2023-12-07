import { addType } from './types';

import ANY from './any';
import ARRAY from './array';
import BOOLEAN from './boolean';
import DATETIME from './datetime';
import INTEGER from './integer';
import NUMBER from './number';
import OBJECT from './object';
import TEXT from './text';
import BINARY from './binary';
import BIGINT from './bigint';

addType('ANY', ANY);
addType('ARRAY', ARRAY);
addType('BOOLEAN', BOOLEAN);
addType('DATETIME', DATETIME);
addType('INTEGER', INTEGER);
addType('NUMBER', NUMBER);
addType('OBJECT', OBJECT);
addType('TEXT', TEXT);
addType('BINARY', BINARY);
addType('BIGINT', BIGINT);

export * from './errors';
export * from './types';
export * from './functions';

export { default } from './types';
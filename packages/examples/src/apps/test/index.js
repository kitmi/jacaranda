import path from 'node:path';

const appPath = path.resolve(__dirname);

export default {
    name: 'test',
    version: '1.0.0',
    depends: ['base'],
    author: 'Author Name',
    category: 'Category',
    description: `Description text`,
    appPath,
};

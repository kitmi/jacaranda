import baseName from './baseName';

const changeExtName = (str, newExtName, includePath) => {
    return baseName(str, includePath) + '.' + newExtName;
};

export default changeExtName;

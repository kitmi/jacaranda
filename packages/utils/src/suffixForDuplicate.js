import splitBaseAndExt from './splitBaseAndExt';

function suffixForDuplicate(name, fnCheckDuplicate, isFileName = false, delimiter = '') {
    let counter = 2;

    let baseName, extName;

    if (isFileName) {
        [baseName, extName] = splitBaseAndExt(name, true);
    }
    let fullName;

    do {
        fullName = isFileName ? `${baseName}${delimiter}${counter}${extName}` : `${name}${delimiter}${counter}`;
        counter++;
    } while (fnCheckDuplicate(fullName));

    return fullName;
}

export default suffixForDuplicate;

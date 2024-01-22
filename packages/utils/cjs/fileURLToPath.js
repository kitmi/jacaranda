// simplied version of url.fileURLToPath
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
function fileURLToPath(url) {
    // Determine the platform
    const platform = process.env.TEST_PLATFORM || process.platform;
    // Remove the "file://" from the start of the URL
    let path = url.replace(/^file:\/\//, '');
    // On Windows, handle UNC paths correctly and replace slashes with backslashes
    if (platform === 'win32') {
        if (path.toLowerCase().startsWith('localhost/')) {
            path = path.slice(9);
        }
        // If the path starts with a slash followed by a letter and a colon, it's a drive letter
        if (/^\/[a-z]:/i.test(path)) {
            path = path.slice(1);
        } else {
            path = '\\\\' + path;
        }
        // Replace the other slashes with backslashes
        path = path.replace(/\//g, '\\');
    } else if (path.toLowerCase().startsWith('localhost/')) {
        path = path.slice(9);
    }
    // Decode any URL-encoded characters
    path = decodeURIComponent(path);
    return path;
}
const _default = fileURLToPath;

//# sourceMappingURL=fileURLToPath.js.map
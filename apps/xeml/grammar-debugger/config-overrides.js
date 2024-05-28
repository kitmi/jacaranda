const { override, fixBabelImports, addDecoratorsLegacy,  } = require('customize-cra');

module.exports = override(
    addDecoratorsLegacy(),

    //https://ant.design/docs/react/use-with-create-react-app#Customize-Theme
    fixBabelImports('antd', {
        libraryName: 'antd',
        libraryDirectory: 'es',
        style: true
    }), 
);
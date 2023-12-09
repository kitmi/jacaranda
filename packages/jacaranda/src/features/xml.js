import Feature from '../Feature';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    packages: ['fast-xml-parser'],

    load_: async function (app, options, name) {
        const { parser: parserOptions, builder: builderOptions } = options;

        const { XMLParser, XMLBuilder } =
            app.tryRequire('fast-xml-parser');

        const service = {
            parse: (xml) => {
                const parser = new XMLParser(parserOptions);
                return parser.parse(xml);
            },

            build: (obj) => {                
                const builder = new XMLBuilder(builderOptions);
                return builder.build(obj);
            },
        };

        app.registerService(name, service);
    },
};

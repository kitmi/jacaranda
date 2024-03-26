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
const _Feature = /*#__PURE__*/ _interop_require_default(require("../Feature"));
const _utils = require("@kitmi/utils");
const _sys = require("@kitmi/sys");
const _yaml = /*#__PURE__*/ _interop_require_default(require("yaml"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const _default = {
    stage: _Feature.default.SERVICE,
    groupable: true,
    load_: async function(app, options, name) {
        const service = {
            importList_: async (yamlFiles)=>{
                const prisma = app.getService('prisma');
                for (const file of yamlFiles){
                    const fileContent = await _sys.fs.readFile(file, 'utf-8');
                    const dataset = _yaml.default.parse(fileContent);
                    await service.import_(prisma, dataset);
                }
            },
            import_: async (prisma, dataset)=>{
                const { model, refs, pre, data } = dataset;
                let pipeline_;
                if (pre) {
                    const pipelineService = app.getService('pipeline');
                    pipeline_ = pipelineService.create(`${model} Pre-process`, pre, {
                        modelName: model
                    });
                }
                for (let record of data){
                    if (pipeline_) {
                        record = await pipeline_(record);
                    }
                    const refFields = _utils._.pick(record, refs);
                    const updateFields = _utils._.omit(record, refs);
                    await prisma[model].upsert({
                        where: refFields,
                        create: record,
                        update: updateFields
                    });
                }
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=prismaImporter.js.map
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
const _jacaranda = require("@kitmi/jacaranda");
const _utils = require("@kitmi/utils");
const _sys = require("@kitmi/sys");
const _yaml = /*#__PURE__*/ _interop_require_default(require("yaml"));
const _nodepath = /*#__PURE__*/ _interop_require_default(require("node:path"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const YAML_EXT = [
    '.yaml',
    '.yml'
];
const JSON_EXT = [
    '.json'
];
const _default = {
    stage: _jacaranda.Feature.SERVICE,
    groupable: true,
    load_: async function(app, options, name) {
        const { service: serviceName } = app.featureConfig(options, {
            schema: {
                service: {
                    type: 'text'
                }
            }
        }, name);
        const service = {
            importList_: async (files)=>{
                const dbService = app.getService(serviceName);
                for (const file of files){
                    const extName = _nodepath.default.extname(file);
                    const fileContent = await _sys.fs.readFile(file, 'utf-8');
                    let dataset;
                    if (YAML_EXT.includes(extName)) {
                        dataset = _yaml.default.parse(fileContent);
                    } else if (JSON_EXT.includes(extName)) {
                        dataset = JSON.parse(fileContent);
                    } else {
                        throw new Error(`Unsupported file format: ${_nodepath.default.basename(file)}`);
                    }
                    await service.import_(dbService, dataset);
                }
            },
            import_: async (dbService, dataset)=>{
                const { model, refs, pre, post, data } = dataset;
                let prePipeline_, postPipeline_;
                let prePipelineData;
                const _globalBag = {};
                if (pre) {
                    const pipelineService = app.getService('pipeline');
                    prePipeline_ = pipelineService.create(`${model} Pre-process`, pre, {
                        modelName: model,
                        global: _globalBag
                    });
                }
                if (post) {
                    const pipelineService = app.getService('pipeline');
                    postPipeline_ = pipelineService.create(`${model} Post-process`, post, {
                        modelName: model,
                        global: _globalBag
                    });
                }
                for (let record of data){
                    if (prePipeline_) {
                        [prePipelineData, record] = await prePipeline_(record);
                    }
                    const refFields = _utils._.pick(record, refs);
                    const updateFields = _utils._.omit(record, refs);
                    console.log({
                        where: refFields,
                        create: record,
                        update: updateFields
                    });
                    await dbService[model].upsert({
                        where: refFields,
                        create: record,
                        update: updateFields
                    });
                    if (postPipeline_) {
                        let extra;
                        if (prePipelineData) {
                            extra = {
                                $pre: prePipelineData.getStepVariables()
                            };
                        }
                        await postPipeline_(record, extra);
                    }
                }
            }
        };
        app.registerService(name, service);
    }
};

//# sourceMappingURL=dbImporter.js.map
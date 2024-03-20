import Feature from '../Feature';
import { _ } from '@kitmi/utils';
import { fs } from '@kitmi/sys';
import yaml from 'yaml';

export default {
    stage: Feature.SERVICE,

    groupable: true,

    load_: async function (app, options, name) {
        const service = {
            importList_: async (yamlFiles) => {
                const prisma = app.getService('prisma');

                for (const file of yamlFiles) {
                    const fileContent = await fs.readFile(file, 'utf-8');
                    const dataset = yaml.parse(fileContent);
                    await service.import_(prisma, dataset);
                }
            },

            import_: async (prisma, dataset) => {
                const { model, refs, data } = dataset;

                for (const record of data) {
                    const refFields = _.pick(record, refs);
                    const updateFields = _.omit(record, refs);

                    await prisma[model].upsert({
                        where: refFields,
                        create: record,
                        update: updateFields,
                    });
                }
            },
        };

        app.registerService(name, service);
    },
};

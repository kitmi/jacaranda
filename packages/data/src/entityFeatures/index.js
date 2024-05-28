const path = require('path');
const { _ } = require('@genx/july');
const { fs } = require('@genx/sys');

const basePath = path.resolve(__dirname);
const features = fs.readdirSync(basePath);

const featureRules = {};

features.forEach((file) => {
    const f = path.join(basePath, file);
    if (fs.statSync(f).isFile() && _.endsWith(file, '.js')) {
        const featureName = path.basename(file, '.js');
        if (featureName === 'index') return;

        const feature = require(f);

        _.forOwn(feature, (action, ruleName) => {
            const key = featureName + '.' + ruleName;

            if (key in featureRules) {
                throw new Error(`Duplicate feature rule: ${key}`);
            }
            featureRules[key] = action;
        });
    }
});

module.exports = {
    applyRules_: async (ruleName, entityModel, context) => {
        for (const featureName in entityModel.meta.features) {
            const key = featureName + '.' + ruleName;
            const action = featureRules[key];

            if (action) {
                let featureInfo = entityModel.meta.features[featureName];

                if (
                    context.options.$features &&
                    featureName in context.options.$features
                ) {
                    const customFeatureInfo =
                        context.options.$features[featureName];
                    if (!customFeatureInfo) {
                        continue;
                    }

                    featureInfo = { ...featureInfo, ...customFeatureInfo };
                }

                const asExpected = await action(
                    featureInfo,
                    entityModel,
                    context
                );
                if (!asExpected) return false;
            }
        }

        return true;
    },
};

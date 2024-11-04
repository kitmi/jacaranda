const FEATURE_NAME = 'createBefore';

/**
 * Automatically create associated entity when it is created.
 * @module EntityFeature_CreateBefore
 */

/**
 * Initialize the feature
 * @param {Entity} entity - Entity to apply this feature
 */
function feature(entity, args = []) {
    let [relation, initData] = args;

    if (relation == null) {
        throw new Error('Missing the target associated entity anchor!');
    }

    const options = { relation, initData };

    entity.addFeature(FEATURE_NAME, options);
}

module.exports = feature;

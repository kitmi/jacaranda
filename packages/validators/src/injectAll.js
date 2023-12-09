import jsv from './validators/jsv';
import text from './validators/text';
import commonValidators from './validators/common';

import jsx from './processors/jsx';
import commonProcessors from './processors/common';

import commonActivators from './activators/common';

const injectAll = (validator) => {
    validator.addModifiers('validator', jsv);
    validator.addModifiers('validator', text);
    validator.addModifiers('validator', commonValidators);

    validator.addModifiers('processor', jsx);
    validator.addModifiers('processor', commonProcessors);    

    validator.addModifiers('activator', commonActivators);
};

export default injectAll;

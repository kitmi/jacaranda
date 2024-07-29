// v.{{ schemaVersion }} by xeml
import { _, batchAsync_, eachAsync_ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';
import EntityModel from '@kitmi/data/drivers/{{ driver }}/EntityModel';
{{ imports|safe }}

{{ assigns|safe }}

class {{ className }} extends EntityModel {    
    {{ classBody|safe }}
    {{ extraMethods|safe }}
}
    
{{ className }}.meta = {{ entityMeta|safe }};
{{ statics|safe }}

export default {{ className }};
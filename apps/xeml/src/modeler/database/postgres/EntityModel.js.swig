import { _ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';
import { Activators, Processors, Validators } from '@kitmi/data';
import EntityModel from '@kitmi/data/drivers/{{ driver }}/EntityModel';
{{ imports|safe }}

class {{ className }} extends EntityModel {    
    {{ classBody|safe }}
}
    
{{ className }}.meta = {{ entityMeta|safe }};

export default {{ className }};
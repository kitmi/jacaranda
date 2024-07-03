// v.{{ schemaVersion }} by xeml
import { _ } from '@kitmi/utils';
import { ValidationError } from '@kitmi/types';
import { _Activators, _Processors, _Validators, xrCol, xrExpr, xrCall, xrRaw, xrAlias, xrDataSet } from '@kitmi/data';
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
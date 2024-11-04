// v.{{ schemaVersion }} by xeml
import { DbModel } from '@kitmi/data';
{% for entity in entities %}
import {{ entity }} from './{{ schemaName }}/{{ entity }}';{% endfor %}

class {{ className }} extends DbModel {   
}

{{ className }}.meta = {
    schemaName: '{{ schemaName }}',
    entities: { {% for entity in entities %}
        {{ entity }},{% endfor %}
    }
}

export default {{ className }};
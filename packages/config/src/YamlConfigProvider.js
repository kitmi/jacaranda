import { _ } from '@kitmi/utils';
import yaml from 'yaml';
import JsonConfigProvider from './JsonConfigProvider';

class YamlConfigProvider extends JsonConfigProvider {
    parse(fileContent) {
        return yaml.parse(fileContent);
    }

    stringify() {
        return yaml.stringify(this.config ?? {});
    }
}

export default YamlConfigProvider;

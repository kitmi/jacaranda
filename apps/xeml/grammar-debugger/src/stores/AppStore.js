import { observable, action } from 'mobx';
import compileGrammar from '../actions/compileGrammar';
import parseInputText from '../actions/parseInputText';

class AppStore {
    @observable compiledGrammar = null;
    @observable compiledParser = null;
    @observable parseError = false;

    //@action setParseText = () => this.parsedText = result;

    parser = null;

    async parseText(text) {
        if (!this.parser) {
            let grammar = await fetch('/xeml.jison');

            const { compiledGrammar, parser } = compileGrammar(grammar);
            this.parser = parser;
        }

        const { error, message, parsedResult, lexDebugger, parserDebugger } = parseInputText(text); 

    }
}

export default AppStore;
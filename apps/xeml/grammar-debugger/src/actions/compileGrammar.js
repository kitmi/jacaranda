/* global Jison,ebnf,parser */
importScripts("./util/jison.js");
Jison.print = function() {};

export default function compileGrammar(grammar) {
    let compiledGrammar = ebnf.parse(grammar);

    var compiledParser = new Jison.Parser(compiledGrammar).generate();

    return { compiledGrammar, compiledParser };
}

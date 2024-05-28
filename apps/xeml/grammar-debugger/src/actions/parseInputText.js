export default function parseInputText(textToParse) {
    Jison.lexDebugger = [];
    Jison.parserDebugger = [];


    let parsedResult;
    
    try {
        parsedResult = compiledParser.parse(textToParse);
    } catch(e) {
        return {
            error: true,
            message: e.message,
            lexDebugger: Jison.lexDebugger
        };
    }
     
    return {
        parsedResult: parsedResult,
        lexDebugger: Jison.lexDebugger,
        parserDebugger: Jison.parserDebugger
    };
}

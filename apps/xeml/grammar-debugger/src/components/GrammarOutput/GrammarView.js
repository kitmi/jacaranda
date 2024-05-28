import React from "react";

import GrammarSuccessView from "./GrammarSuccessView";
//import GrammarErrorView from "./GrammarErrorView";

const GrammarView = ({ appStore }) => {

    return <div>
        <h5>Compiled grammar</h5>
        <GrammarSuccessView
            compiledGrammar={appStore.compiledGrammar}
            compiledParser={appStore.compiledParser}
        />
    </div>
};

export default inject("appStore")(observer(GrammarView));

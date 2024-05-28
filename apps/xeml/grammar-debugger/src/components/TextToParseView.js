import React from "react";
import { Input } from "antd";
import { observer, inject } from "mobx-react";

const { TextArea } = Input;

//var ParserActionCreator = require('../../actions/ParserActionCreator');
//var UserInputActionCreator = require('../../actions/UserInputActionCreator');

const TextToParseView = ({ appStore }) => {
    const onChange = ({ target: { value } }) => {
        appStore.parseText(value);
    };
    /*
  handleTextToParseChange: function (event) {
    var text = event.target.value;
    UserInputActionCreator.updateTextToParse(text);
    ParserActionCreator.parseText(text);
  },
  var inputStyle = {
      width: '100%'
    };
  */

    return (
        <div>
            <TextArea onChange={onChange} placeholder="Paste geml code here" autoSize={{ minRows: 10, maxRows: 40 }} />
        </div>
    );
};

export default inject("appStore")(observer(TextToParseView));

schema_views
    : "views" NEWLINE INDENT schema_views_block DEDENT NEWLINE? -> { views: $4 }
    ;

schema_views_block
    : identifier_or_string NEWLINE -> [ $1 ]
    | identifier_or_string NEWLINE schema_views_block -> [ $1 ].concat($3)
    ;


interfaces_statement
    : "interface" NEWLINE INDENT interfaces_statement_block DEDENT NEWLINE? -> { interfaces: $4 }
    ;

interfaces_statement_block
    : interface_definition -> Object.assign({}, $1)
    | interface_definition interfaces_statement_block -> Object.assign({}, $1, $2)
    ;

interface_definition
    : identifier_or_string NEWLINE INDENT interface_definition_body DEDENT NEWLINE? -> { [$1]: $4 }
    ;

interface_definition_body
    : accept_or_not implementation return_or_not -> Object.assign({}, $1, { implementation: $2 }, $3)
    ;

accept_or_not
    :
    | accept_statement
    ;

accept_statement
    : "accept" accept_param NEWLINE -> { accept: [ $2 ] }
    | "accept" NEWLINE INDENT accept_block DEDENT NEWLINE? -> { accept: $4 }
    ;

accept_block
    : accept_param NEWLINE -> [ $1 ]
    | accept_param NEWLINE accept_block -> [ $1 ].concat($3)
    ;

accept_param
    : modifiable_param
    | identifier_or_string ":" DOTNAME type_info_or_not type_modifiers_or_not -> Object.assign({ name: $1, type: $3 }, $4, $5)   
    ;

implementation
    : operation -> [ $1 ]
    | operation implementation -> [ $1 ].concat($2)
    ;

operation
    : find_one_operation
    | coding_block /*
    | find_list_operation
    | update_operation
    | create_operation
    | delete_operation    
    | assign_operation   */
    ;

find_one_keywords
    : "findOne"
    | "find" article_keyword
    ;

find_one_operation
    : find_one_keywords identifier_or_string selection_inline_keywords conditional_expression -> { $xt: 'FindOneStatement', model: $2, condition: $4 }
    | find_one_keywords identifier_or_string case_statement -> { $xt: 'FindOneStatement', model: $2, condition: $3 }
    ;    

cases_keywords
    : ":"
    | "by" "cases"    
    | "by" "cases" "as" "below"
    ;   

case_statement
    : cases_keywords NEWLINE INDENT case_condition_block DEDENT NEWLINE? -> { $xt: 'cases', items: $4 }
    | cases_keywords NEWLINE INDENT case_condition_block otherwise_statement DEDENT NEWLINE? -> { $xt: 'cases', items: $4, else: $5 } 
    ;

case_condition_item
    : "when" conditional_expression "=>" condition_as_result_expression -> { $xt: 'ConditionalStatement', test: $2, then: $4 }
    ; 

case_condition_block
    : case_condition_item -> [ $1 ]
    | case_condition_item case_condition_block -> [ $1 ].concat($2)
    ;

otherwise_statement
    : otherwise_keywords "=>" condition_as_result_expression NEWLINE -> $3
    | otherwise_keywords "=>" stop_controll_flow_expression NEWLINE -> $3
    | otherwise_keywords "=>" NEWLINE INDENT stop_controll_flow_expression NEWLINE DEDENT -> $5
    ;

otherwise_keywords
    : "otherwise"
    | "else"
    ;          

stop_controll_flow_expression
    : return_expression
    | throw_error_expression
    ;

condition_as_result_expression
    : conditional_expression NEWLINE
    | NEWLINE INDENT conditional_expression NEWLINE DEDENT -> $3
    ;

return_expression
    : "return" modifiable_value -> { $xt: 'ReturnExpression', value: $2 }
    ;

throw_error_expression
    : "throw" STRING -> { $xt: 'ThrowExpression', message: $2 }
    | "throw" identifier -> { $xt: 'ThrowExpression', errorType: $2 }
    | "throw" identifier "(" gfc_param_list  ")" -> { $xt: 'ThrowExpression', errorType: $2, args: $4 }
    ;

return_or_not
    :
    | return_expression NEWLINE
        { $$ = { return: $1 }; }
    | return_expression "unless" NEWLINE INDENT return_condition_block DEDENT NEWLINE? 
        { $$ = { return: Object.assign($1, { exceptions: $5 }) }; }
    ;

return_condition_item
    : "when" conditional_expression "=>" modifiable_value -> { $xt: 'ConditionalStatement', test: $2, then: $4 }    
    | "when" conditional_expression "=>" throw_error_expression -> { $xt: 'ConditionalStatement', test: $2, then: $4 }    
    ;

return_condition_block
    : return_condition_item NEWLINE -> [ $1 ]
    | return_condition_item NEWLINE return_condition_block -> [ $1 ].concat($3)
    ;

update_operation
    : "update" identifier_or_string "with" inline_object where_expr NEWLINE
        { $$ = { $xt: 'update', target: $2, data: $4, filter: $5 }; }
    ;

create_operation
    : "create" identifier_or_string "with" inline_object NEWLINE
        { $$ = { $xt: 'create', target: $2, data: $4 }; }
    ;

delete_operation
    : "delete" identifier_or_string where_expr NEWLINE
        { $$ = { $xt: 'delete', target: $2, filter: $3 }; }
    ;

coding_block
    : "do" javascript NEWLINE -> { $xt: 'DoStatement', do: $2 }
    ;

assign_operation
    : "set" identifier_or_member_access "<-" value variable_modifier_or_not NEWLINE
        { $$ = { $xt: 'assignment', left: $2, right: Object.assign({ argument: $4 }, $5) }; }
    ;

entity_fields_selections
    : identifier_or_string -> { entity: $1 }     
    | identifier_or_string "->" inline_array -> { entity: $1, projection: $3 }
    ;

article_keyword
    : "a"
    | "an"
    | "the"
    | "one"
    ;    

selection_attributive_keywords
    : "of" "which"
    | "where" 
    | "when" 
    | "with"
    ;

selection_keywords
    : "by"
    | "selectedBy"
    | "selected" "by"    
    ;    

selection_inline_keywords
    : selection_keywords
    | selection_attributive_keywords
    ;

group_by_or_not
    :
    | "group" "by" identifier_string_or_dotname_list NEWLINE -> { groupBy: $3 }
    | "group" "by" NEWLINE INDENT identifier_string_or_dotname_block DEDENT NEWLINE? -> { groupBy: $5 }
    ;

having_or_not
    : 
    | "having" conditional_expression NEWLINE -> { having: $2 }
    ;    

order_by_or_not
    :
    | "order" "by" order_by_list NEWLINE -> { orderBy: $3 }
    | "order" "by" NEWLINE INDENT order_by_block DEDENT NEWLINE? -> { orderBy: $5 }
    ;

order_by_block
    : order_by_clause NEWLINE -> [ $1 ]
    | order_by_clause NEWLINE order_by_block -> [ $1 ].concat($3)
    ;

order_by_clause
    : identifier_string_or_dotname -> { field: $1, ascend: true }
    | identifier_string_or_dotname "ascend" -> { field: $1, ascend: true }
    | identifier_string_or_dotname "<" -> { field: $1, ascend: true }
    | identifier_string_or_dotname "descend" -> { field: $1, ascend: false }
    | identifier_string_or_dotname ">" -> { field: $1, ascend: false }
    ;

order_by_list
    : order_by_clause -> [ $1 ]
    | order_by_clause order_by_list0 -> [ $1 ].concat($2)
    ;

order_by_list0
    : "," order_by_clause -> [ $2 ]
    | "," order_by_clause order_by_list0 -> [ $2 ].concat($3)
    ;

skip_or_not
    :
    | "offset" INTEGER NEWLINE -> { offset: $2 }
    | "offset" REFERENCE NEWLINE -> { offset: $2 }
    ;

limit_or_not
    :
    | "limit" INTEGER NEWLINE -> { limit: $2 }
    | "limit" REFERENCE NEWLINE -> { limit: $2 }
    ;


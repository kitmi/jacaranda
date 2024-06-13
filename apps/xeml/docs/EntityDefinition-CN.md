# Entity定义

## 结构

Entity的定义包含以下子语法块，并建议按照以下顺序来定义。

- with: 特性定义，下称`features`，特性会赋予Entity一些特殊功能，并添加特性所需的字段
- has: 字段定义，下称`fields`
- associations: 关系定义
- key: 主键，目前版本暂时只支持单主键，对于组合主键的表，可添加一个`autoId`，再将组合主键设为`unique`的index
- index: 非外键索引，外键在关系定义中已自动添加
- views: 常用的输出视图数据集定义，即预定义`select`的字段和联合的关系
- inputs: 常用的输入数据集定义
- data: 预定义的初始化数据，不包含测试数据，测试数据可以在migration目录手动添加

## 继承

- 可被继承的定义
    - features
    - fields
    - key
    - index
    - inputs
    - views

- 支持多继承，按照逆序覆盖
  
```xeml
entity A extends B, C
```

以上例子A先继承C的定义，再继承B的定义

- 可以继承Entity模板，即带范型参数的Entity定义

```xeml
// A closureTable
entity closureTable(IdType)
  with
    autoId
  
  has
    ancestorId : IdType
    descendantId : IdType
    depth : integer

  index
    [ ancestorId, descendantId ] is unique

entity documentTable extends closureTable(bigint)
  associations
    refers to document on ancestorId
    refers to document on descendantId
```

以上例子中，定义了一个邻接表Entity模板`closureTable`，然后`documentTable`继承了这个邻接表模板。

## 特性

特性会赋予Entity一些特殊功能，并添加特性所需的字段。

特性在数据库访问层会被特殊对待，例如如果具有`autoId`特性，数据在插入数据库后，会立即返回自动生成的id为`insertId`。

- 语法 

```
with 
    <特性名称>["(" [ <可选参数> ]  ")"]
    ...
```

- 例子

```
with
  autoId
  createTimestamp
  updateTimestamp
  changeLog
```

- 带参数的例子

```
with
  autoId({ type: 'bigint' })

with
  autoId({ type: 'uuid' })
```

- 目前已实现的特性
  - atLeastOneNotNull
  - autoId
  - createTimestamp
  - i18n
  - logicalDeletion
  - stateTracking
  - updateTimestamp

## 字段定义

### 基本字段类型

- array
- binary, blob, buffer
- boolean, bool
- datetime, timestamp
- integer, int
- bigint
- number, float, decimal
- object, json
- string, text

以上同一行的为同义词，通过在基本字段后添加限定词可以衍生出其他类型。

### 字段限定词

- 通用
    - code: 未作实现，预留用作数据库中的字段名称，目前默认用模型定义的名称
    - optional
    - default
    - auto
    - readOnly
    - writeOnce
    - plain
    - forceUpdate
    - freezeAfterNonDefault
    - `-- "注释"`: 目前需要加双引号或单引号，用作数据库中的字段注释，如果只是在定义中注释，可以用 `// 注释`
    - displayName
    - constraintOnUpdate
    - constraintOnDelete

- 类型专用

参考以下定义，待整理。

```
Types.array.qualifiers = commonQualifiers.concat(['csv', 'delimiter', 'element'], ['fixedLength', 'vector']);
Types.bigint.qualifiers = commonQualifiers.concat(['enum'], ['unsigned']);
Types.binary.qualifiers = commonQualifiers.concat(['encoding'], ['fixedLength', 'maxLength']);
Types.boolean.qualifiers = commonQualifiers.concat([]);
Types.datetime.qualifiers = commonQualifiers.concat(['enum', 'format'], ['range']);
Types.integer.qualifiers = commonQualifiers.concat(['enum'], ['bytes', 'digits', 'unsigned']);
Types.number.qualifiers = commonQualifiers.concat(
    ['enum'],
    ['exact', 'totalDigits', 'decimalDigits', 'bytes', 'double']
);
Types.object.qualifiers = commonQualifiers.concat(['schema', 'valueSchema', 'keepUnsanitized'], ['jsonb']);
Types.text.qualifiers = commonQualifiers.concat(['emptyAsNull', 'enum', 'noTrim'], ['fixedLength', 'maxLength']);

```

### 修饰器

- 验证器
  - 语法："|~"<名称>["(" [ <可选参数表> ] ")"]
- 处理器
  - 语法："|>"<名称>["(" [ <可选参数表> ] ")"]
- 生成器
  - 语法："|="<名称>["(" [ <可选参数表> ] ")"]
  
内置的修饰器列表  
```
Activators:
  default
  defaultAs
  random
  now
  isEqual
  isNotEqual
  setValueWhen
  concat
  sum
  multiply
  uuid
  timeOfValueSet
  fetch_

Processors:
  jsx
  trimLines
  stripLines
  grepLines
  quote
  unquote
  fromCsv
  padLeft
  padRight
  toBase64
  fromBase64
  pascalCase
  camelCase
  kebabCase
  snakeCase
  toLower
  toUpper
  replaceAll
  typeOf
  type
  normalizePhone

Validators:
  jsv
  alpha
  alphanumeric
  ascii
  base64
  bytesInRange
  dataURI
  date
  decimal
  email
  domain
  hex
  hexColor
  ip
  inRange
  lowercase
  macAddress
  mimeType
  mobilePhone
  numeric
  strongPassword
  time
  uppercase
  url
  uuid
  alphanum
  mobile
  num
  mime
  number
  max
  min
  length
  maxLength
  minLength
  exist
  required
```  

- 范例
```
password : text maxLength(200) |~strongPassword |>hashPassword(@latest.passwordSalt) -- "User password"

passwordSalt : text fixedLength(16) readOnly |=random -- "User password salt"  
```

以上例子中
- `passwordSalt`是只读字段，它的值由`random`生成器生成固定长度为16的随机字符串作为密码哈希的干扰码。
- `password`字段会检测输入是否满足`strongPassword`要求，默认是最小8个字符，需要包含至少一个大小写、数字和特殊字，符合要求后会与最新的`passwordSalt`进行哈希，处理器`hashPassword`并非内置的处理器，`xeml命令行`会在models目录中生成一个处理器的模板文件，供开发人员填入具体的哈希代码。

## 关系定义 

### 单向引用(refers to)

- 语法

```
形式1:
<refersTo|refers to> <被引用的Entity> [with <条件表达式>] [ [as <添加到当前entity的字段> ] [optional] [default(<默认值>)] [...修饰器] | [ on <当前entity的字段> ] ]

形式2:
<refersTo|refers to> <被引用的Entity的字段> of <被引用的Entity> [with <条件表达式>] [ [as <添加到当前entity的字段> ] [optional] [default(<默认值>)] [...修饰器] | [ on <当前entity的字段> ] ]
```

以上定义中
  - 形式1默认引用对方Entity的主键。
  - 形式2中的**被引用的Entity的字段**会检测是否unqiue
  - `with`字句语法参考后续**条件表达式**的描述
  - 如`as`描述未声明，则默认本地字段为**被引用的Entity的名称**
  - `on`和`as`的区别，是`on`使用字段定义中已存在的字段，而`as`会添加一个新字段到字段定义中。
  - 因`as`字句定义的是要添加到字段定义中的字段，后续可以加上`限定词`和`修饰器`。
  - `on`子句在`v0.2.0`中未实现。

- 实例

```xeml
associations  
  refersTo locale optional default('zh-HK') -- '用户注册信息本地化设置' // 并非用户偏好的本地化设置，而是用户信息的本地化设置    
```

### 一对多(hasMany + belongsTo)

- 语法

```
一的一方：
<belongsTo|belongs to> <被引用的Entity> [with <条件表达式>] [ [as <添加到当前entity的字段> ] [optional] [default(<默认值>)] [...修饰器] | [ on <当前entity的字段> ] ]

多的一方形式1：
<hasMany|has many> <被引用的Entity> [being <对方的字段>]
```

hasMany的一方不会在Entity中添加任何字段。

### 一对一(hasOne + belongsTo)

- 语法

```
一的一方：
<belongsTo|belongs to> <被引用的Entity> [with <条件表达式>] [ [as <添加到当前entity的字段> ] [optional] [default(<默认值>)] [...修饰器] | [ on <当前entity的字段> ] ]

多的一方形式1：
<hasOne|has one> <被引用的Entity> [being <对方的字段>]
```

hasOne的一方不会在Entity中添加任何字段。

### 多对多(hasMany + hasMany)

多对多有两种定义形式，一种是手动定义中间关系表，这种可以视为双方都与关系表建立**一对多关系**，参见以上一对多的描述，另一种是由`xeml命令行`自动生成关系表，以下为这种方式的描述。

双方都用hasMany。

## 主键(key)

默认为第一个字段，或特性中描述的字段，如`autoId`，也可通过`key <字段名称>`指定。

## 索引(index)

非外键索引，外键在关系定义中已自动添加。

- 语法

```
index
  <字段> [is unique]
  "[" <字段数组> "]" [is unique]
```

## 初始化数据

- 语法

```
data [<可选的数据集名称>] [in <对应环境>] [
    { ...键值列表 }
]
```

- 范例

```
data [
    { code: 'PUB', name: 'Public', desc: 'All user can see' },
    { code: 'CNT', name: 'Contact', desc: 'Only your contacts can see' },
    { code: 'PRI', name: 'Private', desc: 'Only yourself can see' }
]  

data "test" in "deveopment" [
    { code: 'PUB', name: 'Public', desc: 'All user can see' },
    { code: 'CNT', name: 'Contact', desc: 'Only your contacts can see' },
    { code: 'PRI', name: 'Private', desc: 'Only yourself can see' }
]  

```    

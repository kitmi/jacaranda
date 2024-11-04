# @kitmi/feat-pipeline

## Jacaranda Framework Pipeline Features

`@kitmi/feat-pipeline`

## Features

## Installation

To install `@kitmi/feat-pipeline`, run the following command:

```bash
bun add @kitmi/feat-pipeline
```

Or if you're using npm:

```bash
npm install @kitmi/feat-pipeline
```

## Sample

```yaml
pre:
    define:
        hashAlgorithm: 'sha256'

    pathResolve:
        path: '$input.localPath'
        base: '$app.workingPath'

    fileInfo: # get file info, e.g. size, mime, etc.
        file: 'pathResolve'

    hashFile:
        algorithm: 'define.hashAlgorithm'
        file: 'pathResolve'

    transform: # transform the input value with type cast and modifiers (validator/processor/activator)
        input: '$input.ref'
        type: 'string'
        post:
            - '|pascalCase'
            - '|toLower'

    dbExistUnique: # check if the record exists in the database
        service: 'prisma'
        model: '$env.modelName'
        where:
            ref: '$input.ref'
            checksum: 'hashFile'

    formatObjectKey: # format the object key with string template
        task: format
        template: '${$input.remotePath}/${transform}${fileInfo.extName}'

    uploadCloud:
        when:
            dbExistUnique: false
        file: 'pathResolve'
        objectKey: 'formatObjectKey'
        contentType: 'fileInfo.mime'
        service: 'cloudStorage.aws'
        payload:
            publicRead: true

    copy: # copy from input to data
        input: $input
        filter: # filter out the following keys
            - localPath
            - remotePath

    setUrl:
        when:
            dbExistUnique: false
        task: fill
        data:
            url: 'uploadCloud.url'

    fill:
        data:
            name: 'fileInfo.fileName'
            fileSize: 'fileInfo.size'
            mimeType: 'fileInfo.mime'
            storedName: 'formatObjectKey'
            checksum: 'hashFile'
```

## Task Development

Task interface

```

```

## License

-   MIT
-   Copyright (c) 2023 KITMI PTY LTD

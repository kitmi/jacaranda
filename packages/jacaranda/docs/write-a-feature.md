# Feature Develop Guideline

```js
export default {
    stage: 'Services', // 5 stages: Config, Initial, Services, Plugins, Final

    groupable: true, // optinonal, true or false, whether it can be grouped by serviceGroup, usually means multiple instances of this services are allowed 

    packages: [], // required packages to be installed bofore starting the server

    depends: [], // other features as dependencies

    load_: async function (app, options, name) {} // feature loader, usually register the service instance under the given name (when grouped will be suffixed with instance id)
};
```


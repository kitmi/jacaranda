# @kitmi/jacaranda

## 3.8.1

### Patch Changes

-   Fixed error logging bug when error is a plain text.

## 3.8.0

### Minor Changes

-   Refined business logic calling.
-   Fixed bugs.

## 3.7.8

### Patch Changes

-   Fixed businessLogic creation bug.

## 3.7.7

### Patch Changes

-   Added business class default behavior

## 3.7.6

### Patch Changes

-   Added log while failing to load config
-   Added log when env feature is triggering config reload

## 3.7.5

### Patch Changes

-   Made system env over config values
  
## 3.7.4

### Patch Changes

-   Fixed businessLogic feature cross-app reference
-   Fixed apiWrapper error handling to hide db error in the API result

## 3.7.3

### Patch Changes

-   Fixed app module depends bug

## 3.7.2

### Patch Changes

-   Updated dependencies

## 3.7.1

### Patch Changes

-   Fixed fastServe and http Get decorator bug.

## 3.7.0

### Minor Changes

-   Added fastServe helper function.
-   Refined businessLogic feature for request tracking.
-   Added BusinessLogic base class.
-   Fixed logging bug.

## 3.6.0

### Minor Changes

-   Added logWithAppName option.
-   Added requestId middleware.

## 3.5.0

### Minor Changes

-   Add MQ worker starter
-   Refine cron worker starter

## 3.4.6

### Patch Changes

-   Fix commandLine feature bug

## 3.4.5

### Patch Changes

-   Fix jacaranda router nested path

## 3.4.4

### Patch Changes

-   Refined router behavior.

## 3.4.3

### Patch Changes

-   Minor adjustments

## 3.4.2

### Patch Changes

-   Add graceful stop when worker throws exception

## 3.4.1

### Patch Changes

-   Add middlewares connect helper

## 3.4.0

### Minor Changes

-   Move out some built-in features to separate package
-   Move businessLogic from webFeatures into features

## 3.3.4

### Patch Changes

-   Move i18n from general features to app features
-   Add i18n fallback from app module to the hosting app
-   Add schedulerWorker
-   Bug fixes

## 3.3.3

### Patch Changes

-   Add DeferredService to delay the creation of service

## 3.3.2

### Patch Changes

-   Fix passport feature bug

## 3.3.1

### Patch Changes

-   Minor bug fix

## 3.3.0

### Minor Changes

-   Add universal module loading procedures
-   Add middlewares multiple sources loading
-   Add router test cases
-   Bugs fix.

## 3.2.3

### Patch Changes

-   Fix: env feature does not refresh the runtime env variables in the same app when loading config.

## 3.2.2

### Patch Changes

-   Fix: cjs build.

## 3.2.1

### Patch Changes

-   Fix: env variables does not take effect in the same app.

## 3.2.0

### Minor Changes

-   Add businessLogic feature.

## 3.1.3

### Patch Changes

-   Minor bugs fix

## 3.1.2

### Patch Changes

-   Refine module loading source

## 3.1.1

### Patch Changes

-   Complete postgres ORM feature.
    -   @kitmi/adapters@1.1.2

## 3.1.0

### Minor Changes

-   40a3a30: cmd runner, logger, data access model bugs fix and xeml cli bugs fix

### Patch Changes

-   Updated dependencies [40a3a30]
    -   @kitmi/validators@1.3.0
    -   @kitmi/sys@1.3.0
    -   @kitmi/adapters@1.1.2

## 3.0.1

### Patch Changes

-   Updated dependencies
    -   @kitmi/config@1.2.2
    -   @kitmi/adapters@1.1.2

## 3.0.0

### Patch Changes

-   48cb18d: Refactor xeml and data package and minor bug fixing and change on utility libs
-   Updated dependencies [48cb18d]
    -   @kitmi/types@1.3.0
    -   @kitmi/validators@1.2.0
    -   @kitmi/adapters@1.1.2
    -   @kitmi/algo@1.1.1
    -   @kitmi/config@1.2.1
    -   @kitmi/sys@1.2.1
    -   @kitmi/utils@1.2.1

## 2.0.1

### Patch Changes

-   Remove dead code.
-   Updated dependencies
    -   @kitmi/adapters@1.1.1

## 2.0.0

### Minor Changes

-   Split features from server package into separate packages

### Patch Changes

-   Updated dependencies
    -   @kitmi/adapters@1.1.0
    -   @kitmi/algo@1.1.0
    -   @kitmi/config@1.2.0
    -   @kitmi/sys@1.2.0
    -   @kitmi/types@1.2.0
    -   @kitmi/utils@1.2.0
    -   @kitmi/validators@1.1.0

## 1.0.3

### Patch Changes

-   Change release-all command to pnpm
-   Updated dependencies
    -   @kitmi/algo@1.0.3
    -   @kitmi/adapters@1.0.3
    -   @kitmi/config@1.1.3
    -   @kitmi/types@1.1.3
    -   @kitmi/utils@1.1.3
    -   @kitmi/sys@1.1.3

## 1.0.2

### Patch Changes

-   npm publish does not patch workspace dependencies, change to yarn.
-   Updated dependencies
    -   @kitmi/algo@1.0.2
    -   @kitmi/adapters@1.0.2
    -   @kitmi/config@1.1.2
    -   @kitmi/types@1.1.2
    -   @kitmi/utils@1.1.2
    -   @kitmi/sys@1.1.2

## 1.0.1

### Patch Changes

-   Fix workspace dependencies.
-   Updated dependencies
    -   @kitmi/adapters@1.0.1
    -   @kitmi/algo@1.0.1
    -   @kitmi/config@1.1.1
    -   @kitmi/sys@1.1.1
    -   @kitmi/types@1.1.1
    -   @kitmi/utils@1.1.1

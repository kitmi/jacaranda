## @kitmi/tester

## Unit Test Utility

`@kitmi/tester` is JavaScript unit test utility with api code coverage, async dump for tracking async leak.

## Features

* Support coverage test of @kitmi/jacaranda applicaiton 
* [x] Support allure report
* [x] Support async dump for debugging application hanging issue caused by pending async event
* Support @kitmi/jacaranda worker 
* Support JSON Validation Syntax
* [x] Support configurable test case on/off switches
* Support profiling and benchmark
* Support test step and progress record
* Support job pipeline for long-run test

## Interface

gobal object `gxt`

-   `startWorker_(app => {/* test to run */}, options)`: // start a worker

-   `withHttpClient_(serverName?, [authenticator], app => {/* test to run */}, [options])`: // start a worker and create a http client

-   `benchmark_(mapOfMethods, verifier, payload)`: // run benchmark againest several different implementions of the same purposes

-   `step_(name, fn)`: // test step

-   `param(name, value)`: // record param used in a test into test report

-   `attach(name, value)`: // attach object produced during a test into test report

## License

This project is licensed under the MIT License.

Copyright (c) 2023 KITMI PTY LTD
# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.10.0-alpha.0](https://github.com/typeskill/typeskill/compare/v0.10.0-beta.19...v0.10.0-alpha.0) (2019-10-04)


### ⚠ BREAKING CHANGES

* removed disableMultipleAttributeEdits Typer prop.
Since this behavior has been proven default on iOS, Typeskill will try
to enforce the same one on Android by default. To make the API more
explicit, it has been found best to rename the prop to narrow the scope
to Android.

### Bug Fixes

* add missing hook dependency ([fa84b1c](https://github.com/typeskill/typeskill/commit/fa84b1c))
* wip fix overriding selection iOS ([c6294b9](https://github.com/typeskill/typeskill/commit/c6294b9))


### Features

* add androidDisableMultipleAttributeEdits Typer prop ([c97c21e](https://github.com/typeskill/typeskill/commit/c97c21e))

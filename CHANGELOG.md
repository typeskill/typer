# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.12.0-alpha.0](https://github.com/typeskill/typeskill/compare/v0.11.0-alpha.0...v0.12.0-alpha.0) (2020-02-18)


### Bug Fixes

* **package:** update ramda to version 0.27.0 ([b80ef9a](https://github.com/typeskill/typeskill/commit/b80ef9a))
* unexhaustive hook dependency ([c1ae14d](https://github.com/typeskill/typeskill/commit/c1ae14d))


### Features

* add useDocument and useBridge hooks ([0e96b53](https://github.com/typeskill/typeskill/commit/0e96b53))

## [0.11.0-alpha.0](https://github.com/typeskill/typeskill/compare/v0.10.0-beta.19...v0.11.0-alpha.0) (2019-10-04)


### ⚠ BREAKING CHANGES

* removed `disableMultipleAttributeEdits` Typer prop.
Since this behavior has been proven default on iOS, Typeskill will try
to enforce the same one on Android by default. To make the API more
explicit, it has been found best to rename the prop to narrow the scope
to Android.

### Bug Fixes

* add missing hook dependency ([fa84b1c](https://github.com/typeskill/typeskill/commit/fa84b1c))
* overriding selection iOS doesn't work ([8f38a0b](https://github.com/typeskill/typeskill/commit/8f38a0b))


### Features

* add `androidDisableMultipleAttributeEdits` Typer prop ([348eecb](https://github.com/typeskill/typeskill/commit/348eecb))

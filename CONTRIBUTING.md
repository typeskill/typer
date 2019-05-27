
# Contributing to React Native Typeskill

## Development Process

All work on React Native Typeskill happens directly on GitHub. Contributors send pull requests which go through a review process.

> **Working on your first pull request?** You can learn how from this *free* series: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

1. Fork the repo and create your branch from `master` (a guide on [how to fork a repository](https://help.github.com/articles/fork-a-repo/)).
2. Run `yarn` or `npm install` to install all required dependencies.
3. Now you are ready to make your changes!

## Tests & Verifications

> TO BE COMPLETED

## Sending a pull request

When you're sending a pull request:

* Prefer small pull requests focused on one change.
* Verify that all tests and validations are passing.
* Follow the pull request template when opening a pull request.

## Commit message convention

This project complies with [Conventional Commits](https://www.conventionalcommits.org/en). We prefix our commit messages with one of the following to signify the kind of change:

* **build**: Changes that affect the build system or external dependencies.
* **ci**, **chore**: Changes to our CI configuration files and scripts.
* **docs**: Documentation only changes.
* **feat**: A new feature.
* **fix**: A bug fix.
* **perf**: A code change that improves performance.
* **refactor**: A code change that neither fixes a bug nor adds a feature.
* **style**: Changes that do not affect the meaning of the code.
* **test**: Adding missing tests or correcting existing tests.

## Releasing

Full versions:

```bash
npm run release
```

Prereleases:

```bash
npm run release -- --skip.changelog=true --prerelease alpha
```

## Reporting issues

You can report issues on our [bug tracker](https://github.com/jsamr/react-native-Typeskill/issues). Please search for existing issues and follow the issue template when opening an issue.

## License

By contributing to React Native NetInfo, you agree that your contributions will be licensed under the **MIT** license.

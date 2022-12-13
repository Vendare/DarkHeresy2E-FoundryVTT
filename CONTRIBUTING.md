# Contributing

## Developer Tooling.

This repository leverages [gulp](https://gulpjs.com/) to run automated build tasks. If your system supports `npm`, you can run the following commands from the root of the project to get set up:

### `npm install`

Installs all dependencies needed to run developer tooling scripts.

## Code

Here are some guidelines for contributing code to this project.

To contribute code, [fork this project](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and submit a [pull request (PR)](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request) against the correct development branch.

### Style

Please attempt to follow code style present throughout the project. An ESLint profile is included to help with maintaining a consistent code style. All warnings presented by the linter should be resolved before an PR is submitted.

- `gulp lint` or `npm run lint` - Run the linter and display any issues found.
- `gulp lint --fix` or `npm run lint:fix` - Automatically fix any code style issues that can be fixed.

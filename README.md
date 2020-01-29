# splunk-cloud-auth-js

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This repository contains a set of packages for facilitating authentication with Splunk Cloud written in TypeScript for use in front-end web applications and Node.js server applications.

## Sub-packages

* [cloud-auth-client](/packages/cloud-auth-client) - Front-end web application authentication library
* [cloud-auth-common](/packages/cloud-auth-common) - Common shared components for authenticating with Splunk Cloud Services.
* [cloud-auth-node](/packages/cloud-auth-node) - Node.js server-side application authentication library

## Usage

For an existing project, you can install the sub-packages in the splunk-cloud-auth-js mono-repo through a node package manager ([npm](https://www.npmjs.com/get-npm), [Yarn](https://github.com/yarnpkg/yarn)).

The packages can be found under the `@splunkdev` package scope [here](https://www.npmjs.com/search?q=%40splunkdev).

### Examples

Examples for each library can be found in an `examples` directory at the root level of each sub-package.

## Development

These instructions will get you a copy of the project up and running on your local machine for development of the packages in this repository.

### Prerequisites

* [git](https://git-scm.com/downloads)
* [Node.js](https://nodejs.org/en/download/) - This will install npm as well.
* [Yarn](https://legacy.yarnpkg.com/en/docs/install)

### Script Commands

The following commands are provided at the top-level of this mono-repo. 
 
* `build`: builds all packages
* `clean`: removes all generated files and folders
* `commit`: git commit script that follows [conventional-commits](https://www.conventionalcommits.org/)
* `cover`: runs unit tests with code coverage
* `lint`: runs eslint for static code analysis
* `third-party-licenses`: generates the THIRD-PARTY-CREDITS.md acknowledgement files for each sub-package
* `test`: runs unit tests

## Built With

* [Yarn](https://github.com/yarnpkg/yarn) - Yarn package management
* [Lerna](https://github.com/lerna/lerna/) - JavaScript multi-package repository management
* [TypeScript](https://github.com/microsoft/TypeScript) - TypeScript language
* [Mocha](https://github.com/mochajs/mocha) - Mocha test framework
* [Istanbul](https://github.com/istanbuljs/nyc) - Istanbul code coverage

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

See [CODEOWNERS](https://github.com/splunk/js-cloud-auth/blob/master/CODEOWNERS).

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE.txt](LICENSE.txt) file for details.

## Acknowledgments

Each sub-package within this repo contains a `THIRD-PARTY-CREDITS.md` file which acknowledges the contributors of all libraries which have been used in the development of this project.

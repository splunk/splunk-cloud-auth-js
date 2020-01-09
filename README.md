# splunk-cloud-auth-js

This repository contains packages for facilitating authentication with Splunk Cloud.

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You can install the sub-packages in the splunk-cloud-auth-js mono-repo through a node package manager ([npm](https://www.npmjs.com/get-npm), [Yarn](https://github.com/yarnpkg/yarn)).

### Installing

You can install the packages in the splunk-cloud-auth-js mono-repo through a node package manager ([npm](https://www.npmjs.com/get-npm), [Yarn](https://github.com/yarnpkg/yarn)).

The packages can be found under the `@splunkdev` package scope [here](https://www.npmjs.com/search?q=%40splunkdev).

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

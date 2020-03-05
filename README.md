# Splunk Cloud Services Auth Components

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

This repository contains a set of packages that you can use to authenticate users with Splunk Cloud Services. These packages are written in TypeScript for use in front-end web applications and Node.js server applications.

## Packages

This monorepo contains the following packages.

| Package                                                  | Description               |
|:-------------------------------------------------------- |:------------------------- |
| [@splunk/cloud-auth-common](/packages/cloud-auth-common) | Library of common shared components for authenticating with Splunk Cloud Services. |
| [@splunk/cloud-auth-client](/packages/cloud-auth-client) | Authentication library for front-end web applications. |
| [@splunk/cloud-auth-node](/packages/cloud-auth-node)     | Authentication library for Node.js server-side applications. |


## Get started

Follow the instructions below to install and run the Auth packages in your local development environment.

### Prerequisites

Install the following tools before using the Auth packages:

* [Git](https://git-scm.com/downloads)
* [Node.js](https://nodejs.org/en/download/) (includes [npm](https://www.npmjs.com/get-npm))
* [Yarn](https://legacy.yarnpkg.com/en/docs/install)

### Installation

The Auth packages are available in the [`@splunkdev`](https://www.npmjs.com/search?q=%40splunkdev) package scope. 

To install these packages into your project, use a node package manager such as npm or Yarn. For example:

```
npm install @splunk/cloud-auth-common @splunk/cloud-auth-client @splunk/cloud-auth-node 
```

### Development Commands

Use the following npm script commands at the top level of the repository directory while developing.

| Command                | Description                              |
|:---------------------- |:---------------------------------------- |
| `build`                | Build all packages.                      |
| `clean`                | Remove all generated files and folders.  |
| `commit`               | Run a git commit script that follows [Conventional Commits](https://www.conventionalcommits.org/). |
| `cover`                | Run unit tests with code coverage.       |
| `lint`                 | Run `eslint` for static code analysis.   |
| `third-party-licenses` | Generate the THIRD-PARTY-CREDITS.md acknowledgement files for each package. |
| `test`                 | Run unit tests.                          |

### Examples

For examples showing how to use the Auth packages, see the `examples` directory at the root level of each package directory. 

## Built with

| Product                                       | Purpose                       |
|:--------------------------------------------- |:----------------------------- |
| [Yarn](https://github.com/yarnpkg/yarn)       | Yarn package management       |
| [Lerna](https://github.com/lerna/lerna/)      | JavaScript multi-package repository management |
| [TypeScript](https://github.com/microsoft/TypeScript) | TypeScript language   |
| [Mocha](https://github.com/mochajs/mocha)     | Mocha test framework          |
| [Istanbul](https://github.com/istanbuljs/nyc) | Istanbul code coverage        |
| [SemVer](http://semver.org/)                  | Versioning                    |

## See also

| File                               | Description                             |
|:---------------------------------- |:--------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Guidelines for contributing to this project. |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Authors of this project.                |
| [LICENSE.txt](LICENSE.txt)         | Apache 2.0 License for this project.    |
| THIRD-PARTY-CREDITS.md             | Acknowledgements of the contributors of the libraries that have been used in the development of this project. Each package directory contains this file. |

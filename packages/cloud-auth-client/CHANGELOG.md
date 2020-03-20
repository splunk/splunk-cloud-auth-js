# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.0.1](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0...@splunkdev/cloud-auth-client@1.0.1) (2020-03-20)

**Note:** Version bump only for package @splunkdev/cloud-auth-client





# [1.0.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-beta.3...@splunkdev/cloud-auth-client@1.0.0) (2020-03-17)


### Features

* using root level yarn.lock when generating third-party-licenses.md ([1c0404b](https://github.com/splunk/splunk-cloud-auth-js/commit/1c0404b791bc1e0a39917389a2d5023e06ff2409))





# [1.0.0-beta.3](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-beta.2...@splunkdev/cloud-auth-client@1.0.0-beta.3) (2020-03-13)


### Features

* **cloud-auth-client:** configurable storage key names for token and redirect params ([273e6de](https://github.com/splunk/splunk-cloud-auth-js/commit/273e6dede512137f2de5ebe6cabb4312819ddbde))
* **cloud-auth-client:** retaining hash and search params that are not related to auth ([b5094df](https://github.com/splunk/splunk-cloud-auth-js/commit/b5094df2b5c90eea054bfb82521885e2e332e74c))





# [1.0.0-beta.2](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-beta.1...@splunkdev/cloud-auth-client@1.0.0-beta.2) (2020-03-06)


### Bug Fixes

* **cloud-auth-client:** fix react example ([5c71b13](https://github.com/splunk/splunk-cloud-auth-js/commit/5c71b139be977a42d67816d8cbaa3c296e3850d5))


### Features

* yarn.lock cleanup ([34711ef](https://github.com/splunk/splunk-cloud-auth-js/commit/34711efcca95a9db49fa912787902a9bbf902ffc))





# [1.0.0-beta.1](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.10...@splunkdev/cloud-auth-client@1.0.0-beta.1) (2020-03-05)


### Features

* enabling explicit version release in release.sh ([4ef88f8](https://github.com/splunk/splunk-cloud-auth-js/commit/4ef88f8e5660c52bb0793b48ccf211fc4e80ef6f))


### BREAKING CHANGES

* **cloud-auth-client:** remove authenticate, parseTokenFromRedirect, rename login method in splunkauthclient, auth flow via getAccessTokenContext ([3f7b333](https://github.com/splunk/splunk-cloud-auth-js/commit/3f7b333b2457b1d85310d83ead3944a00c947275))





# [1.0.0-alpha.10](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.9...@splunkdev/cloud-auth-client@1.0.0-alpha.10) (2020-02-24)


### Features

* moving cloud-auth-common to runtime dependencies ([dfff958](https://github.com/splunk/splunk-cloud-auth-js/commits/dfff95866392501f048237f421643f2a8520732c))





# [1.0.0-alpha.9](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.8...@splunkdev/cloud-auth-client@1.0.0-alpha.9) (2020-02-15)


### Features

* publishConfig.access set to true ([363182d](https://github.com/splunk/splunk-cloud-auth-js/commits/363182dfba20aa441cb93076657f1596c3eaacec))





# [1.0.0-alpha.8](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.7...@splunkdev/cloud-auth-client@1.0.0-alpha.8) (2020-02-15)

**Note:** Version bump only for package @splunkdev/cloud-auth-client





# [1.0.0-alpha.7](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.5...@splunkdev/cloud-auth-client@1.0.0-alpha.7) (2020-02-15)


### Features

* **cloud-auth-client:** push docs to artifactory ([2e8e102](https://github.com/splunk/splunk-cloud-auth-js/commits/2e8e1020cf47079d1e8a5ea0c90bb0d6e68dfd12))





# [1.0.0-alpha.6](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.5...@splunkdev/cloud-auth-client@1.0.0-alpha.6) (2020-02-14)


### Features

* **cloud-auth-client:** push docs to artifactory ([2e8e102](https://github.com/splunk/splunk-cloud-auth-js/commits/2e8e1020cf47079d1e8a5ea0c90bb0d6e68dfd12))





# [1.0.0-alpha.5](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.4...@splunkdev/cloud-auth-client@1.0.0-alpha.5) (2020-02-14)

**Note:** Version bump only for package @splunkdev/cloud-auth-client





# [1.0.0-alpha.4](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.3...@splunkdev/cloud-auth-client@1.0.0-alpha.4) (2020-02-13)


### Bug Fixes

* downgrade eslint-plugin, eslint/parser to 2.19.0 ([a368ce3](https://github.com/splunk/splunk-cloud-auth-js/commits/a368ce3ed4c8b2db97118832c477a3a4a7832b73))
* fix sonarqube code coverage via post-test run file path replace in lcov.info ([179018c](https://github.com/splunk/splunk-cloud-auth-js/commits/179018ca0d2c01bddd167de22f72e524a05a7e91))


### Features

* **cloud-auth-client:** abstract authmanager construction away from authclient using the AuthManage ([4b3a82d](https://github.com/splunk/splunk-cloud-auth-js/commits/4b3a82d0c9fe017ed8066f9f0e20eb4f9fa5f8a0))
* **cloud-auth-client:** implement AuthManager interface from SDK on the SplunkAuthClient ([b818fca](https://github.com/splunk/splunk-cloud-auth-js/commits/b818fcad4a814e4380b7467452ea50eb800f15e5))
* **cloud-auth-client:** pKCE auth flow implementation ([14b443c](https://github.com/splunk/splunk-cloud-auth-js/commits/14b443ca178bc185e8504f69e5747dd6c55d3946))
* **cloud-auth-client:** updating react example dependencies ([dff6320](https://github.com/splunk/splunk-cloud-auth-js/commits/dff6320be56a77e2048b9a55c5477de8f80ec5fe))





# [1.0.0-alpha.3](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.2...@splunkdev/cloud-auth-client@1.0.0-alpha.3) (2020-02-08)


### Bug Fixes

* **cloud-auth-client:** consistent error.code property as string, public func declarations ([07c01fb](https://github.com/splunk/splunk-cloud-auth-js/commits/07c01fbdfa9c268f20bef6e674aea3804f4588cb))
* **cloud-auth-client:** fix sonarqube code coverage by downgrading jest deps to v24.*.* ([326d339](https://github.com/splunk/splunk-cloud-auth-js/commits/326d339180cbc4ee087d8b7727541045d7672baf))
* **cloud-auth-client:** resolve type checking issues identified by tsc ([e4046c4](https://github.com/splunk/splunk-cloud-auth-js/commits/e4046c4205c87eeb3210ee928ea0312375d7dce5))


### Features

* common version.js generation ([a0b7132](https://github.com/splunk/splunk-cloud-auth-js/commits/a0b7132c1ef5fa02d852195d1476c03dea8eb92e))
* **cloud-auth-client:** convert client tests to javascript ([218ea41](https://github.com/splunk/splunk-cloud-auth-js/commits/218ea41cdc51e8c2a6a8c483c2c0a1a2c251d75a))
* **cloud-auth-client:** remove AuthClient-TokenManager circular reference ([b5a23a4](https://github.com/splunk/splunk-cloud-auth-js/commits/b5a23a4ec0154a62447f33ac162b646cfeef2c5b))
* **cloud-auth-client:** remove token.ts, q promises, refactored client ([f0112b5](https://github.com/splunk/splunk-cloud-auth-js/commits/f0112b58fec0dd5101828aee27893c413d785ff5))
* **cloud-auth-client:** removing issuer input parameter to AuthClient ([e1f1203](https://github.com/splunk/splunk-cloud-auth-js/commits/e1f12030cd2a317995e73b07edac10a1238affa9))
* **cloud-auth-client:** replace TokenManager's underlying StorageManager ([eac2c52](https://github.com/splunk/splunk-cloud-auth-js/commits/eac2c52bfeabee3a17ebd033724ff23731d5459e))
* **cloud-auth-client:** restructure source and transpiled code ([ae49e85](https://github.com/splunk/splunk-cloud-auth-js/commits/ae49e85d4b7db3394b9570442a48dc83575ace6c))
* **cloud-auth-client:** streamline StorageFactory & StorageManager for sessionStorage and cookie storage ([1b9a886](https://github.com/splunk/splunk-cloud-auth-js/commits/1b9a8860405a77bcbcf4a499d30545c829847921))
* **cloud-auth-client:** strongly typed AuthClientSettings for AuthClient ([added69](https://github.com/splunk/splunk-cloud-auth-js/commits/added6973e2d95297de32d0cfd716af9da45458a))
* **cloud-auth-client:** typescript conversion with babel ([9ec4737](https://github.com/splunk/splunk-cloud-auth-js/commits/9ec47374028295c3cc2f870f2606f3bba955e3a3))
* **cloud-auth-client:** utilize revamped StorageManager ([058558e](https://github.com/splunk/splunk-cloud-auth-js/commits/058558e1408d207e928ee6e02ab9c3edcdf310ca))





# [1.0.0-alpha.2](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-client@1.0.0-alpha.1...@splunkdev/cloud-auth-client@1.0.0-alpha.2) (2020-01-11)


### Features

* **cloud-auth-client:** babel, eslint, jest, mocha, sinon upgrade ([1130d4d](https://github.com/splunk/splunk-cloud-auth-js/commits/1130d4de78c7fb4b217cb184ee77625fe3e6db0c))





# 1.0.0-alpha.1 (2020-01-09)

**Note:** Version bump only for package @splunkdev/cloud-auth-client

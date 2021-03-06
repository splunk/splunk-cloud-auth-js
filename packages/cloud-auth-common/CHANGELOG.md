# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.3.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@2.2.0...@splunkdev/cloud-auth-common@2.3.0) (2021-05-18)


### Features

* upgrade isomorphic-fetch package ([d9e0824](https://github.com/splunk/splunk-cloud-auth-js/commit/d9e08248903f962b9d059136cf0e54f27ca815f2))





# [2.2.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@2.1.0...@splunkdev/cloud-auth-common@2.2.0) (2021-02-04)


### Features

* Introduce `inviteTenant` parameter & pass `state` param to get token call ([e610552](https://github.com/splunk/splunk-cloud-auth-js/commit/e6105523a98c5e5c1b6e027ef657bb87dbd2999e))





# [2.1.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@2.0.0...@splunkdev/cloud-auth-common@2.1.0) (2020-10-20)


### Features

* **cloud-auth-common:** send cookies on token endpoint for input free SSO ([1115391](https://github.com/splunk/splunk-cloud-auth-js/commit/1115391f34c0fccf07ff1421a8ee31a130348e20))





# [2.0.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.1.0...@splunkdev/cloud-auth-common@2.0.0) (2020-10-12)

### BREAKING CHANGES

* **cloud-auth-common:** Introduce tenant parameter to token requests in auth-proxy to retrieve tenant-scoped access token. ([d75ebcb0](https://github.com/splunk/splunk-cloud-auth-js/commit/d75ebcb056e7d323d9a841c15a086cc0f5a82c30))





# [1.1.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.2...@splunkdev/cloud-auth-common@1.1.0) (2020-06-08)


### Features

* **cloud-auth-client:** store code_challenge and support accept_tos flag to support tos for pkce flow ([8b277c5](https://github.com/splunk/splunk-cloud-auth-js/commit/8b277c531f956d7b9a353d63cc110d092f02fc00))





## [1.0.2](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.1...@splunkdev/cloud-auth-common@1.0.2) (2020-04-02)

**Note:** Version bump only for package @splunkdev/cloud-auth-common





## [1.0.1](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0...@splunkdev/cloud-auth-common@1.0.1) (2020-03-20)

**Note:** Version bump only for package @splunkdev/cloud-auth-common





# [1.0.0](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-beta.3...@splunkdev/cloud-auth-common@1.0.0) (2020-03-17)


### Features

* using root level yarn.lock when generating third-party-licenses.md ([1c0404b](https://github.com/splunk/splunk-cloud-auth-js/commit/1c0404b791bc1e0a39917389a2d5023e06ff2409))





# [1.0.0-beta.3](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-beta.2...@splunkdev/cloud-auth-common@1.0.0-beta.3) (2020-03-13)


### Features

* **cloud-auth-client:** configurable storage key names for token and redirect params ([273e6de](https://github.com/splunk/splunk-cloud-auth-js/commit/273e6dede512137f2de5ebe6cabb4312819ddbde))





# [1.0.0-beta.2](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-beta.1...@splunkdev/cloud-auth-common@1.0.0-beta.2) (2020-03-06)

**Note:** Version bump only for package @splunkdev/cloud-auth-common





# [1.0.0-beta.1](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.7...@splunkdev/cloud-auth-common@1.0.0-beta.1) (2020-03-05)


### Bug Fixes

* update codecov to 3.6.5+ ([ce2cfe5](https://github.com/splunk/splunk-cloud-auth-js/commit/ce2cfe583d0d8df565beb8386d5ab8da87f7cf2a))





# [1.0.0-alpha.7](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.6...@splunkdev/cloud-auth-common@1.0.0-alpha.7) (2020-02-24)


### Features

* moving cloud-auth-common to runtime dependencies ([dfff958](https://github.com/splunk/splunk-cloud-auth-js/commits/dfff95866392501f048237f421643f2a8520732c))





# [1.0.0-alpha.6](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.5...@splunkdev/cloud-auth-common@1.0.0-alpha.6) (2020-02-15)


### Features

* publishConfig.access set to true ([363182d](https://github.com/splunk/splunk-cloud-auth-js/commits/363182dfba20aa441cb93076657f1596c3eaacec))





# [1.0.0-alpha.5](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.4...@splunkdev/cloud-auth-common@1.0.0-alpha.5) (2020-02-15)

**Note:** Version bump only for package @splunkdev/cloud-auth-common





# [1.0.0-alpha.4](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.3...@splunkdev/cloud-auth-common@1.0.0-alpha.4) (2020-02-13)


### Bug Fixes

* downgrade eslint-plugin, eslint/parser to 2.19.0 ([a368ce3](https://github.com/splunk/splunk-cloud-auth-js/commits/a368ce3ed4c8b2db97118832c477a3a4a7832b73))
* fix sonarqube code coverage via post-test run file path replace in lcov.info ([179018c](https://github.com/splunk/splunk-cloud-auth-js/commits/179018ca0d2c01bddd167de22f72e524a05a7e91))


### Features

* **cloud-auth-client:** abstract authmanager construction away from authclient using the AuthManage ([4b3a82d](https://github.com/splunk/splunk-cloud-auth-js/commits/4b3a82d0c9fe017ed8066f9f0e20eb4f9fa5f8a0))





# [1.0.0-alpha.3](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.2...@splunkdev/cloud-auth-common@1.0.0-alpha.3) (2020-02-08)


### Bug Fixes

* **cloud-auth-client:** fix sonarqube code coverage by downgrading jest deps to v24.*.* ([326d339](https://github.com/splunk/splunk-cloud-auth-js/commits/326d339180cbc4ee087d8b7727541045d7672baf))
* **cloud-auth-client:** resolve type checking issues identified by tsc ([e4046c4](https://github.com/splunk/splunk-cloud-auth-js/commits/e4046c4205c87eeb3210ee928ea0312375d7dce5))


### Features

* common version.js generation ([a0b7132](https://github.com/splunk/splunk-cloud-auth-js/commits/a0b7132c1ef5fa02d852195d1476c03dea8eb92e))
* **cloud-auth-client:** convert client tests to javascript ([218ea41](https://github.com/splunk/splunk-cloud-auth-js/commits/218ea41cdc51e8c2a6a8c483c2c0a1a2c251d75a))
* **cloud-auth-client:** remove AuthClient-TokenManager circular reference ([b5a23a4](https://github.com/splunk/splunk-cloud-auth-js/commits/b5a23a4ec0154a62447f33ac162b646cfeef2c5b))
* **cloud-auth-client:** remove token.ts, q promises, refactored client ([f0112b5](https://github.com/splunk/splunk-cloud-auth-js/commits/f0112b58fec0dd5101828aee27893c413d785ff5))
* **cloud-auth-client:** streamline StorageFactory & StorageManager for sessionStorage and cookie storage ([1b9a886](https://github.com/splunk/splunk-cloud-auth-js/commits/1b9a8860405a77bcbcf4a499d30545c829847921))
* **cloud-auth-client:** strongly typed AuthClientSettings for AuthClient ([added69](https://github.com/splunk/splunk-cloud-auth-js/commits/added6973e2d95297de32d0cfd716af9da45458a))
* **cloud-auth-client:** typescript conversion with babel ([9ec4737](https://github.com/splunk/splunk-cloud-auth-js/commits/9ec47374028295c3cc2f870f2606f3bba955e3a3))
* **cloud-auth-common:** read CSRF token from cookie in the response of the /csrfToken call ([5bf79eb](https://github.com/splunk/splunk-cloud-auth-js/commits/5bf79ebbadccde2e84ac261e4dbf77b1115ccc5d))





# [1.0.0-alpha.2](https://github.com/splunk/splunk-cloud-auth-js/compare/@splunkdev/cloud-auth-common@1.0.0-alpha.1...@splunkdev/cloud-auth-common@1.0.0-alpha.2) (2020-01-11)


### Features

* **cloud-auth-client:** babel, eslint, jest, mocha, sinon upgrade ([1130d4d](https://github.com/splunk/splunk-cloud-auth-js/commits/1130d4de78c7fb4b217cb184ee77625fe3e6db0c))





# 1.0.0-alpha.1 (2020-01-09)

**Note:** Version bump only for package @splunkdev/cloud-auth-common

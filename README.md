# tslint-fix
[![Build Status](https://img.shields.io/travis/nojvek/tslint-fix/master.svg)](https://travis-ci.org/nojvek/tslint-fix)
[![Coverage Status](https://img.shields.io/coveralls/nojvek/tslint-fix/master.svg)](https://coveralls.io/github/nojvek/tslint-fix?branch=master)
[![issues open](https://img.shields.io/github/issues/nojvek/tslint-fix.svg)](https://github.com/nojvek/tslint-fix/issues)
[![npm total downloads](https://img.shields.io/npm/dt/tslint-fix.svg?maxAge=2592000)](https://www.npmjs.com/package/tslint-fix)
[![npm version](https://img.shields.io/npm/v/tslint-fix.svg)](https://www.npmjs.com/package/tslint-fix)
tslint-fix takes output of tslint and fixes the errors. It does so by regex matching the errors for file, line, column, error and fixing simple formatting related errors.

## Usage
`tslint -c tslint.json src/**/*.ts | tslint-fix`

```
tslint-fix -h
  --dryrun, -d   Only show what lines will be changed, does not edit the source files
  --help, -h     Shows this help
```

##TODO
 * Publish as npm module that can be installed globally
 * Remove coffeescript dependency and have pure js
 * List classes of errors fixed
 * Add travis build
 * Add tests for 100% test coverage.







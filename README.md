# tslint-fix

## Usage
`tslint -c tslint.json src/**/*.ts > tslintout.txt`
`tslint-fix tslintout.txt`

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







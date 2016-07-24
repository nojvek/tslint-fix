# tslint-fix

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



  
  
  

#!/usr/bin/env node

/* tslint-fix parses the output of tslint and automatically fixes the issues */

const fs = require('fs');
const os = require('os');
const c = console;

const help = function() {
  c.log("> tslint -c tslint.json **/*.ts > tslintout.txt");
  c.log("Then run the fixer");
  c.log("> tslint-fix tslintout.txt");
  return process.exit(0);
};

const fixSingleLineIssue = function(line, issue, colNum, tslintLine) {
  var _, char, endIndex, findStr, indent, matches, replaceStr;

  if (line === undefined) {
    c.error("UNDEFINED LINE", tslintLine);
    process.exit(1);
  }

  if (issue === "trailing whitespace") {
    line = line.replace(/\s+$/, "");
  }

  else if (issue === "space indentation expected") {
    indent = line.match(/^\s+/)[0].replace(/\t/g, "    ");
    line = line.replace(/^\s+/, indent);
  }

  else if (issue === "trailing comma") {
    if (line[colNum] === ",") {
      line = line.substr(0, colNum) + line.substr(colNum + 1);
    }
  }

  else if (issue === "unnecessary semicolon") {
    if (line[colNum] === ";") {
      line = line.substr(0, colNum) + line.substr(colNum + 1);
    }
  }

  else if (issue === "comment must start with a space") {
    if (line.substr(colNum - 2, 2) === "//") {
      line = line.substr(0, colNum) + " " + line.substr(colNum);
    }
  }

  else if ((matches = issue.match(/^missing (semicolon|whitespace)$/))) {
    char = {
      semicolon: ";",
      whitespace: " "
    }[matches[1]];
    line = line.substr(0, colNum) + char + line.substr(colNum);
  }

  else if ((matches = issue.match(/^expected nospace (in|before) /))) {
    if (line[colNum] === " ") {
      line = line.substr(0, colNum) + line.substr(colNum + 1);
    }
  }

  else if ((matches = issue.match(/^(==|!=) should be (===|!==)$/))) {
    _ = matches[0], findStr = matches[1], replaceStr = matches[2];
    if (line.substr(colNum, findStr.length) === findStr) {
      line = line.substr(0, colNum) + replaceStr + line.substr(colNum + findStr.length);
    }
  }

  else if ((matches = issue.match(/^('|") should be ('|")$/))) {
    _ = matches[0], findStr = matches[1], replaceStr = matches[2];
    if (line[colNum] === findStr) {
      endIndex = line.indexOf(findStr, colNum + 1);
      line = line.substr(0, colNum) + replaceStr + line.substr(colNum + 1);
      line = line.substr(0, endIndex) + replaceStr + line.substr(endIndex + 1);
    }
  } else {
    c.log("Ignoring: " + tslintLine + ", " + issue);
  }

  return line;
};

const fixMultiLineIssue = function(fileLines, issue, lineNum, tslintLine) {
  if (issue.match(/^consecutive blank lines are (disallowed|forbidden)/)) {
    let endLineNum = lineNum;

    while (endLineNum < fileLines.length && fileLines[endLineNum].match(/^\s*$/)) {
      endLineNum += 1;
    }

    if ((endLineNum - lineNum) >= 1) {
      c.log("\n", tslintLine);
      c.log(fileLines.slice(lineNum - 2, endLineNum + 1).join("\n"));
      fileLines.splice(lineNum, endLineNum - lineNum);
      c.log("\t\t\t^^^ Before ^^^ | vvv After vvv");
      c.log(fileLines.slice(lineNum - 2, lineNum + 1).join("\n"));
    }
  }

  return fileLines;
};

const processTslintOutput = function(tslintOutFile) {
  var _, colNum, contents, fileEdited, fileLines, filePath, i, issue, issueLines, issueMap, issues, j, k, len, len1, len2, lineAfter, lineBefore, lineEdited, lineNum, lineNums, matches, numLinesBefore, results, tslintLine, tslintLines;
  issueMap = {};
  tslintLines = fs.readFileSync(tslintOutFile, "utf-8").trim().split("\n");

  for (i = 0, len = tslintLines.length; i < len; i++) {
    tslintLine = tslintLines[i];
    matches = tslintLine.match(/([\\\/\w\.\-]+\.ts)\[(\d+), (\d+)\]: (.*)/);

    if (!matches) {
      console.error("Unrecognized line: " + tslintLine);
      continue;
    }

    _ = matches[0], filePath = matches[1], lineNum = matches[2], colNum = matches[3], issue = matches[4];
    lineNum = parseInt(lineNum) - 1;
    colNum = parseInt(colNum) - 1;
    issue = issue.toLowerCase();

    if (!issueMap[filePath]) {
      issueMap[filePath] = {};
    }

    if (!issueMap[filePath][lineNum]) {
      issueMap[filePath][lineNum] = [];
    }

    issueMap[filePath][lineNum].push({
      colNum: colNum,
      issue: issue,
      tslintLine: tslintLine
    });
  }

  results = [];

  for (filePath in issueMap) {
    issueLines = issueMap[filePath];
    fileEdited = false;
    fileLines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
    lineNums = Object.keys(issueLines).map(function(x) {
      return parseInt(x);
    }).sort().reverse();

    for (j = 0, len1 = lineNums.length; j < len1; j++) {
      lineNum = lineNums[j];
      lineEdited = false;
      lineBefore = lineAfter = fileLines[lineNum];
      issues = issueLines[lineNum];
      issues.sort(function(a, b) {
        return b.colNum - a.colNum;
      });

      for (k = 0, len2 = issues.length; k < len2; k++) {
        issue = issues[k];
        lineAfter = fixSingleLineIssue(lineAfter, issue.issue, issue.colNum, issue.tslintLine);
        if (lineBefore !== lineAfter) {
          lineEdited = true;
        }
      }

      if (lineEdited) {
        fileEdited = true;
        fileLines[lineNum] = lineAfter;
        c.log("\n", issue.tslintLine, "\nBefore: ", lineBefore.trim(), "\nAfter:  ", lineAfter.trim());
      }

      if (issues.length === 1 && issues[0].issue.match(/^consecutive blank lines/)) {
        numLinesBefore = fileLines.length;
        fileLines = fixMultiLineIssue(fileLines, issues[0].issue, lineNum, issues[0].tslintLine);

        if (numLinesBefore !== fileLines.length) {
          fileEdited = true;
        }
      }
    }

    if (fileEdited) {
      contents = fileLines.join(os.EOL);
      results.push(fs.writeFileSync(filePath, contents, 'utf-8'));
    } else {
      results.push(undefined);
    }
  }
  return results;
};


/* main */
console.log(process.argv)
if (process.argv.length < 3) {
  help();
}

processTslintOutput(process.argv[2]);

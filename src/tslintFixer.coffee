###
tslintFixer parses the output of tslint and automatically fixes the issues
###

fs = require 'fs'
os = require 'os'
execSync = require('child_process').execSync
c = console

help = ->
    c.log "> tslint -c tslint.json **/*.ts > tslintout.txt"
    c.log "Then run the fixer"
    c.log "> coffee tslintFixer.coffee tslintout.txt"
    process.exit(0)

exec = (cmd) ->
    c.log cmd
    execSync(cmd)

fixSingleLineIssue = (line, issue, colNum, tslintLine) ->
    if line is undefined
        c.error "UNDEFINED LINE", tslintLine
        process.exit(1)

    if issue is "trailing whitespace"
        line = line.replace(/\s+$/, "") # rtrim

    else if issue is "space indentation expected"
        indent = line.match(/^\s+/)[0].replace(/\t/g, "    ")
        line = line.replace(/^\s+/, indent)

    else if issue is "trailing comma"
        if line[colNum] is ","
            line = line.substr(0, colNum) + line.substr(colNum + 1)

    else if issue is "comment must start with a space"
        if line.substr(colNum - 2, 2) is "//"
            line = line.substr(0, colNum) + " " + line.substr(colNum)

    else if (matches = issue.match(/^missing (semicolon|whitespace)$/))
        char = {semicolon: ";", whitespace: " "}[matches[1]]
        line = line.substr(0, colNum) + char + line.substr(colNum)

    else if (matches = issue.match(/^expected nospace (in|before) /))
        if line[colNum] is " "
            line = line.substr(0, colNum) + line.substr(colNum + 1)

    else if (matches = issue.match(/^(==|!=) should be (===|!==)$/))
        [_, findStr, replaceStr] = matches
        if line.substr(colNum, findStr.length) == findStr
            line = line.substr(0, colNum) + replaceStr + line.substr(colNum + findStr.length)

    else if (matches = issue.match(/^('|") should be ('|")$/))
        [_, findStr, replaceStr] = matches
        if line[colNum] is findStr
            endIndex = line.indexOf(findStr, colNum + 1)
            line = line.substr(0, colNum) + replaceStr + line.substr(colNum + 1)
            line = line.substr(0, endIndex) + replaceStr + line.substr(endIndex + 1)

    else
        c.log("Ignoring: #{tslintLine}, #{issue}")

    return line

fixMultiLineIssue = (fileLines, issue, lineNum, tslintLine) ->
    if issue.match(/^consecutive blank lines are (disallowed|forbidden)/)
        # loop to find all consecutive blank lines
        endLineNum = lineNum
        while endLineNum < fileLines.length and fileLines[endLineNum].match(/^\s*$/)
            endLineNum += 1

        # ensure that there are more than one blank lines before doing the splice
        if (endLineNum - lineNum) >= 1
            c.log "\n", tslintLine
            c.log fileLines.slice(lineNum - 2, endLineNum + 1).join("\n")
            fileLines.splice(lineNum, endLineNum - lineNum)
            c.log "\t\t\t^^^ Before ^^^ | vvv After vvv"
            c.log fileLines.slice(lineNum - 2, lineNum + 1).join("\n")

    return fileLines

processTslintOutput = (tslintOutFile) ->
    issueMap = {}
    tslintLines = fs.readFileSync(tslintOutFile, "utf-8").trim().split("\n")

    # group isues by filePath and lineNum
    for tslintLine in tslintLines
        matches = tslintLine.match(/([\\\/\w\.\-]+\.ts)\[(\d+), (\d+)\]: (.*)/)
        if not matches
            console.error("Unrecognized line: " + tslintLine)
            continue

        [_, filePath, lineNum, colNum, issue] = matches
        lineNum = parseInt(lineNum) - 1 # -1 for array index access
        colNum = parseInt(colNum) - 1
        issue = issue.toLowerCase()

        if not issueMap[filePath] then issueMap[filePath] = {}
        if not issueMap[filePath][lineNum] then issueMap[filePath][lineNum] = []
        issueMap[filePath][lineNum].push(colNum: colNum, issue: issue, tslintLine: tslintLine)

    # for each file, reverse-sort issues by lineNum and then by colNum
    for filePath, issueLines of issueMap
        fileEdited = false
        fileLines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)
        lineNums = Object.keys(issueLines).map((x) -> parseInt(x)).sort().reverse()

        for lineNum in lineNums
            lineEdited = false
            lineBefore = lineAfter = fileLines[lineNum]
            issues = issueLines[lineNum]
            issues.sort((a,b) -> b.colNum - a.colNum)

            # reverse sorted edits are safe because we only make edits after an index
            for issue in issues
                lineAfter = fixSingleLineIssue(lineAfter, issue.issue, issue.colNum, issue.tslintLine)
                if lineBefore isnt lineAfter then lineEdited = true

            # print before/after for every edited line
            if lineEdited
                fileEdited = true
                fileLines[lineNum] = lineAfter
                c.log "\n", issue.tslintLine, "\nBefore: ", lineBefore.trim(), "\nAfter:  ", lineAfter.trim()

            # multiline issues change line numbers so we only apply if they are the only issue
            if issues.length == 1 and issues[0].issue.match(/^consecutive blank lines/)
                numLinesBefore = fileLines.length
                fileLines = fixMultiLineIssue(fileLines, issues[0].issue, lineNum, issues[0].tslintLine)
                if numLinesBefore isnt fileLines.length then fileEdited = true

        # if file is not writable, mark for edit and save
        if fileEdited
            contents = fileLines.join(os.EOL)
            fs.writeFileSync(filePath, contents, 'utf-8')


### main ###
if process.argv.length < 3 then help()
processTslintOutput(process.argv[2])

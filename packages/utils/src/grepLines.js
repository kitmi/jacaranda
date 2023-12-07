function grepLines(textData, patterns, lineDelimiter) {
    lineDelimiter == null && (lineDelimiter = '\n');

    // Split the file into lines
    let lines = textData.split(lineDelimiter);

    let combinedPattern = new RegExp(patterns.map((pattern) => '(' + pattern.source + ')').join('|'));

    // Keey the lines that match any pattern
    let filteredLines = lines.filter((line) => {
        if (line.match(combinedPattern)) {
            return true;
        }

        return false;
    });

    // Join the remaining lines back into a single string
    return filteredLines.join(lineDelimiter);
}

export default grepLines;

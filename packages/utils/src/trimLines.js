function trimLines(textData, lineDelimiter) {
    lineDelimiter == null && (lineDelimiter = '\n');

    // Split the file into lines
    let lines = textData.split(lineDelimiter);

    return lines.map((line) => line.trim()).join(lineDelimiter);
}

export default trimLines;

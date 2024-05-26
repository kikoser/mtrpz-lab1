const fs = require('fs');

function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    const boldRegex = /(^|\s)\*\*(\S.*?\S)\*\*(?=\s|$)/g;
    const italicRegex = /(^|\s)_(\S.*?\S)_(?=\s|$)/g;
    const monospacedRegex = /(^|\s)`(\S.*?\S)`(?=\s|$)/g;
    const preformattedStartEndRegex = /(^|\s)```(\S.*?\S)```(?=\s|$)/g;
    let inPreformattedBlock = false;

    const validateLine = (line) => {
        // Check for nested or overlapping markup
        const boldMatches = line.match(boldRegex);
        const italicMatches = line.match(italicRegex);
        const monospacedMatches = line.match(monospacedRegex);

        if (boldMatches) {
            for (let match of boldMatches) {
                if (italicRegex.test(match) || monospacedRegex.test(match)) {
                    throw new Error('Nested or overlapping markup is not allowed');
                }
            }
        }

        if (italicMatches) {
            for (let match of italicMatches) {
                if (boldRegex.test(match) || monospacedRegex.test(match)) {
                    throw new Error('Nested or overlapping markup is not allowed');
                }
            }
        }

        if (monospacedMatches) {
            for (let match of monospacedMatches) {
                if (boldRegex.test(match) || italicRegex.test(match)) {
                    throw new Error('Nested or overlapping markup is not allowed');
                }
            }
        }
    };

    for (let line of lines) {
        if (preformattedStartEndRegex.test(line)) {
            // Extract preformatted text and add to HTML
            const preformattedMatch = line.match(preformattedStartEndRegex);
            if (preformattedMatch) {
                const preformattedText = preformattedMatch[0].slice(4, -3); // Remove ``` from start and end
                html += `<pre><code>${preformattedText}</code></pre>\n`;
                continue;
            }
        }

        if (inPreformattedBlock) {
            preformattedContent += line + '\n';
            continue;
        }

        validateLine(line);

        // Replace markdown with HTML tags
        line = line.replace(boldRegex, '$1<strong>$2</strong>')
                   .replace(italicRegex, '$1<em>$2</em>')
                   .replace(monospacedRegex, '$1<code>$2</code>');

        if (line.trim() === '') {
            html += '<p></p>\n';
        } else {
            html += '<p>' + line + '</p>\n';
        }
    }

    if (inPreformattedBlock) {
        throw new Error('Unclosed preformatted block');
    }

    return html;
}

function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.error('Usage: node script.js <input-file> [--out <output-file>]');
        process.exit(1);
    }

    const inputFilePath = args[0];
    let outputFilePath = null;

    if (args.length > 2 && args[1] === '--out') {
        outputFilePath = args[2];
    }

    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err.message}`);
            process.exit(1);
        }

        try {
            const html = parseMarkdown(data);
            if (outputFilePath) {
                fs.writeFile(outputFilePath, html, (err) => {
                    if (err) {
                        console.error(`Error writing to file: ${err.message}`);
                        process.exit(1);
                    }
                });
            } else {
                console.log(html);
            }
        } catch (err) {
            console.error(`Error processing markdown: ${err.message}`);
            process.exit(1);
        }
    });
}

main();

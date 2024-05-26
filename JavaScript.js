const readline = require('readline');
const fs = require('fs');

const rdln = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const keysMD = {
    '**': ['<b>', '</b>'],
    '`': ['<tt>', '</tt>'],
    '_': ['<i>', '</i>']
    
};

const convertMarkdownToHtml = (mdFile, htmlFile) => {
    fs.readFile(mdFile, 'utf8', (err, data) => {
        if (err) {
            console.error(`Помилка при зчитанні файлу: ${err}`);
            rdln.close();
            return;
        }
        const cutIntoParagraphs = data.split(/\r\n\s*\n/); // Створюємо абзаци
        const paragraphs = cutIntoParagraphs.map((ln) => {
            ln = `<p> ${ln} </p>`;
            return ln;
        });
        const words = paragraphs.map((prgrph) => {
            return prgrph.split(/[\s\r\n]+/);
        }).flat();
        const highlightSpecCharacters = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };
        let preformat = false;
        let obese = 0;
        let italic = 0;
        let literal = 0;
        let combination = 0;
        let preformated = 0;
        const htmlTags = words.map((wrd) => {
            let htmlTag = wrd;
            if (wrd.includes('```')) {
                if(preformat){
                    htmlTag = htmlTag.replace(/```/g, '</pre>');
                    preformated--;
                }
                else{
                    htmlTag = htmlTag.replace(/```/g, '<pre> ');
                    preformated++;
                }
                preformat = !preformat;
                return htmlTag;
            }
            if (!preformat) {
                for (const [key, [openingTag, closingTag]] of Object.entries(keysMD)) {
                    const escapedKey = highlightSpecCharacters(key);
                    const regexStart = new RegExp(`^${escapedKey}`);
                    const regexEnd = new RegExp(`${escapedKey}$`);
                    const regexTest = new RegExp(`^(${escapedKey}\\*\\*|${escapedKey}_|${escapedKey}\`)`);
                    const keyLength = key.length;
                    const wordLength = htmlTag.length;
                    if (regexTest.test(htmlTag)){
                        combination++;
                    }
                    if (htmlTag.startsWith(key) && keyLength < wordLength) {
                        htmlTag = htmlTag.replace(regexStart, openingTag);
                        if (key === '**') {
                            obese++;
                        } else if (key === '_') {
                           italic++;
                        } else if (key === '`') {
                            literal++;
                        }
                    }
                    if (htmlTag.endsWith(key) && keyLength < wordLength) {
                        htmlTag = htmlTag.replace(regexEnd, closingTag);
                        if (key === '**') {
                            obese--;
                        } else if (key === '_') {
                            italic--;
                        } else if (key === '`') {
                            literal--;
                        }
                    }
                }
            }
            return htmlTag;
        });
        //Провірка на помилки
        if (combination){
            console.error('Error: trying to combinate markdown, example: **_text_**');
        } else if (obese != 0 || italic != 0 || literal != 0 || preformated != 0) {
            console.error('Error: Some tags were not closed/opened');
        } 
        else {
            const htmlContent = htmlTags.join(' ');

            if(htmlFile) {
                fs.writeFile(htmlFile, htmlContent, (err) => {
                    if (err) {
                        console.error(`File write error: ${err}`);
                    } 
                    else {
                        console.log(`The result was successfully saved to the file: ${htmlFile}`);
                    }
                    rdln.close();
                });
            }
            else {
                console.log(htmlContent)
            }
        }

        rdln.close();
    });
};
const args = process.argv.slice(2);
const mdFile = args[0];
let htmlFile = 0;

const outIndex = args.indexOf('--out');
if (outIndex !== -1 && outIndex + 1 < args.length) {
    htmlFile = args[outIndex + 1];
}
convertMarkdownToHtml(mdFile, htmlFile);

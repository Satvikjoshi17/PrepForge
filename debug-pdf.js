
const fs = require('fs');
const util = require('util');

try {
    console.log('Requiring pdf-parse...');
    const pdf = require('pdf-parse');

    let output = '';
    output += `Type: ${typeof pdf}\n`;
    output += `Is Array: ${Array.isArray(pdf)}\n`;
    output += `Keys: ${JSON.stringify(Object.keys(pdf))}\n`;

    if (pdf.PDFParse) {
        output += `pdf.PDFParse type: ${typeof pdf.PDFParse}\n`;
        // try to see if it's a class or function
        output += `pdf.PDFParse prototype: ${JSON.stringify(Object.keys(pdf.PDFParse.prototype || {}))}\n`;
    }


    // Try a deep require if the main one is weird
    try {
        const cjsPath = 'pdf-parse/dist/pdf-parse/cjs/index.cjs';
        const pdfCjs = require(cjsPath);
        output += `\n--- CJS Path (${cjsPath}) ---\n`;
        output += `Type: ${typeof pdfCjs}\n`;
        output += `Keys: ${JSON.stringify(Object.keys(pdfCjs))}\n`;
    } catch (e) {
        output += `\nFailed to require CJS path: ${e.message}\n`;
    }

    fs.writeFileSync('debug-output.txt', output);
    console.log('Debug info written to debug-output.txt');

} catch (e) {
    fs.writeFileSync('debug-output.txt', `Error: ${e.message}\n${e.stack}`);
}

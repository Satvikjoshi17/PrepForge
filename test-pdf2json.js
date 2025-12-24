
const PDFParser = require('pdf2json');
console.log('PDFParser type:', typeof PDFParser);
try {
    const parser = new PDFParser(null, 1);
    console.log('Parser instance created successfully');
} catch (e) {
    console.error('Error creating parser:', e.message);
}

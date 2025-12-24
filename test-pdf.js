
const fs = require('fs');
const pdf = require('pdf-parse');

console.log('Type of pdf:', typeof pdf);
console.log('Is pdf a function?', typeof pdf === 'function');
console.log('Keys:', Object.keys(pdf));

if (typeof pdf !== 'function') {
    console.log('PDF Parse is not a function. Checking properties...');
    if (pdf.default) {
        console.log('pdf.default exists. Type:', typeof pdf.default);
    }
}

const fs = require('fs');
const path = require('path');
const https = require('https');

// Simple .env parser since we can't rely on dotenv being strictly configured for this script location
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        console.log('Loading env from:', envPath);
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const [key, ...val] = line.split('=');
                if (key && val) {
                    process.env[key.trim()] = val.join('=').trim();
                }
            });
            console.log('Env loaded.');
        } else {
            console.error('Env file not found at:', envPath);
        }
    } catch (e) {
        console.error('Error loading .env.local:', e);
    }
}

loadEnv();

const apiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!apiKey) {
    console.error('Error: GOOGLE_GENAI_API_KEY not found in .env.local');
    process.exit(1);
} else {
    console.log('API Key found (length):', apiKey.length);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('Fetching available models from URL:', url.replace(apiKey, 'HIDDEN'));

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            let output = '';
            if (json.models) {
                output += '\n--- AVAILABLE MODELS ---\n';
                // Filter for chat/generateContent models
                const chatModels = json.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
                chatModels.forEach(m => {
                    output += `Name: ${m.name}\n`;
                    output += `Display: ${m.displayName}\n`;
                    output += `Version: ${m.version}\n`;
                    output += '-------------------------\n';
                });
            } else {
                output += 'Error response: ' + JSON.stringify(json, null, 2);
            }
            fs.writeFileSync('models_output.txt', output);
            console.log('Output written to models_output.txt');
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Raw data:', data);
        }
    });
}).on('error', (e) => {
    console.error('Error fetching models:', e);
});

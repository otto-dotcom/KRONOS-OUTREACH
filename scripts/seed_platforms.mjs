import fs from 'fs';
import path from 'path';

const README_PATH = 'c:/Users/TEMPOCASA/OneDrive/Desktop/TheRemoteFreelancer/README.md';

function parseReadme() {
    const content = fs.readFileSync(README_PATH, 'utf-8');
    const platforms = [];
    
    // Regex for table rows: | [Name](URL) | Rank | ... | Hires |
    // Updated to handle arbitrary whitespace
    const tableRowRegex = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|/gm;
    let match;
    
    while ((match = tableRowRegex.exec(content)) !== null) {
        platforms.push({
            name: match[1],
            url: match[2],
            rank: match[3].trim(),
            type: 'Client Platform'
        });
    }

    // List regex: * [Name](URL) - Description
    const listRegex = /^\*\s*\[([^\]]+)\]\(([^)]+)\)\s*–?\s*(.*)/gm;
    while ((match = listRegex.exec(content)) !== null) {
        platforms.push({
            name: match[1],
            url: match[2],
            description: match[3].trim(),
            type: 'Job Board'
        });
    }

    return platforms;
}

const platforms = parseReadme();
console.log(`Found ${platforms.length} platforms.`);
fs.writeFileSync('c:/Users/TEMPOCASA/KRONOS/kronosnet/KRONOS-OUTREACH/scripts/platforms_seed.json', JSON.stringify(platforms, null, 2));
console.log('Saved to platforms_seed.json');

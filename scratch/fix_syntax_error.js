const fs = require('fs');
const path = 'src/app/page.js';
let content = fs.readFileSync(path, 'utf8');

// Target the exact redundant block
// We expect something like:
// </div> (closes recipe inner map)
// )} (closes recipe outer div)
// </div> (extra)
// )} (extra)
// </div> (closes main container)

// Let's find the sequence and replace it.
const searchPattern = /<\/div>\s*\}\)\s*<\/div>\s*\}\)\s*<\/div>/;
const replacement = "</div>\n              )}\n          </div>";

if (searchPattern.test(content)) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully fixed the syntax error.');
} else {
    console.log('Could not find the redundant tags pattern.');
}

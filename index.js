const fs = require('fs');
const path = require('path');
const { convertHtmlToElementor } = require('./lib/convert');

function usage(){
  console.log('Usage: node index.js <input.html> <output.json>');
}

async function main(){
  const args = process.argv.slice(2);
  if(args.length < 2){ usage(); process.exit(1); }
  const inputPath = path.resolve(args[0]);
  const outputPath = path.resolve(args[1]);

  if(!fs.existsSync(inputPath)){
    console.error('Input file not found:', inputPath);
    process.exit(2);
  }

  const html = fs.readFileSync(inputPath, 'utf8');
  const title = path.basename(inputPath, path.extname(inputPath));
  const json = convertHtmlToElementor(html, title);

  fs.writeFileSync(outputPath, JSON.stringify(json, null, 2), 'utf8');
  console.log('Wrote', outputPath);
}

main().catch(err => { console.error(err); process.exit(3); });

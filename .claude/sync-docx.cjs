const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PANDOC  = 'C:/Users/MSI 2/AppData/Local/Pandoc/pandoc.exe';
const ROOT    = 'c:/Users/MSI 2/home-inventory';
const MD      = path.join(ROOT, 'TECHNICAL_DESIGN.md');
const DOCX    = path.join(ROOT, 'TECHNICAL_DESIGN.docx');
const DIAG    = path.join(ROOT, 'diagrams');

let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    const filePath = (input.tool_input && input.tool_input.file_path) || '';
    if (!filePath.includes('TECHNICAL_DESIGN.md')) return;
    convertAndExport();
  } catch (e) {
    process.stderr.write('sync-docx parse error: ' + e.message + '\n');
  }
});

async function convertAndExport() {
  try {
    // 1. Convert all SVGs in diagrams/ to PNGs using sharp (2x density for crisp output)
    if (fs.existsSync(DIAG)) {
      const sharp = require(path.join(ROOT, 'node_modules/sharp'));
      const svgs = fs.readdirSync(DIAG).filter(f => f.endsWith('.svg'));
      for (const svg of svgs) {
        const svgBuf = fs.readFileSync(path.join(DIAG, svg));
        const pngPath = path.join(DIAG, svg.replace('.svg', '.png'));
        await sharp(svgBuf, { density: 192 })
          .resize({ width: 1520, withoutEnlargement: true })
          .png()
          .toFile(pngPath);
      }
    }

    // 2. Run pandoc: standalone + auto-TOC + numbered sections
    execSync(
      `"${PANDOC}" "${MD}" -o "${DOCX}" ` +
      `--from markdown --to docx ` +
      `--standalone --toc --toc-depth=3 --number-sections`,
      { stdio: 'pipe' }
    );

    process.stdout.write('sync-docx: TECHNICAL_DESIGN.docx updated\n');
  } catch (e) {
    process.stderr.write('sync-docx error: ' + e.message + '\n');
  }
}

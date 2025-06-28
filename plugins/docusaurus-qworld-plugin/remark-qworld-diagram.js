const { visit } = require('unist-util-visit');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

const OUTPUT_BASE_DIR = 'static/img/qworld-diagrams';
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(process.cwd(), 'plugins/docusaurus-qworld-plugin/latex');
const TEMP_DIR = path.join(process.cwd(), '.qworld-temp');

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`[QWorld-Diagram] Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = function remarkQWorldDiagram() {
  console.log('[QWorld-Diagram] Initializing plugin.');
  ensureDirExists(OUTPUT_SVG_DIR);
  ensureDirExists(TEMP_DIR);

  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang === 'qworld-diagram') {
        console.log('[QWorld-Diagram] Found a qworld-diagram code block.');
        const latexCode = node.value;
        const diagramHash = crypto.createHash('md5').update(latexCode).digest('hex');
        const svgFileName = `${diagramHash}.svg`;
        const svgFilePath = path.join(OUTPUT_SVG_DIR, svgFileName);
        const publicPath = `/${OUTPUT_BASE_DIR}/${svgFileName}`;

        console.log(`[QWorld-Diagram] Hash: ${diagramHash}`);
        console.log(`[QWorld-Diagram] SVG Path: ${svgFilePath}`);

        if (fs.existsSync(svgFilePath)) {
          console.log('[QWorld-Diagram] Found cached SVG. Skipping generation.');
          node.type = 'html';
          node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
          return;
        }

        console.log('[QWorld-Diagram] No cache found. Starting image generation...');
        const tempTexFileName = `${diagramHash}.tex`;
        const tempPdfFileName = `${diagramHash}.pdf`;
        const tempTexFilePath = path.join(TEMP_DIR, tempTexFileName);
        const tempPdfFilePath = path.join(TEMP_DIR, tempPdfFileName);

        const latexPreamble = String.raw`
\documentclass{standalone}
\usepackage{tikz}
\usepackage{qworld}
\begin{document}
`;
        const latexPostamble = String.raw`
\end{document}
`;
        const fullLatexContent = latexPreamble + latexCode + latexPostamble;

        try {
          console.log('[QWorld-Diagram] Copying qworld.sty...');
          fs.copyFileSync(path.join(LATEX_PLUGIN_DIR, 'qworld.sty'), path.join(TEMP_DIR, 'qworld.sty'));

          console.log(`[QWorld-Diagram] Writing temporary TeX file to: ${tempTexFilePath}`);
          fs.writeFileSync(tempTexFilePath, fullLatexContent);

          try {
            console.log(`[QWorld-Diagram] Running lualatex on ${tempTexFilePath}...`);
            execSync(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${tempTexFilePath}`, { cwd: TEMP_DIR, stdio: 'pipe' });
          } catch (error) {
            console.error('[QWorld-Diagram] lualatex failed.');
            const logPath = path.join(TEMP_DIR, `${diagramHash}.log`);
            if (fs.existsSync(logPath)) {
              const logContent = fs.readFileSync(logPath, 'utf8');
              error.message += `\n\n--- LaTeX Log ---\n${logContent}`;
            }
            throw error;
          }

          if (!fs.existsSync(tempPdfFilePath)) {
            throw new Error(`lualatex finished but PDF file was not created at ${tempPdfFilePath}`);
          }

          try {
            console.log(`[QWorld-Diagram] Running pdf2svg on ${tempPdfFilePath}...`);
            execSync(`pdf2svg ${tempPdfFilePath} ${svgFilePath}`, { stdio: 'pipe' });
          } catch (error) {
            console.error('[QWorld-Diagram] pdf2svg failed.');
            throw error;
          }

          console.log('[QWorld-Diagram] Generation complete. Inserting <img> tag.');
          node.type = 'html';
          node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;

        } catch (error) {
          console.error('\n\n[QWorld-Diagram] >>> AN ERROR OCCURRED <<<');
          console.error(`[QWorld-Diagram] Error compiling diagram (hash: ${diagramHash}):`);
          console.error(`STDOUT: ${error.stdout?.toString()}`);
          console.error(`STDERR: ${error.stderr?.toString()}`);
          console.error(`Full Error: ${error.message}`);
          console.error('[QWorld-Diagram] >>> END OF ERROR <<<');

          node.type = 'html';
          node.value = `<div style="border: 2px solid red; padding: 1em; background-color: #ffeeee;">
            <p style="color: red; font-weight: bold;">Error rendering QWorld diagram.</p>
            <p>Check the build console log for the full error message from lualatex or pdf2svg.</p>
          </div>`;
        } finally {
            const filesToDelete = fs.readdirSync(TEMP_DIR).filter(file => file.startsWith(diagramHash));
            filesToDelete.forEach(file => {
                try {
                    fs.unlinkSync(path.join(TEMP_DIR, file));
                } catch (e) {
                    // Ignore errors during cleanup
                }
            });
        }
      }
    });
  };
};
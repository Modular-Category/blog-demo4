import {visit} from 'unist-util-visit';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';

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

export default function remarkQWorldDiagram() {
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

          console.log('[QWorld-Diagram] Running lualatex...');
          execSync(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${tempTexFilePath}`, { stdio: 'pipe' });
          console.log('[QWorld-Diagram] lualatex finished successfully.');

          console.log('[QWorld-Diagram] Running pdf2svg...');
          execSync(`pdf2svg ${tempPdfFilePath} ${svgFilePath}`, { stdio: 'pipe' });
          console.log('[QWorld-Diagram] pdf2svg finished successfully.');

          console.log('[QWorld-Diagram] Cleaning up temporary files...');
          fs.unlinkSync(tempTexFilePath);
          fs.unlinkSync(tempPdfFileName);
          fs.readdirSync(TEMP_DIR).forEach(file => {
            if (file.startsWith(diagramHash)) {
              fs.unlinkSync(path.join(TEMP_DIR, file));
            }
          });

          console.log('[QWorld-Diagram] Generation complete. Inserting <img> tag.');
          node.type = 'html';
          node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
        } catch (error) {
          console.error('\n\n[QWorld-Diagram] >>> AN ERROR OCCURRED <<<');
          console.error(`[QWorld-Diagram] Error compiling diagram (hash: ${diagramHash}):`);
          console.error(error); // Log the full error object
          console.error('[QWorld-Diagram] >>> END OF ERROR <<<');

          node.type = 'html';
          node.value = `<div style="border: 2px solid red; padding: 1em; background-color: #ffeeee;">
            <p style="color: red; font-weight: bold;">Error rendering QWorld diagram:</p>
            <p><pre>${error.message}</pre></p>
            <p>Check the build console log for more details.</p>
            <p>LaTeX Code:</p>
            <pre>${latexCode}</pre>
          </div>`;
        }
      }
    });
  };
};
import {visit} from 'unist-util-visit';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { execSync } from 'child_process';

const OUTPUT_BASE_DIR = 'static/img/qworld-diagrams'; // Relative to project root
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(process.cwd(), 'plugins/docusaurus-qworld-plugin/latex');
const TEMP_DIR = path.join(process.cwd(), '.qworld-temp');

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export default function remarkQWorldDiagram() {
  ensureDirExists(OUTPUT_SVG_DIR);
  ensureDirExists(TEMP_DIR);

  return (tree) => {
    visit(tree, 'code', (node) => {
      if (node.lang === 'qworld-diagram') {
        const latexCode = node.value;
        const diagramHash = crypto.createHash('md5').update(latexCode).digest('hex');
        const svgFileName = `${diagramHash}.svg`;
        const svgFilePath = path.join(OUTPUT_SVG_DIR, svgFileName);
        const publicPath = `/${OUTPUT_BASE_DIR}/${svgFileName}`; // Path for the <img> tag

        if (fs.existsSync(svgFilePath)) {
          node.type = 'html';
          node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
          return;
        }

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
          fs.copyFileSync(path.join(LATEX_PLUGIN_DIR, 'qworld.sty'), path.join(TEMP_DIR, 'qworld.sty'));
          fs.writeFileSync(tempTexFilePath, fullLatexContent);
          execSync(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${tempTexFilePath}`, { stdio: 'inherit' });
          execSync(`pdf2svg ${tempPdfFilePath} ${svgFilePath}`);
          
          fs.unlinkSync(tempTexFilePath);
          fs.unlinkSync(tempPdfFilePath);
          fs.readdirSync(TEMP_DIR).forEach(file => {
            if (file.startsWith(diagramHash) && file !== svgFileName) {
              fs.unlinkSync(path.join(TEMP_DIR, file));
            }
          });

          node.type = 'html';
          node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
        } catch (error) {
          console.error(`Error compiling QWorld diagram (hash: ${diagramHash}): ${error.message}`);
          console.error(`LaTeX code: \n${latexCode}`);
          node.type = 'html';
          node.value = `<p style="color: red;">Error rendering QWorld diagram: ${error.message}</p><pre>${latexCode}</pre>`;
        }
      }
    });
  };
};
const { visit } = require('unist-util-visit');
const path = require('path');
const fs = require('fs'); // Keep fs for existsSync for now, or switch to fs.promises.access
const { exec } = require('child_process'); // Use async exec

// Import promise-based versions
const fsp = require('fs').promises;
const child_process_promises = require('child_process').promises;

const OUTPUT_BASE_DIR = 'img/qworld-diagrams';
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(process.cwd(), 'plugins/docusaurus-qworld-plugin/latex');
const TEMP_DIR = path.join(process.cwd(), '.qworld-temp');

async function ensureDirExists(dir) {
  try {
    await fsp.access(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[QWorld-Diagram] Creating directory: ${dir}`);
      await fsp.mkdir(dir, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Generates an SVG from LaTeX code asynchronously.
 * @param {string} latexCode - The core LaTeX code to compile.
 * @param {string} diagramHash - MD5 hash of the LaTeX code.
 * @param {string} fullLatexContent - The complete LaTeX document content including preamble and postamble.
 * @param {string} svgFilePath - Absolute path where the SVG should be saved.
 * @param {string} tempTexFilePath - Absolute path for the temporary .tex file.
 * @param {string} tempPdfFilePath - Absolute path for the temporary .pdf file.
 * @param {string} logPrefix - Prefix for console logs (e.g., "inlineMath").
 * @returns {boolean} - True if SVG generation was successful, false otherwise.
 */
async function generateDiagram(latexCode, diagramHash, fullLatexContent, svgFilePath, tempTexFilePath, tempPdfFilePath, logPrefix = '') {
  let success = false;
  try {
    console.log(`[QWorld-Diagram] ${logPrefix} Copying qworld.sty...`);
    await fsp.copyFile(path.join(LATEX_PLUGIN_DIR, 'qworld.sty'), path.join(TEMP_DIR, 'qworld.sty'));

    console.log(`[QWorld-Diagram] ${logPrefix} Writing temporary TeX file to: ${tempTexFilePath}`);
    await fsp.writeFile(tempTexFilePath, fullLatexContent);

    try {
      console.log(`[QWorld-Diagram] ${logPrefix} Running lualatex on ${tempTexFilePath}...`);
      await child_process_promises.exec(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${tempTexFilePath}`, { cwd: TEMP_DIR });
    } catch (error) {
      console.error(`[QWorld-Diagram] ${logPrefix} lualatex failed.`);
      const logPath = path.join(TEMP_DIR, `${diagramHash}.log`);
      try {
        const logContent = await fsp.readFile(logPath, 'utf8');
        error.message += `\n\n--- LaTeX Log (${logPrefix}) ---\n${logContent}`;
      } catch (readLogError) {
        // Ignore if log file doesn't exist
      }
      throw error;
    }

    try {
      await fsp.access(tempPdfFilePath); // Check if PDF exists
    } catch (error) {
      throw new Error(`lualatex finished but PDF file was not created for ${logPrefix} at ${tempPdfFilePath}`);
    }

    try {
      console.log(`[QWorld-Diagram] ${logPrefix} Running pdf2svg on ${tempPdfFilePath}...`);
      await child_process_promises.exec(`pdf2svg ${tempPdfFilePath} ${svgFilePath}`);
    } catch (error) {
      console.error(`[QWorld-Diagram] ${logPrefix} pdf2svg failed.`);
      throw error;
    }

    console.log(`[QWorld-Diagram] ${logPrefix} Generation complete.`);
    success = true;

  } catch (error) {
    console.error(`\n\n[QWorld-Diagram] >>> AN ERROR OCCURRED (${logPrefix}) <<<`);
    console.error(`[QWorld-Diagram] Error compiling diagram (hash: ${diagramHash}):`);
    console.error(`Full Error: ${error.message}`);
    // Note: stdout/stderr from exec are already part of the error object
  } finally {
    const filesToDelete = fs.readdirSync(TEMP_DIR).filter(file => file.startsWith(diagramHash));
    for (const file of filesToDelete) {
      try {
        await fsp.unlink(path.join(TEMP_DIR, file));
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }
  return success;
}


module.exports = function remarkQWorldDiagram(options) {
  console.log('[QWorld-Diagram] Initializing plugin.');
  ensureDirExists(OUTPUT_SVG_DIR); // This will now return a Promise, but the plugin setup doesn't await it.
  ensureDirExists(TEMP_DIR);       // This is fine for initial setup, as subsequent operations will await.

  return async (tree) => { // Make the main function async
    console.log('[QWorld-Diagram] DEBUG: Full AST tree:', JSON.stringify(tree, null, 2));

    const diagramPromises = [];

    visit(tree, 'code', (node) => {
      if (node.lang === 'qworld-diagram') {
        console.log('[QWorld-Diagram] Found a qworld-diagram code block.');
        const latexCode = node.value;
        const diagramHash = crypto.createHash('md5').update(latexCode).digest('hex');
        const svgFileName = `${diagramHash}.svg`;
        const svgFilePath = path.join(OUTPUT_SVG_DIR, svgFileName);
        const publicPath = path.join(options.baseUrl, OUTPUT_BASE_DIR, svgFileName);

        console.log(`[QWorld-Diagram] Hash: ${diagramHash}`);
        console.log(`[QWorld-Diagram] SVG Path: ${svgFilePath}`);

        if (fs.existsSync(svgFilePath)) { // Keep synchronous check for cache for performance
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

        const latexPreamble = String.raw`\n\\documentclass{standalone}\n\\usepackage{tikz}\n\\usepackage{qworld}\n\\begin{document}\n`;
        const latexPostamble = String.raw`\n\\end{document}\n`;
        const fullLatexContent = latexPreamble + latexCode + latexPostamble;

        diagramPromises.push(
          generateDiagram(latexCode, diagramHash, fullLatexContent, svgFilePath, tempTexFilePath, tempPdfFilePath, 'code block')
            .then(success => {
              if (success) {
                node.type = 'html';
                node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
              } else {
                node.type = 'html';
                node.value = `<div style="border: 2px solid red; padding: 1em; background-color: #ffeeee;">\n            <p style="color: red; font-weight: bold;">Error rendering QWorld diagram.</p>\n            <p>Check the build console log for the full error message from lualatex or pdf2svg.</p>\n          </div>`;
              }
            })
        );
      }
    });

    visit(tree, 'inlineMath', (node) => {
      console.log('[QWorld-Diagram] DEBUG: Found inlineMath node.');
      console.log('[QWorld-Diagram] DEBUG: inlineMath node value:', node.value);
      const latexCode = node.value;
      const diagramHash = crypto.createHash('md5').update(latexCode).digest('hex');
      const svgFileName = `${diagramHash}.svg`;
      const svgFilePath = path.join(OUTPUT_SVG_DIR, svgFileName);
      const publicPath = path.join(options.baseUrl, OUTPUT_BASE_DIR, svgFileName);

      if (fs.existsSync(svgFilePath)) { // Keep synchronous check for cache for performance
        console.log('[QWorld-Diagram] Found cached SVG for inlineMath. Skipping generation.');
        node.type = 'html';
        node.value = `<img src="${publicPath}" alt="QWorld Diagram" style="vertical-align: middle;">`;
        return;
      }

      console.log('[QWorld-Diagram] No cache found for inlineMath. Starting image generation...');
      const tempTexFileName = `${diagramHash}.tex`;
      const tempPdfFileName = `${diagramHash}.pdf`;
      const tempTexFilePath = path.join(TEMP_DIR, tempTexFileName);
      const tempPdfFilePath = path.join(TEMP_DIR, tempPdfFileName);

      const fullLatexContent = String.raw`\n\\documentclass{standalone}\n\\usepackage{tikz}\n\\usepackage{qworld}\n\\begin{document}\n${latexCode}$\n\\end{document}\n`;

      diagramPromises.push(
        generateDiagram(latexCode, diagramHash, fullLatexContent, svgFilePath, tempTexFilePath, tempPdfFilePath, 'inlineMath')
          .then(success => {
            if (success) {
              node.type = 'html';
              node.value = `<img src="${publicPath}" alt="QWorld Diagram" style="vertical-align: middle;">`;
            }
            else {
              node.type = 'html';
              node.value = `<div style="border:2px solid red;padding:1em;background-color:#ffeeee">\n            <p style="color:red;font-weight:bold">Error rendering QWorld diagram (inlineMath).</p>\n            <p>Check the build console log for the full error message from lualatex or pdf2svg.</p>\n          </div>`;
            }
          })
      );
    });

    visit(tree, 'math', (node) => {
      console.log('[QWorld-Diagram] DEBUG: Found math node.');
      console.log('[QWorld-Diagram] DEBUG: math node value:', node.value);
      const latexCode = node.value;
      const diagramHash = crypto.createHash('md5').update(latexCode).digest('hex');
      const svgFileName = `${diagramHash}.svg`;
      const svgFilePath = path.join(OUTPUT_SVG_DIR, svgFileName);
      const publicPath = path.join(options.baseUrl, OUTPUT_BASE_DIR, svgFileName);

      if (fs.existsSync(svgFilePath)) { // Keep synchronous check for cache for performance
        console.log('[QWorld-Diagram] Found cached SVG for math. Skipping generation.');
        node.type = 'html';
        node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
        return;
      }

      console.log('[QWorld-Diagram] No cache found for math. Starting image generation...');
      const tempTexFileName = `${diagramHash}.tex`;
      const tempPdfFileName = `${diagramHash}.pdf`;
      const tempTexFilePath = path.join(TEMP_DIR, tempTexFileName);
      const tempPdfFilePath = path.join(TEMP_DIR, tempPdfFileName);

      const fullLatexContent = String.raw`\n\\documentclass{standalone}\n\\usepackage{tikz}\n\\usepackage{qworld}\n\\begin{document}\n$${latexCode}$\n\\end{document}\n`;

      diagramPromises.push(
        generateDiagram(latexCode, diagramHash, fullLatexContent, svgFilePath, tempTexFilePath, tempPdfFilePath, 'math')
          .then(success => {
            if (success) {
              node.type = 'html';
              node.value = `<img src="${publicPath}" alt="QWorld Diagram">`;
            } else {
              node.type = 'html';
              node.value = `<div style="border:2px solid red;padding:1em;background-color:#ffeeee">\n            <p style="color:red;font-weight:bold">Error rendering QWorld diagram (math).</p>\n            <p>Check the build console log for the full error message from lualatex or pdf2svg.</p>\n          </div>`;
            }
          })
      );
    });

    await Promise.all(diagramPromises); // Wait for all diagrams to be generated
  };
};
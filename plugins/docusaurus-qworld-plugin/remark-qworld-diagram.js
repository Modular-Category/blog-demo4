const { visit } = require('unist-util-visit');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const fsp = require('fs').promises;
const crypto = require('crypto');

const OUTPUT_BASE_DIR = 'static/img/qworld-diagrams';
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(process.cwd(), 'plugins/docusaurus-qworld-plugin/latex');
const TEMP_DIR = path.join(process.cwd(), '.qworld-temp');

// LaTeXテンプレートを修正
const BASE_LATEX_TEMPLATE = String.raw`\documentclass[varwidth]{standalone}\usepackage{amsmath}\RequirePackage{qworld}\begin{document}%LATEX_CODE%\end{document}`;

// SVG生成関数
async function generateDiagram(latexCode, hash) {
  const svgFilePath = path.join(OUTPUT_SVG_DIR, `${hash}.svg`);
  console.log(`[QWorld] Checking cache for ${hash}.svg → exists=`, fs.existsSync(svgFilePath));
  if (fs.existsSync(svgFilePath)) {
    return;
  }

  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', latexCode);
  const texInputs = `${LATEX_PLUGIN_DIR}${path.delimiter}${process.env.TEXINPUTS || ''}`;

  // (省略: 先のデバッグログ部分)

  const luaCmd = `lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`;
  console.log('[QWorld] About to run:', luaCmd);

  try {
    await fsp.writeFile(texFilePath, fullLatexContent);
    const { stdout: luaOut, stderr: luaErr } = await execAsync(luaCmd, {
      cwd: TEMP_DIR,
      env: { ...process.env, TEXINPUTS: texInputs },
    });
    console.log('[QWorld] lualatex stdout:\n', luaOut);
    console.error('[QWorld] lualatex stderr:\n', luaErr);

    console.log(`[QWorld] Checking PDF at ${pdfFilePath}:`, fs.existsSync(pdfFilePath));

    const pdf2svgCmd = `pdf2svg ${pdfFilePath} ${svgFilePath}`;
    console.log('[QWorld] About to run:', pdf2svgCmd);
    const { stdout: svgOut, stderr: svgErr } = await execAsync(pdf2svgCmd, {
      cwd: TEMP_DIR,
    });
    console.log('[QWorld] pdf2svg stdout:\n', svgOut);
    console.error('[QWorld] pdf2svg stderr:\n', svgErr);

  } catch (error) {
    // ログ全文を必ず出力するように強化
    console.error(`[QWorld-Diagram] Error generating diagram for hash ${hash}:`, error);
    const logPath = path.join(TEMP_DIR, `${hash}.log`);
    if (fs.existsSync(logPath)) {
      const logContent = await fsp.readFile(logPath, 'utf8');
      console.error(`--- LaTeX Log (${hash}) START ---\n${logContent}\n--- LaTeX Log (${hash}) END ---`);
    } else {
      console.error(`[QWorld-Diagram] No LaTeX log found at ${logPath}`);
    }
    throw error;
  } finally {
    const filesToDelete = await fsp.readdir(TEMP_DIR);
    for (const file of filesToDelete) {
      if (file.startsWith(hash)) {
        try {
          await fsp.unlink(path.join(TEMP_DIR, file));
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') {
            console.error(`[QWorld-Diagram] Error cleaning up file ${file}:`, unlinkError);
          }
        }
      }
    }
  }
}



module.exports = function remarkQWorldDiagram(options) {
  fs.mkdirSync(OUTPUT_SVG_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  return async (tree) => {
    const generationTasks = [];

    visit(tree, ['math', 'inlineMath'], (node) => {
      const originalValue = node.value;
      const qMatches = originalValue.match(/\\?q\{.*?\}/g);

      if (qMatches) {
        const latexToCompile = node.type === 'inlineMath' ? `$${originalValue.replace(/\\/g, '\\\\')}$` : `$$${originalValue.replace(/\\/g, '\\\\')}$$`;
        const hash = crypto.createHash('md5').update(latexToCompile).digest('hex');
        const svgFileName = `${hash}.svg`;
        const publicPath = path.posix.join(options.baseUrl || '/', 'img/qworld-diagrams', svgFileName);
        
        const imgTag = `<img src="${publicPath}" alt="QWorld Diagram" style="vertical-align: middle;">`;
        
        node.type = 'html';
        node.value = imgTag;
        delete node.children;

        // SVG生成タスクをキューに追加
        generationTasks.push(() => generateDiagram(latexToCompile, hash));
      }
    });

    // タスクを直列に実行
    for (const task of generationTasks) {
      await task();
    }
  };
};
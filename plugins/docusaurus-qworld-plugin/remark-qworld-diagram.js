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
  if (fs.existsSync(svgFilePath)) return;

  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', latexCode);
  const texInputs = `${LATEX_PLUGIN_DIR}${path.delimiter}${process.env.TEXINPUTS || ''}`;

  // （これまでのログ部分は省略）

  // LuaLaTeX 実行
  await fsp.writeFile(texFilePath, fullLatexContent);
  await execAsync(luaCmd, { cwd: TEMP_DIR, env: { ...process.env, TEXINPUTS: texInputs } });

  // PDF→SVG
  const pdf2svgCmd = `pdf2svg ${pdfFilePath} ${svgFilePath}`;
  console.log('[QWorld] About to run:', pdf2svgCmd);
  await execAsync(pdf2svgCmd, { cwd: TEMP_DIR });

  // ─── ここから追加 ───
  // 1) SVG の存在確認
  const svgExists = fs.existsSync(svgFilePath);
  console.log(`[QWorld] Checking SVG at ${svgFilePath}:`, svgExists);

  // 2) 出力ディレクトリ全体の一覧
  try {
    const outFiles = fs.readdirSync(OUTPUT_SVG_DIR);
    console.log('[QWorld] Contents of OUTPUT_SVG_DIR:', outFiles);
  } catch (e) {
    console.error('[QWorld] Cannot read OUTPUT_SVG_DIR:', OUTPUT_SVG_DIR, e);
  }
  // ─── ここまで追加 ───

  // （以降の catch/finally は既存のまま）
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
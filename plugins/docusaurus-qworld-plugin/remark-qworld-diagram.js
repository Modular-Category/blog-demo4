

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

// LaTeXテンプレート
const BASE_LATEX_TEMPLATE = String.raw`
\documentclass{standalone}
\usepackage{tikz}
\usepackage{qworld}
\begin{document}
%LATEX_CODE%
\end{document}
`;

// SVG生成関数
async function generateDiagram(latexCode, hash) {
  const svgFilePath = path.join(OUTPUT_SVG_DIR, `${hash}.svg`);
  if (fs.existsSync(svgFilePath)) {
    return; // キャッシュがあれば何もしない
  }

  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', latexCode);

  try {
    await fsp.writeFile(texFilePath, fullLatexContent);
    await fsp.copyFile(path.join(LATEX_PLUGIN_DIR, 'qworld.sty'), path.join(TEMP_DIR, 'qworld.sty'));
    await execAsync(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`, { cwd: TEMP_DIR });
    await execAsync(`pdf2svg ${pdfFilePath} ${svgFilePath}`);
  } catch (error) {
    console.error(`[QWorld-Diagram] Error generating diagram for hash ${hash}:`, error);
    const logPath = path.join(TEMP_DIR, `${hash}.log`);
    if (fs.existsSync(logPath)) {
      const logContent = await fsp.readFile(logPath, 'utf8');
      console.error(`--- LaTeX Log (${hash}) ---
${logContent}`);
    }
    throw error; // エラーを再スローしてビルドを失敗させる
  } finally {
    // 一時ファイルのクリーンアップ
    const filesToDelete = fs.readdirSync(TEMP_DIR).filter(file => file.startsWith(hash));
    for (const file of filesToDelete) {
      await fsp.unlink(path.join(TEMP_DIR, file));
    }
  }
}

module.exports = function remarkQWorldDiagram(options) {
  fs.mkdirSync(OUTPUT_SVG_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  return async (tree) => {
    const promises = [];
    const nodesToModify = [];

    visit(tree, ['math', 'inlineMath'], (node) => {
      const originalValue = node.value;
      const qMatches = originalValue.match(/\q\{.*?\}/g);

      if (qMatches) {
        let newValue = originalValue;
        for (const match of qMatches) {
          const latexCode = match;
          const hash = crypto.createHash('md5').update(latexCode).digest('hex');
          const svgFileName = `${hash}.svg`;
          // baseUrlを考慮した正しいパスを生成
          const publicPath = path.posix.join(options.baseUrl || '/', 'img/qworld-diagrams', svgFileName);
          
          const imgTag = `<img src="${publicPath}" alt="QWorld Diagram" style="vertical-align: middle;">`;
          newValue = newValue.replace(match, imgTag);

          promises.push(generateDiagram(latexCode, hash));
        }
        
nodesToModify.push({ node, newValue });
      }
    });

    await Promise.all(promises);

    for (const { node, newValue } of nodesToModify) {
      node.type = 'html';
      node.value = newValue;
      delete node.children;
    }
  };
};

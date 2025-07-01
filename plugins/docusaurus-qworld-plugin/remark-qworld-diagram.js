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
    return; // キャッシュがあれば何もしない
  }

  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', latexCode);

  const texInputs = `${LATEX_PLUGIN_DIR}${path.delimiter}${process.env.TEXINPUTS || ''}`;

   // ─── デバッグ用ログ ───
  try {
    const files = fs.readdirSync(LATEX_PLUGIN_DIR);
    console.log('[QWorld] Contents of LATEX_PLUGIN_DIR:', files);
  } catch (e) {
    console.error('[QWorld] Cannot read LATEX_PLUGIN_DIR:', LATEX_PLUGIN_DIR, e);
  }
  console.log('[QWorld] Env TEXINPUTS before prepend:', process.env.TEXINPUTS);
  console.log('[QWorld] texInputs being used:', texInputs);

  const luaCmd = `lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`;
  console.log('[QWorld] About to run:', luaCmd);
  // ─── ここまでログ ───
  
  try {
    await fsp.writeFile(texFilePath, fullLatexContent);
    await execAsync(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`, {
      cwd: TEMP_DIR,
      env: { ...process.env, TEXINPUTS: texInputs },
    });
    await execAsync(`pdf2svg ${pdfFilePath} ${svgFilePath}`);
  } catch (error) {
    console.error(`[QWorld-Diagram] Error generating diagram for hash ${hash}:`, error);
    const logPath = path.join(TEMP_DIR, `${hash}.log`);
    if (fs.existsSync(logPath)) {
      const logContent = await fsp.readFile(logPath, 'utf8');
      console.error(`--- LaTeX Log (${hash}) ---\n${logContent}`);
    }
    throw error; // エラーを再スローしてビルドを失敗させる
  } finally {
    // 一時ファイルのクリーンアップ（競合状態を避ける）
    const filesToDelete = await fsp.readdir(TEMP_DIR);
    for (const file of filesToDelete) {
      if (file.startsWith(hash)) {
        try {
          await fsp.unlink(path.join(TEMP_DIR, file));
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') {
            // ファイルが存在しないエラー以外は、念のためログに出す
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
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
  // 1. キャッシュチェック
  console.log(`[QWorld] Checking cache for ${hash}.svg → exists=`, fs.existsSync(svgFilePath));
  if (fs.existsSync(svgFilePath)) {
    return;
  }

  // 2. ファイルパス準備
  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', latexCode);
  const texInputs = `${LATEX_PLUGIN_DIR}${path.delimiter}${process.env.TEXINPUTS || ''}`;

  // 3. デバッグ: プラグインディレクトリと環境変数
  try {
    const files = fs.readdirSync(LATEX_PLUGIN_DIR);
    console.log('[QWorld] Contents of LATEX_PLUGIN_DIR:', files);
  } catch (e) {
    console.error('[QWorld] Cannot read LATEX_PLUGIN_DIR:', LATEX_PLUGIN_DIR, e);
  }
  console.log('[QWorld] Env TEXINPUTS before prepend:', process.env.TEXINPUTS);
  console.log('[QWorld] texInputs being used:', texInputs);

  // 4. LuaLaTeX 実行コマンド
  const luaCmd = `lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`;
  console.log('[QWorld] About to run:', luaCmd);

  try {
    // 5. .tex ファイルを書き出し
    await fsp.writeFile(texFilePath, fullLatexContent);

    // 6. LuaLaTeX 実行
    const { stdout: luaOut, stderr: luaErr } = await execAsync(luaCmd, {
      cwd: TEMP_DIR,
      env: { ...process.env, TEXINPUTS: texInputs },
    });
    console.log('[QWorld] lualatex stdout:\n', luaOut);
    console.error('[QWorld] lualatex stderr:\n', luaErr);

    // 7. PDF の存在・サイズ・ヘッダー確認
    const exists = fs.existsSync(pdfFilePath);
    console.log(`[QWorld] Checking PDF at ${pdfFilePath}:`, exists);
    if (exists) {
      const stat = fs.statSync(pdfFilePath);
      console.log(`[QWorld] PDF size (bytes):`, stat.size);
      const fd = fs.openSync(pdfFilePath, 'r');
      const buf = Buffer.alloc(20);
      fs.readSync(fd, buf, 0, 20, 0);
      fs.closeSync(fd);
      console.log('[QWorld] PDF header bytes:', buf.toString('utf8'));
    }

    // 8. PDF→SVG 変換
    const pdf2svgCmd = `pdf2svg ${pdfFilePath} ${svgFilePath}`;
    console.log('[QWorld] About to run:', pdf2svgCmd);
    const { stdout: svgOut, stderr: svgErr } = await execAsync(pdf2svgCmd, {
      cwd: TEMP_DIR,
    });
    console.log('[QWorld] pdf2svg stdout:\n', svgOut);
    console.error('[QWorld] pdf2svg stderr:\n', svgErr);

    // 9. SVG の存在チェックと出力ディレクトリ一覧
    const svgExists = fs.existsSync(svgFilePath);
    console.log(`[QWorld] Checking SVG at ${svgFilePath}:`, svgExists);
    try {
      const outFiles = fs.readdirSync(OUTPUT_SVG_DIR);
      console.log('[QWorld] Contents of OUTPUT_SVG_DIR:', outFiles);
    } catch (e) {
      console.error('[QWorld] Cannot read OUTPUT_SVG_DIR:', OUTPUT_SVG_DIR, e);
    }

  } catch (error) {
    // 10. エラー時: コンソール出力＋LaTeXログ全文ダンプ
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
    // 11. 一時ファイルのクリーンアップ
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

    visit(tree, 'code', (node) => {
      if (node.lang === 'qworld') {
        const latexToCompile = `\q{${node.value.trim()}}`;
        const hash = crypto.createHash('md5').update(latexToCompile).digest('hex');
        const svgFileName = `${hash}.svg`;
        const publicPath = path.posix.join(options.baseUrl || '/', 'img/qworld-diagrams', svgFileName);
        
        const imgTag = `<img src="${publicPath}" alt="QWorld Diagram" style="vertical-align: middle;">`;
        
        node.type = 'html';
        node.value = imgTag;

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
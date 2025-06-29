// plugins/docusaurus-qworld-plugin/rehype-qworld-diagram.js
const { visit } = require('unist-util-visit');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fsp = require('fs').promises;
const crypto = require('crypto');

const OUTPUT_BASE_DIR = 'img/qworld-diagrams';
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(process.cwd(), 'plugins/docusaurus-qworld-plugin/latex');
const TEMP_DIR = path.join(process.cwd(), '.qworld-temp');

// 同期的に出力先だけ用意
fs.mkdirSync(OUTPUT_SVG_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

// LaTeX テンプレート
const BASE_LATEX_TEMPLATE = String.raw`
\documentclass{standalone}
\usepackage{tikz}
\usepackage{qworld}
\begin{document}
%LATEX_CODE%
\end{document}
`;

async function generateSVG(raw, hash, svgPath) {
  const texPath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfPath = path.join(TEMP_DIR, `${hash}.pdf`);
  const content = BASE_LATEX_TEMPLATE.replace('%LATEX_CODE%', raw);
  await fsp.writeFile(texPath, content);
  await fsp.copyFile(path.join(LATEX_PLUGIN_DIR, 'qworld.sty'), path.join(TEMP_DIR, 'qworld.sty'));
  await exec(`lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texPath}`);
  await exec(`pdf2svg ${pdfPath} ${svgPath}`);
  // cleanup
  await Promise.all(
    (await fsp.readdir(TEMP_DIR))
      .filter(f => f.startsWith(hash))
      .map(f => fsp.unlink(path.join(TEMP_DIR, f)))
  );
}

module.exports = function rehypeQWorldDiagram(options) {
  return async (tree) => {
    const tasks = [];
    visit(tree, 'element', (node, index, parent) => {
      // <code class="language-math math-inline">...</code> を検出
      if (
        node.tagName === 'code' &&
        Array.isArray(node.properties?.className) &&
        node.properties.className.includes('language-math')
      ) {
        const raw = node.children?.[0]?.value;
        if (!raw) return;
        const hash = crypto.createHash('md5').update(raw).digest('hex');
        const svgName = `${hash}.svg`;
        const svgPath = path.join(OUTPUT_SVG_DIR, svgName);
        const publicPath = path.posix.join(options.baseUrl, OUTPUT_BASE_DIR, svgName);

        // キャッシュなければ生成タスクを詰める
        if (!fs.existsSync(svgPath)) {
          tasks.push(generateSVG(raw, hash, svgPath));
        }

        // タスク完了後に HAST ノードを書き換え
        tasks.push(
          Promise.resolve().then(() => {
            // <code> の代わりに <img> 要素を挿入
            parent.children[index] = {
              type: 'element',
              tagName: 'img',
              properties: { src: publicPath, alt: 'QWorld Diagram', style: 'vertical-align: middle' },
              children: []
            };
          })
        );
      }
    });
    await Promise.all(tasks);
  };
};

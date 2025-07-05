const { visit } = require("unist-util-visit");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const { exec } = require("child_process");
const execAsync = promisify(exec);
const fsp = require("fs").promises;
const crypto = require("crypto");

const OUTPUT_BASE_DIR = "static/img/qworld-diagrams";
const OUTPUT_SVG_DIR = path.join(process.cwd(), OUTPUT_BASE_DIR);
const LATEX_PLUGIN_DIR = path.join(
  process.cwd(),
  "plugins/docusaurus-qworld-plugin/latex",
);
const TEMP_DIR = path.join(process.cwd(), ".qworld-temp");

const BASE_LATEX_TEMPLATE = String.raw`\documentclass[varwidth, border=1pt]{standalone}\usepackage{amsmath}\usepackage{varwidth}\RequirePackage{qworld}\begin{document}%LATEX_CODE%\end{document}`;

async function cleanupTempFiles(hash, tempDir) {
  try {
    const filesToDelete = await fsp.readdir(tempDir);
    for (const file of filesToDelete) {
      if (file.startsWith(hash)) {
        const filePath = path.join(tempDir, file);
        for (let i = 0; i < 5; i++) {
          try {
            await fsp.unlink(filePath);
            break;
          } catch (unlinkError) {
            if (unlinkError.code === "EBUSY" && i < 4) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            } else if (unlinkError.code === "ENOENT") {
              break;
            } else {
              console.error(
                `[QWorld-Diagram] Error cleaning up file ${file}:`,
                unlinkError,
              );
              break;
            }
          }
        }
      }
    }
  } catch (readdirError) {
    console.error(
      `[QWorld-Diagram] Error reading temp directory for cleanup:`,
      readdirError,
    );
  }
}

async function generateDiagram(latexCode, hash) {
  const svgFilePath = path.join(OUTPUT_SVG_DIR, `${hash}.svg`);
  if (fs.existsSync(svgFilePath)) {
    return;
  }

  const texFilePath = path.join(TEMP_DIR, `${hash}.tex`);
  const pdfFilePath = path.join(TEMP_DIR, `${hash}.pdf`);
  const fullLatexContent = BASE_LATEX_TEMPLATE.replace(
    "%LATEX_CODE%",
    latexCode,
  );
  const texInputs = `${LATEX_PLUGIN_DIR}${path.delimiter}${process.env.TEXINPUTS || ""}`;

  const luaCmd = `lualatex -output-directory=${TEMP_DIR} -interaction=nonstopmode -halt-on-error ${texFilePath}`;

  try {
    await fsp.writeFile(texFilePath, fullLatexContent);

    await execAsync(luaCmd, {
      cwd: TEMP_DIR,
      env: { ...process.env, TEXINPUTS: texInputs },
      shell: 'powershell.exe',
    });

    const gsBboxCmd = "C:\Program Files\gs\gs10.05.1\bin\gswin64c.exe" -sDEVICE=bbox -dQUIET -dBATCH -dNOPAUSE ${pdfFilePath};
    const { stderr: gsBboxErr } = await execAsync(gsBboxCmd, { cwd: TEMP_DIR, shell: 'powershell.exe' });
    const bboxMatch = gsBboxErr.match(
      /%%BoundingBox: (\d+) (\d+) (\d+) (\d+)/,
    );

    let croppedPdfFilePath = pdfFilePath;
    if (bboxMatch) {
      const [, x1, y1, x2, y2] = bboxMatch;
      const gsCmd = "C:\\Program Files\\gs\\gs10.05.1\\bin\\gswin64c.exe" -o ${TEMP_DIR}/${hash}-cropped.pdf -sDEVICE=pdfwrite -dUseCropBox -dPDFFitPage -c "[/CropBox [${x1} ${y1} ${x2} ${y2}] /PZ 1 def] setpagedevice" -f ${pdfFilePath}
      await execAsync(gsCmd, { cwd: TEMP_DIR, shell: 'powershell.exe' });
      croppedPdfFilePath = `${TEMP_DIR}/${hash}-cropped.pdf`;
    } else {
      console.warn(
        `[QWorld] BoundingBox not found in log for ${hash}.pdf. Skipping cropping.`,
      );
    }

    const pdf2svgCmd = `pdf2svg ${croppedPdfFilePath} ${svgFilePath}`;
    await execAsync(pdf2svgCmd, { cwd: TEMP_DIR });

  } catch (error) {
    console.error(
      `[QWorld-Diagram] Error generating diagram for hash ${hash}:`,
      error,
    );
    const logPath = path.join(TEMP_DIR, `${hash}.log`);
    if (fs.existsSync(logPath)) {
      const logContent = await fsp.readFile(logPath, "utf8");
      console.error(
        `--- LaTeX Log (${hash}) START ---\n${logContent}\n--- LaTeX Log (${hash}) END ---`,
      );
    }
    throw error;
  } finally {
    await cleanupTempFiles(hash, TEMP_DIR);
  }
}

module.exports = function remarkQWorldDiagram(options) {
  fs.mkdirSync(OUTPUT_SVG_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  return async (tree) => {
    const generationTasks = [];

    visit(tree, ["code", "text"], (node, index, parent) => {
      if (node.type === "code" && node.lang === "qworld") {
        const latexToCompile = node.value.trim();
        console.log(`[QWorld-Debug] LaTeX for code block: ${latexToCompile}`);
        const hash = crypto.createHash("md5").update(latexToCompile).digest("hex");
        const svgFileName = `${hash}.svg`;
        const publicPath = path.posix.join(options.baseUrl || "/", OUTPUT_BASE_DIR.replace("static/", ""), svgFileName);

        const imageNode = {
          type: "image",
          url: publicPath,
          alt: "QWorld Diagram",
        };
        parent.children.splice(index, 1, imageNode);

        generationTasks.push(() => generateDiagram(latexToCompile, hash));
        return visit.SKIP;
      }

      if (node.type === "text") {
        const inlineQworldRegex = /\q\{([\s\S]*?)\}/g;
        let match;
        let lastIndex = 0;
        const newNodes = [];
        let changed = false;

        while ((match = inlineQworldRegex.exec(node.value)) !== null) {
          changed = true;
          if (match.index > lastIndex) {
            newNodes.push({ type: "text", value: node.value.substring(lastIndex, match.index) });
          }

          const latexCode = match[1].trim();
          const latexToCompile = `\q{${latexCode}}`;
          console.log(`[QWorld-Debug] LaTeX for inline: ${latexToCompile}`);
          const hash = crypto.createHash("md5").update(latexToCompile).digest("hex");
          const svgFileName = `${hash}.svg`;
          const publicPath = path.posix.join(options.baseUrl || "/", OUTPUT_BASE_DIR.replace("static/", ""), svgFileName);

          newNodes.push({ type: "image", url: publicPath, alt: "QWorld Diagram" });

          generationTasks.push(() => generateDiagram(latexToCompile, hash));
          lastIndex = inlineQworldRegex.lastIndex;
        }

        if (changed) {
          if (lastIndex < node.value.length) {
            newNodes.push({ type: "text", value: node.value.substring(lastIndex) });
          }
          parent.children.splice(index, 1, ...newNodes);
          return [visit.SKIP, index + newNodes.length];
        }
      }
    });

    for (const task of generationTasks) {
      await task();
    }
  };
};
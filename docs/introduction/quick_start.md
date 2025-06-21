---
sidebar_position: 3
---

# 5分でわかるQWorld

`QWorld` を使って最初の図を描画してみましょう。このチュートリアルでは、簡単な図式を含む完全なLaTeXドキュメントを作成する手順を解説します。

### 1. LaTeXファイルの準備

まず、お好きなテキストエディタで新しいファイルを作成し、`quick-start.tex` という名前で保存します。
そして、以下のコードをコピー＆ペーストしてください。

```latex
% quick-start.tex
\documentclass{article}

% QWorld パッケージを読み込みます
\usepackage{qworld}

\begin{document}

QWorld の最初の図です！

\[
  \q{
    \qcap \qwire \n
    \qwire \qbraid \n
    \qcup \qwire
  }
\]

上の図は、ワイヤーを曲げたり交差させたりする操作を
組み合わせたものです。

\end{document}
```

### 2. コードの解説

-   `\documentclass{article}`: これは標準的なLaTeXの文書クラスを定義します。
-   `\usepackage{qworld}`: ここで **QWorld** パッケージを読み込み、図式を描画するためのコマンドを有効にしています。
-   `\begin{document}` ... `\end{document}`: この間に文書の本文を記述します。
-   `\[ ... \]`: 数式を表示するための環境です。
-   `\q{ ... }`: これが **QWorld** の描画キャンバスです。この中に図の要素を配置していきます。
-   `\qcap`, `\qwire`, `\qbraid`, `\qcup`: これらは図を構成する部品（素子）です。
-   `\n`: `\qcirc` と同じ意味で、改行のように振る舞い、次の要素をすぐ下に配置します。

### 3. コンパイルと結果の確認

作成した `quick-start.tex` ファイルを、お使いのLaTeX環境（pdfLaTeXなど）でコンパイルしてください。

成功すると、以下のような図が描画されたPDFファイルが生成されます。

![Quick Startの図](https://placehold.co/200x300/F3F4F6/333333?text=Quick%20Start%20Diagram)

これで、あなたは `QWorld` を使って図式を描画する第一歩を踏み出しました！
次のチュートリアルでは、これらの基本要素をさらに詳しく見ていきましょう。

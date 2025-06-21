---
sidebar_position: 2
---

# インストール

`QWorld` は、主要なTeXディストリビューションに含まれており、いくつかの方法でインストールできます。

### TeX Live を利用する場合

お使いのTeXディストリビューションがTeX Liveの場合、ターミナル（コマンドプロンプト）から `tlmgr` (TeX Live Manager) を使って簡単にインストールできます。

```bash
tlmgr install qworld
```

アップデートがある場合は、以下のコマンドで更新できます。
```bash
tlmgr update qworld
```

### MiKTeX を利用する場合

MiKTeXを利用している場合、パッケージは通常、`\usepackage{qworld}` が初めて呼び出された際に自動でインストールされます。
手動でインストールしたい場合は、MiKTeX Consoleからパッケージを検索してインストールすることも可能です。

### CTANから手動でインストール

最新版や特定のバージョンを手動でインストールすることもできます。

1.  **CTANリポジトリにアクセスします**:
    [https://ctan.org/pkg/qworld](https://ctan.org/pkg/qworld)

2.  パッケージファイル (`.zip` または `.tds.zip`) をダウンロードします。

3.  ダウンロードしたファイルを、お使いのTeXシステムのローカル`texmf`ツリーに展開します。場所がわからない場合は、`kpsewhich -var-value TEXMFHOME` コマンドで調べることができます。

4.  最後に、ファイル名データベースを更新します（必要な場合）。
    ```bash
    texhash
    # or mktexlsr
    ```

### 使い方

インストールが完了したら、LaTeXドキュメントのプリアンブル（`\documentclass`と`\begin{document}`の間）に以下の一行を追加するだけで、`QWorld`のコマンドが使えるようになります。

```latex
\usepackage{qworld}

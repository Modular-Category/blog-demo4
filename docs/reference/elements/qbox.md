---
sidebar_position: 1
---

# `\qbox`

プロセスや射を表す、基本的な四角形のボックスを描画します。

## 構文

```latex
\qbox[<options>]
```

## オプション

`\qbox`は、チュートリアルで解説した多くの[カスタマイズオプション](../../tutorials/customizing_boxes.md)を受け入れます。

-   `n`, `N`: 上部（出力）ワイヤーの設定
-   `s`, `S`: 下部（入力）ワイヤーの設定
-   `hlen`, `vlen`: サイズの設定
-   `name`: ラベルの設定
-   `color`, `frame color`, `morphism color`: 色の設定
-   その他、[共通オプション](./options.md)も使用可能です。

## 特殊なボックス

`\qbox`を基盤とした、特定の用途のためのコマンドも用意されています。

| コマンド | 形状 | 説明 |
| :--- | :--- | :--- |
| `\qstate`| ▽ | 状態 (0-入力, 1-出力) |
| `\qeffect`| △ | 効果 (1-入力, 0-出力) |
| `\qscalar`| ○ | スカラー (0-入力, 0-出力) |
| `\qasym` | 台形 | 非対称なボックス |
| `\qtrans`| 反転台形 | 転置ボックス (`f^T`) |
| `\qadj` | 反転台形 | 随伴ボックス (`f^†`) |
| `\qconj` | ボックス | 共役ボックス |
| `\qspider`| ＊ | スパイダー（フロベニウス代数）|

### 使用例: `\qstate` と `\qeffect`

```latex
\q{
  \qstate[name={\psi}] \n
  \qbox[name={U}] \n
  \qeffect[name={\phi}]
}
```

![特殊なボックスの使用例](https://placehold.co/150x250/F3F4F6/333333?text=Special%20Boxes)

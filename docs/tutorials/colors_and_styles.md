---
sidebar_position: 4
---

# 色とスタイルの適用

図式の視認性を高めるために、ボックスやワイヤーに色やスタイルを適用することができます。

### ボックスの彩色

ボックスには3種類の色属性を指定できます。

-   `color`: ボックスの内部を塗りつぶす色。
-   `frame color`: ボックスの枠線の色。
-   `morphism color`: ボックス内部の射（ワイヤーなど）の色。

```latex
\q{
  \qbox[
    name={\(f\)},
    color=yellow!20,
    frame color=orange,
    morphism color=red,
    s=2, n=2, S={1,2}, N={1,2}
  ]
}
```

![彩色されたボックスの図](https://placehold.co/200x200/F3F4F6/333333?text=Colored%20Box)

### ワイヤーのスタイル

ワイヤーの線の種類は `arrowtype` キーで変更できます。これはTikZのスタイルオプションを直接利用します。

-   `dotted` (点線)
-   `dashed` (破線)
-   `dash dot` (一点鎖線)
-   `loosely dotted` (間隔の広い点線)

```latex
\q{
  \qwire[arrowtype=dotted] \qspace
  \qwire[arrowtype=dashed] \qspace
  \qwire[arrowtype={dash dot}]
}
```

![様々なスタイルのワイヤーの図](https://placehold.co/400x150/F3F4F6/333333?text=Wire%20Styles)

### 対象ごとの色分け

ワイヤーに直接 `color` を指定することで、対象（オブジェクト）ごとにワイヤーを色分けし、どの情報がどこを流れているかを視覚的に分かりやすく表現できます。これは、複雑な図式を解釈する上で非常に有効なテクニックです。

```latex
\q{
  \qbox[
    name={$f$},
    dom color=cyan,
    cod color=magenta
  ]
}
```

この例では、入力側のワイヤーが `cyan`、出力側のワイヤーが `magenta` で描画されます。

![色分けされたワイヤーを持つボックスの図](https://placehold.co/150x200/F3F4F6/333333?text=Object%20Coloring)

これらのスタイリング機能を活用することで、より情報量豊かで、解釈しやすい図式を作成できます。

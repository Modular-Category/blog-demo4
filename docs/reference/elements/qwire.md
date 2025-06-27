---
sidebar_position: 2
---

# `\qwire`

対象や情報の流れを表すワイヤー（線）を描画します。

## 構文

```latex
\qwire[<options>]
```

## オプション

-   `vlen`: ワイヤーの垂直方向の長さを指定します。デフォルトは`1`です。
-   `arrowtype`: ワイヤーの線のスタイルを指定します（例: `dotted`, `dashed`）。
-   `color`: ワイヤーの色を指定します。
-   `dom`: ワイヤーの始点（domain）を `(x,y)` 座標またはTikZのノード名で指定します。
-   `cod`: ワイヤーの終点（codomain）を指定します。`dom`が指定されていて`cod`が未指定の場合、`dom`から真上に`vlen`だけ移動した点が終点になります。
-   `label`: ワイヤーに沿って表示するテキストを指定します。
-   `label at`: ラベルを表示するワイヤー上の位置を指定します（例: `start`, `midway`, `end`）。
-   `label side`: ワイヤーに対してラベルをどちら側に表示するかを指定します（例: `left`, `right`）。
-   その他、[共通オプション](./options.md)も使用可能です。

### 使用例: `dom` と `cod` による自由な配線

```latex
\q{
  \qbox[id=A, at={0,0}]
  \qbox[id=B, at={3,2}]

  % ボックスAの1番目の出力からボックスBの1番目の入力へ
  \qwire[
    dom={O-1-A},
    cod={I-1-B},
    label={$x$},
    label at=midway
  ]
}
```

![自由な配線の図](https://placehold.co/300x250/F3F4F6/333333?text=Custom%20Wiring)

## 向きを持つワイヤー

特定の向きを強調するためのコマンドも用意されています。

| コマンド | 矢印 | 説明 |
| :--- | :--- | :--- |
| `\qwireu` | ↑ | 上向きワイヤー |
| `\qwired` | ↓ | 下向きワイヤー |
| `\qwireuu`| ⇑ | 上向き二重線ワイヤー |
| `\qwiredd`| ⇓ | 下向き二重線ワイヤー |

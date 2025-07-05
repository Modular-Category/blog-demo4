---
sidebar_position: 3
---

# `\qbraid`, `\qbraidinv`, `\qsym`

ワイヤーの交差を表現するためのコマンド群です。

## 構文

```latex
\qbraid[<options>]
\qbraidinv[<options>]
\qsym[<options>]
```

| コマンド     | 説明                                                       |
| :----------- | :--------------------------------------------------------- |
| `\qbraid`    | 組紐 (Braiding)。左のワイヤーが上を通って交差します。      |
| `\qbraidinv` | `\qbraid`の逆射。右のワイヤーが上を通って交差します。      |
| `\qsym`      | 対称 (Symmetry)。単純な交差で、2回繰り返すと元に戻ります。 |

## オプション

- `num L`: 左側のワイヤー群の本数を指定します。デフォルトは`1`です。
- `num R`: 右側のワイヤー群の本数を指定します。デフォルトは`1`です。
- `hlen`, `vlen`: 交差部分のサイズを調整します。
- `L color`, `R color`: 左側と右側のワイヤー群の色をそれぞれ指定できます。
- その他、[共通オプション](./options.md)も使用可能です。

### 使用例: 複数ワイヤーの組紐

`num L` と `num R` を使うことで、ワイヤーの束同士の交差を表現できます。

```latex
\q{
  \qbraid[
    num L=2,
    num R=3,
    L color=blue,
    R color=red
  ]
}
```

![複数ワイヤーの組紐の図](https://placehold.co/300x200/F3F4F6/333333?text=Multi-wire%20Braid)

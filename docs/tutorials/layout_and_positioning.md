---
sidebar_position: 3
---

# レイアウトと座標

QWorldでは、素子の配置を制御するためのコマンドが用意されています。これにより、複雑なレイアウトの図式も正確に作成できます。

### 相対座標による配置

コマンドが実行された現在の位置を基準に、次の描画位置を移動させます。

- `\qmv[x,y]`: 現在位置から `(x, y)` だけ平行移動します。
- `\n[y]`: 現在のX座標をリセットし、Y座標を `y` だけ下に移動します（デフォルトは `y=1`）。`\qcirc` と似ていますが、より細かな制御が可能です。
- `\qspace[x]`: 現在位置から水平方向に `x` だけ移動します（デフォルトは `x=1`）。

#### 使用例

```latex
\q{
  \qbox[name=A]
  \qspace[2]
  \qbox[name=B]
  \n[1.5]
  \qbox[name=C]
  \qmv[2, -1.5]
  \qbox[name=D]
}
```

![相対座標による配置の図](https://placehold.co/400x300/F3F4F6/333333?text=Relative%20Positioning)

### 絶対座標による配置

`at={x,y}` オプションを使うと、キャンバスの原点 `(0,0)` を基準とした絶対座標に素子を直接配置できます。

TikZの `\coordinate` コマンドと組み合わせることで、より複雑な配置も可能です。

#### 使用例

```latex
\q{
  % (0, 2) の位置に座標 'top_pos' を定義
  \coordinate (top_pos) at (0,2);

  \qbox[at=top_pos, name={Top}]
  \qbox[at={-1,0}, name={Left}]
  \qbox[at={1,0}, name={Right}]

  % ワイヤーで各ボックスを繋ぐ
  \qwire[dom={S-1-2}, cod={N-1-1}] % Left -> Top
  \qwire[dom={S-1-3}, cod={N-1-1}] % Right -> Top
}
```

![絶対座標による配置の図](https://placehold.co/300x300/F3F4F6/333333?text=Absolute%20Positioning)

これらの座標指定を使い分けることで、単純な垂直・水平合成から、自由なレイアウトの図式まで、あらゆる構造を表現できます。

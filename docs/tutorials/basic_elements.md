---
sidebar_position: 1
---

# 基本要素

QWorldの図式は、いくつかの基本的な要素（素子）を組み合わせることで作成されます。すべての描画は `\q{...}` というキャンバス環境内で行います。

<div class="card-style">

### `\qbox`: ボックス

`\qbox` は、射やプロセスを表す基本的な「箱」を描画します。
</div>

```latex
\q{ \qbox }
```

![`\qbox`の図](https://placehold.co/100x100/F3F4F6/333333?text=Box)

### `\qwire`: ワイヤー

`\qwire` は、対象や情報の流れを表す「ワイヤー（線）」を描画します。

```latex
\q{ \qwire }
```

![`\qwire`の図](https://placehold.co/50x150/F3F4F6/333333?text=Wire)

### `\qcirc`: 合成

`\qcirc` は、素子を垂直に合成します。これは数学における関数の合成 `g ∘ f` に対応します。なお、改行コマンド `\n` も `\qcirc` と同じ意味を持ちます。

```latex
\q{
  \qbox[name={$f$}]
  \qcirc
  \qbox[name={$g$}]
}
```

![ボックスの合成図](https://placehold.co/100x200/F3F4F6/333333?text=f%20∘%20g)

### 並列合成（テンソル積）

コマンドをスペースで区切って並べるだけで、素子を水平に並べて配置（並列合成）できます。これはモノイダル圏におけるテンソル積 `f ⊗ g` に対応します。

```latex
\q{
  \qbox[name={$f$}] \qbox[name={$g$}]
}
```

![ボックスの並列合成図](https://placehold.co/200x100/F3F4F6/333333?text=f%20⊗%20g)

これらの要素を組み合わせることで、より複雑な図式を構築していきます。

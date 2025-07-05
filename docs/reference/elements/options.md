---
sidebar_position: 5
---

# 共通オプション

多くのQWorldコマンドでは、以下の共通オプションキーが利用できます。

### `id`

素子に一意な識別子（ID）を割り当てます。このIDは、TikZのノード名として内部的に利用され、`\qwire`の`dom`/`cod`オプションなどで参照する際に非常に重要です。

```latex
\q{
  \qbox[id=BOXA, name={A}] \n
  \qbox[id=BOXB, name={B}]

  % ID "BOXA" の出力と "BOXB" の入力を接続
  \qwire[dom={O-1-BOXA}, cod={I-1-BOXB}]
}
```

### `show id`

`true`に設定すると、QWorldが自動的に割り振る数値ID、または`id`キーで指定したIDを、素子の中央に表示します。デバッグや複雑な図式の構造を把握するのに役立ちます。

```latex
\q{
  \qbox[show id=true] \qbox[show id=true] \n
  \qbox[id=C, show id=true]
}
```

![show idの図](https://placehold.co/200x200/F3F4F6/333333?text=Show%20ID%20Example)

### `at`

`at={x,y}`の形式で、キャンバスの原点を基準とした絶対座標に素子を配置します。

### `p` と `P`

- `p=k`: `n=k`と`s=k`を同時に指定するショートカットです。
- `P={...}`: `N={...}`と`S={...}`を同時に指定するショートカットです。

```latex
% p=3 は n=3, s=3 と同じ
\qbox[p=3]
```

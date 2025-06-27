---
sidebar_position: 4
---

# `\qcap`, `\qcup`

双対性を持つ圏において、ワイヤーを曲げる操作（評価・余評価）を表現します。

## 構文

```latex
\qcap[<options>]
\qcup[<options>]
\qcaprev[<options>]
\qcuprev[<options>]
```

| コマンド | 形状 | 説明 |
| :--- | :--- | :--- |
| `\qcup` | ∪ | カップ (Cup)。下向きのワイヤーを繋ぎ、上向きに曲げます。|
| `\qcap` | ∩ | キャップ (Cap)。上向きのワイヤーを繋ぎ、下向きに曲げます。|
| `\qcuprev`| ∪ (矢印逆) | リバースカップ。|
| `\qcaprev`| ∩ (矢印逆) | リバースキャップ。|

## オプション

-   `hlen`, `vlen`: カップやキャップのサイズを調整します。
-   `color`: ワイヤーの色を指定します。
-   [共通オプション](./options.md)も使用可能です。

### 使用例: ジグザグ等式

これらのコマンドの基本的な性質は、曲げたワイヤーをすぐに戻すと元通りになる、というジグザグ等式（スネーク等式）で表されます。

```latex
\q{
  \qcap \qwire \n
  \qwire \qcup
}
=
\q{ \qwire[vlen=2] }
```

![ジグザグ等式の図](https://placehold.co/300x200/F3F4F6/333333?text=Zig-zag%20Identity)

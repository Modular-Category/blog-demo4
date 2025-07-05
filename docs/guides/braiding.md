---
sidebar_position: 2
---

# 組紐 (Braiding)

**組紐モノイダル圏**では、2つの対象 `X` と `Y` のテンソル積 `X ⊗ Y` を `Y ⊗ X` に入れ替えるための特別な射 `σ_{X,Y}`（**組紐**または**ブレイディング**）が定義されます。

QWorldでは、ワイヤーの交差としてこれを表現します。

### `\qbraid` と `\qbraidinv`

- `\qbraid`: ワイヤーを左から右へ交差させます。
- `\qbraidinv`: ワイヤーを右から左へ交差させます。

これらは互いに逆射の関係にあります `\qbraid \n \qbraidinv` は2本の平行なワイヤーと等しくなります。

### ヤン・バクスター方程式 (Yang-Baxter Equation)

組紐が満たすべき最も重要な公理の一つが、ヤン・バクスター方程式です。これは3本のワイヤーを編む際に、編む順番によらず最終的な結果が同じになることを示します。

```latex
\q{
  \qbraid \qwire \n
  \qwire \qbraid \n
  \qbraid \qwire
}
=
\q{
  \qwire \qbraid \n
  \qbraid \qwire \n
  \qwire \qbraid
}
```

![ヤン・バクスター方程式の図](https://placehold.co/400x300/F3F4F6/333333?text=Yang-Baxter%20Equation)

### 対称モノイダル圏

組紐を2回繰り返すと元に戻る (`σ_{Y,X} ∘ σ_{X,Y} = id`) 場合、その圏は**対称モノイダル圏**と呼ばれます。このとき、ブレイディングは `\qsym` で表現され、ワイヤーが単純に交差する図となります。

```latex
\q{
  \qsym \n \qsym
}
=
\q{
  \qwire[vlen=2] \qwire[vlen=2]
}
```

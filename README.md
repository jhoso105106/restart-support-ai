# ペット似顔絵 - アクリル絵の具で描く

HTML/CSS/JavaScript で実装した、ペットの似顔絵を依頼するホームページです。GitHub Pages で公開できます。

## 📁 ファイル構成

```
├── index.html          # メインページ
├── styles.css          # スタイル
├── script.js           # JavaScriptの機能
└── README.md           # このファイル
```

## ✨ 機能

- ✅ **レスポンシブデザイン** - PC・タブレット・スマートフォンに対応
- ✅ **作品ギャラリー** - 似顔絵の作品を展示
- ✅ **料金表** - 3つのサイズと価格を表示
- ✅ **依頼フォーム** - ペット情報や要望を入力
- ✅ **FAQ** - よくある質問に回答
- ✅ **お問い合わせ** - メールアドレスなど記載
- ✅ **スムーズなUIアニメーション** - ホバーエフェクトなど

## 🎨 デザイン特徴

- グラデーション配色（紫系）でプロフェッショナルな雰囲気
- 各セクションはカード型で見やすく配置
- ホバーエフェクトで交互性を向上

## 🚀 GitHub Pages での公開方法

### 1. リポジトリ設定

```bash
# 変更をコミット
git add .
git commit -m "Add pet portrait website"
git push origin jhoso105106-pet-portrait-website
```

### 2. GitHub Pages 設定

1. GitHub の リポジトリページに行く
2. Settings → Pages
3. "Build and deployment" セクションで：
   - Source: `Deploy from a branch`
   - Branch: `main` → `/(root)`
   - Save をクリック

4. 数秒待つと URL が表示されます

## 📝 カスタマイズ方法

### メールアドレス変更

`index.html` の以下の部分を変更：

```html
<a href="mailto:info@example.com">info@example.com</a>
```

### Instagram アカウント変更

```html
<a href="https://instagram.com/YOUR_ACCOUNT" target="_blank">@YOUR_ACCOUNT</a>
```

### 作品ギャラリー更新

実際の画像を用意して、`index.html` の画像 URL を変更：

```html
<img src="images/dog-portrait-1.jpg" alt="犬の似顔絵">
```

### 料金変更

`index.html` の pricing セクションで金額を編集：

```html
<p class="price">¥5,000</p>
```

## 🔧 フォーム機能

現在はフロントエンドのみで実装しています。実際にメール送信する場合は：

### オプション 1: Formspree（簡単）

1. https://formspree.io/ にアクセス
2. ログイン＆新規フォーム作成
3. form の `action` を変更：

```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```

### オプション 2: GitHub Actions + メール

別途スクリプト実装が必要です。

## 📱 ブラウザ対応

- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

## 🎯 次のステップ

- [ ] 作品の実画像をアップロード
- [ ] メール送信機能の実装
- [ ] SNS リンクの追加
- [ ] セキュリティ設定（フォーム検証など）
- [ ] SEO 最適化

## 📄 ライセンス

自由に使用・改変できます。

---

**ご質問やサポートが必要な場合は、お気軽にお声がけください！**

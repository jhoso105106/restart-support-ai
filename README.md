# 再スタート応援AI

50代以上の求職者の再就職・キャリア再開を支援するReactアプリです。Cloudflare Pages FunctionsとWorkers AIを利用し、気分チェックとAI相談の履歴をCloudflare D1へ保存します。

## D1履歴機能

- 気分チェック履歴の保存・取得
- AIキャリア相談履歴の保存・取得
- `/history` での履歴一覧
- 面接履歴API（画面からの保存は後続フェーズ）

認証は使用しません。初回アクセス時にブラウザでランダムUUIDを生成し、`localStorage` の `restart-support-history-user-id` に保存します。APIは `X-User-Id` ヘッダーのUUIDで履歴を分離します。

この方式は認証ではありません。UUIDを知っている利用者からのアクセスは防げず、localStorageを消去すると以前の履歴へアクセスできなくなります。デモには氏名、連絡先、医療情報などの個人情報を入力しないでください。

## 必要環境

- Node.js 20以上
- npm
- Cloudflareアカウント

## インストール

```bash
npm install --legacy-peer-deps
```

## D1の作成

```bash
npx wrangler login
npx wrangler d1 create restart-support-history
```

表示された `database_id` で `wrangler.toml` のプレースホルダーを置き換えてください。

```toml
[[d1_databases]]
binding = "DB"
database_name = "restart-support-history"
database_id = "Cloudflareが発行したID"
migrations_dir = "migrations"
```

## ローカル開発

ローカルD1へmigrationを適用します。

```bash
npm run d1:migrate:local
```

Pages Functionsを含む状態で起動します。

```bash
npm run build
npm run pages:dev
```

WranglerのローカルD1は本番D1と別データです。通常の `npm run dev` はExpress/Viteだけを起動するため、D1 Pages Functionの確認には `npm run pages:dev` を使用してください。

## 本番D1へのmigration

```bash
npm run d1:migrate:remote
```

Cloudflare PagesのPreviewとProductionそれぞれに次のbindingを設定します。

| 種別 | Binding | 対象 |
|---|---|---|
| D1 database | `DB` | `restart-support-history` |
| Workers AI | `AI` | 利用するCloudflareアカウント |

bindingまたはmigrationを変更した後はPagesを再デプロイしてください。

## 履歴API

すべてのリクエストに次のヘッダーが必要です。

```text
X-User-Id: UUID
```

### 取得

```text
GET /api/history?type=all&limit=50
GET /api/history?type=mood&limit=5
GET /api/history?type=counseling&limit=10
GET /api/history?type=interview&limit=50
```

`type` は `all`、`mood`、`counseling`、`interview` のいずれかです。`limit` は最大100件です。

### 気分履歴の保存

```json
{
  "type": "mood",
  "mood": 3,
  "comment": "面接結果を待っていて少し不安"
}
```

### AI相談履歴の保存

```json
{
  "type": "counseling",
  "consultation": "育児との両立支援",
  "advice": "希望する勤務条件を整理してみましょう"
}
```

### 面接履歴の保存

APIのみ先行実装しています。

```json
{
  "type": "interview",
  "items": [
    {
      "question": "これまでの経験を教えてください",
      "answer": "接客業を20年間経験しました",
      "score": 4
    }
  ]
}
```

## 検証

```bash
npm run check
npm run build
npm run test
```

## 既存MySQLとの境界

D1履歴機能は既存のExpress、tRPC、MySQLとは独立しています。今回D1へ保存するのは新規の気分チェック履歴とAI相談履歴です。MySQLの既存データは移行せず、同じ操作を両DBへ二重保存しません。

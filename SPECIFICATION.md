# 再スタート応援AI 仕様書

## 1. 概要

再スタート応援AI（`restart-support-ai`）は、主に50代以上の求職者の再就職・キャリア再開を支援するWebアプリケーションである。ココロナビを起点に、AI面接練習、AI傾聴を使う気分チェック、東京都等の公的情報に基づく相談窓口検索、プロフィール、女性の健康・キャリア支援を提供する。

フロントエンドは React SPA、アプリケーションAPIは Express + tRPC、DBは MySQL + Drizzle ORM を採用している。Cloudflare Pages では、面接質問を生成するための Pages Function と Workers AI を利用する。

## 2. 利用者と権限

| 利用者 | 権限・用途 |
| --- | --- |
| 一般利用者 | 面接練習、記録の登録・閲覧、プロフィール・健康情報の管理 |
| 管理者 | `users.role` が `admin` の利用者。現時点では管理画面・専用APIは未実装 |

アプリケーションAPIは原則として認証済みユーザー向けの tRPC `protectedProcedure` である。認証は OAuth を使用し、セッション情報は Cookie で保持する。

## 3. 画面・ルーティング

| URL | 画面 | 主な機能 |
| --- | --- | --- |
| `/` | ホーム | 各機能への導線 |
| `/interview` | AI面接練習 | 職種に応じた質問生成、回答、フィードバック、練習記録の保存 |
| `/mood` | 気分・こころのサポート | 気分と状況の記録、次の行動提案 |
| `/support` | 支援窓口 | 就労・こころ・労働・地域・リスキリング等の相談資源の検索 |
| `/dashboard` | ココロナビ | アプリの紹介と、面接練習・気分チェック・支援窓口への導線 |
| `/self-pr` | 自己PR支援 | 自己PR作成を支援する画面 |
| `/womens-health` | 女性の健康・キャリア支援 | 月経記録とキャリア支援 |
| `/404` | Not Found | 未定義URLの案内 |

全画面は `ErrorBoundary` で囲まれ、レンダリング例外時は「再試行」で子ツリーを再生成できる。画面遷移時もエラー状態をリセットする。

### 3.1 ココロナビ

ココロナビは、次の情報を表示する軽量な案内画面である。

- アプリの目的と利用対象
- 面接練習、気分チェック、支援窓口案内の説明
- 「面接練習を始める」「気分をチェック」「相談窓口を探す」の3つの導線

利用状況の統計、面接履歴、気分ログ、学習活動の一覧は表示しない。

## 4. 面接練習

### 4.1 利用フロー

1. 利用者が応募職種（必須）と職種の詳細（任意）を入力する。
2. ブラウザから `POST /api/interview/questions` を呼び出す。
3. Pages Function が Workers AI に面接質問を生成させる。
4. 5件の質問を順に表示し、利用者が回答を入力する。
5. 回答に対するフィードバックを表示する。
6. 必要に応じて面接セッションを保存する。

### 4.2 Workers AI 質問生成API

**エンドポイント**

```text
POST /api/interview/questions
Content-Type: application/json
```

**リクエスト**

```json
{
  "jobTitle": "パン屋",
  "jobDescription": "接客、製造補助、早朝勤務あり"
}
```

| フィールド | 必須 | 制約 |
| --- | --- | --- |
| `jobTitle` | はい | 空文字不可、200文字以下 |
| `jobDescription` | いいえ | 6,000文字以下 |

**成功レスポンス**

```json
{
  "questions": [
    {
      "id": 1,
      "question": "質問文",
      "tips": "回答時のポイント"
    }
  ]
}
```

質問数は5件である。質問は経験・スキル・転職理由・新しい環境への適応をバランスよく扱い、50代以上の求職者に配慮した内容とする。

**AIモデル**

```text
@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

**エラー**

| HTTP | コード | 意味 |
| ---: | --- | --- |
| 400 | なし | JSONまたは入力値が不正 |
| 500 | `AI_BINDING_UNAVAILABLE` | `AI` Workers AI binding が未設定または利用不可 |
| 502 | `AI_RUN_FAILED` | `env.AI.run()` の実行失敗。診断中は `detail` に例外詳細を含む |
| 502 | なし | AI応答がJSONまたは期待する質問形式ではない |

クライアントはレスポンスをテキストとして受信してからJSON解析する。したがって、HTMLやプレーンテキストの障害応答を受けても `Unexpected token '<'` を利用者へ露出せず、HTTPステータスを含むエラーを表示する。

### 4.3 面接フィードバック

現在のUIは具体性、強みの伝わりやすさ、経験の活かし方、改善例を表示する。

サーバー側には `interview.generateFeedback` tRPC mutation があり、LLM を使う本実装と開発モードのサンプル応答を備える。現行UIでは `USE_SAMPLE_FEEDBACK = true` のため、フィードバック画面は固定のサンプルフィードバックを表示する。

### 4.4 記録

`interview.saveSession` は質問、回答、フィードバックをJSON文字列として保存する。保存成功時には学習履歴に「面接練習」アクティビティを作成する。

## 5. 気分・こころのサポート

利用者は気分レベル（1〜5）、気分の一言、状況・文脈を入力できる。ブラウザは `POST /api/mood/respond` を呼び出し、Cloudflare Pages Function が Workers AI を用いて短い共感的な応答と次の行動を生成する。

- 危機キーワード（例: 自殺、死、消えたい、自傷）を検知した場合、LLMを呼び出さず、相談先電話番号を含む緊急案内を返す。
- 危機に該当しない場合、Workers AIが共感的な応答と次の行動を提案する。
- 気分が高い場合は面接練習、中程度では相談窓口、低い場合は地域活動、その他は休息を推奨する。
- Pages Functionでの気分チェック結果は、静的Pages環境ではDBへ保存しない。

### 5.1 Workers AI 気分応答API

```text
POST /api/mood/respond
Content-Type: application/json
```

リクエストには `moodLevel`（1〜5）、`situation`（必須、4,000文字以下）、任意の `moodText` と `context` を含める。

危機に該当しない場合は、次の形式で返す。

```json
{
  "crisisDetected": false,
  "aiResponse": "共感的なメッセージ",
  "suggestedAction": "practice_interview"
}
```

`suggestedAction` は `practice_interview`、`consult_window`、`community_activity`、`rest` のいずれかである。入力エラー、AI binding 利用不可、AI応答失敗時は、画面の送信ボタン直下にエラーを表示する。

## 6. 支援窓口・学習・プロフィール

### 6.1 支援窓口

支援窓口データは `client/public/data/support-resources.json` の静的JSONを標準データソースとして取得する。DBと `support.getResources` APIは支援窓口画面のデータソースとして使用しない。

クライアントは次の3条件で相談資源を絞り込む。

| 条件 | 仕様 |
| --- | --- |
| カテゴリ | `employment`、`mental`、`community`、`reskilling` |
| 地域 | 各データの `region` 配列から自動生成するプルダウン。初期値は「全国」 |
| 年齢層 | 「全年齢」「20代以下」「30代」「40代」「50代」「60代以上」。初期値は「全年齢」 |

年齢層が「50代」など「全年齢」以外の場合、選択年齢または「全年齢」を `targetAge` 配列に含む資源を表示する。JSONの `region` に地域を追加すると、コード変更なしで地域プルダウンに表示される。

各資源には、ID、名称、カテゴリ、`region`、説明、住所、電話番号、Webサイト、受付時間、`targetAge`、出典名、出典URLを持たせる。画面には出典リンクを表示する。

### 6.2 学習履歴

学習履歴には活動種別、タイトル、説明、状態、メモ、完了日時を保存する。`learning.getLogs` で取得し、`learning.complete` で完了化する。

### 6.3 プロフィール

プロフィールは初回取得時に自動作成する。自己紹介、希望職種、経験年数、スキル、希望地域、都道府県コードを更新できる。スキルはJSON配列として保存する。

## 7. 女性の健康・キャリア支援

### 7.1 月経記録

開始日、終了日、症状、経血量、気分、メモを登録・取得・更新・削除できる。利用者本人の記録だけを対象とする。

### 7.2 キャリア支援

対象カテゴリは以下である。

- `child_rearing`
- `career_resume`
- `work_life_balance`
- `interview_for_mothers`

カテゴリと任意の文脈を基に、LLMが実用的な助言を生成する。助言は利用者ごとのキャリア支援記録として管理する。

## 8. API構成

### 8.1 tRPC

標準のアプリケーションAPIは `/api/trpc` を起点とする。

| Router | 主な操作 |
| --- | --- |
| `auth` | 現在の利用者取得、ログアウト |
| `interview` | セッション保存・取得、フィードバック生成 |
| `mood` | 気分確認、履歴取得 |
| `support` | 支援資源検索（現在の支援窓口画面は静的JSONを使用） |
| `learning` | 学習履歴取得・完了化 |
| `profile` | プロフィール取得・更新 |
| `femtech` | 月経記録、女性向けキャリア支援 |

### 8.2 Cloudflare Pages Function

以下のFunctionは tRPC と独立した Cloudflare Pages Function である。

| ファイル | ルート | 用途 |
| --- | --- | --- |
| `functions/api/interview/questions.ts` | `POST /api/interview/questions` | 職種に合わせた面接質問の生成 |
| `functions/api/mood/respond.ts` | `POST /api/mood/respond` | 気分チェックへのAI傾聴応答と危機時案内 |

## 9. データモデル

DBは MySQL を使用する。主なテーブルは次のとおり。

| テーブル | 用途 |
| --- | --- |
| `users` | OAuth識別子、氏名、メール、ロール、ログイン日時 |
| `interview_sessions` | 面接質問・回答・フィードバック・メモ |
| `mood_logs` | 気分、状況、AI応答、推奨行動、危機フラグ |
| `support_resources` | 相談窓口・支援サービス用の旧DBテーブル。画面の標準データソースは静的JSON |
| `learning_logs` | 活動履歴と完了状態 |
| `user_profiles` | 希望職種、経験、スキル、希望地域 |
| `menstrual_cycles` | 月経・症状・気分の記録 |
| `womens_career_support` | 女性向けキャリア助言 |

利用者に属するデータは `users.id` を外部キーとして参照し、利用者削除時には関連レコードも削除する。

## 10. 技術構成

| 区分 | 技術 |
| --- | --- |
| UI | React 19, TypeScript, Vite, Tailwind CSS, Radix UI |
| ルーティング | Wouter |
| クライアント状態・通信 | TanStack Query, tRPC, SuperJSON |
| サーバー | Node.js, Express, tRPC |
| DB | MySQL, Drizzle ORM |
| 認証 | OAuth、Cookieセッション |
| AI | Cloudflare Workers AI（面接質問、気分チェック）、既存のLLM抽象化 |
| ホスティング | Cloudflare Pages、Cloudflare Pages Functions |

## 11. Cloudflare Pages 配置

### 11.1 ビルド

```text
npm install --legacy-peer-deps && npm run build
```

ビルド出力は `dist/public` である。

### 11.2 Workers AI binding

Cloudflare Pages プロジェクトの **Settings → Bindings** で、次の binding を設定する。

| 種別 | 名前 | 用途 |
| --- | --- | --- |
| Workers AI | `AI` | 面接質問と気分チェックの生成 |

`AI` は環境変数やシークレットではない。設定変更後は再デプロイが必要である。

### 11.3 環境変数

Workers AI 面接質問生成に新たな環境変数は不要である。既存サーバー機能を利用する場合には、用途に応じて以下を設定する。

| 変数 | 用途 |
| --- | --- |
| `NODE_ENV` | 実行環境 |
| `VITE_APP_ID` | アプリケーションID |
| `DATABASE_URL` | MySQL接続文字列 |
| `JWT_SECRET` | Cookie/セッション署名 |
| `OAUTH_SERVER_URL` | OAuthサーバーURL |
| `OWNER_OPEN_ID` | 所有者のOAuth ID |
| `AZURE_OPENAI_API_KEY` | 既存のAzure OpenAI連携用（任意） |
| `AZURE_OPENAI_ENDPOINT` | 既存のAzure OpenAI連携用（任意） |
| `AZURE_OPENAI_DEPLOYMENT` | 既存のAzure OpenAI連携用（任意） |

## 12. 開発・検証

```bash
npm run check
npm run build
npm run test
```

開発サーバーは `npm run dev` で起動する。

## 13. デザイン方針

画面全体は、公共支援サービスとして分かりやすい配色と操作性を採用する。

- 濃緑のヘッダーと白文字の見出し
- オレンジの主要操作ボタン
- 白いカードと緑系の罫線
- 淡いベージュ背景
- 見出し・フォーム・カードの共通スタイル

ブラウザ翻訳によるReact管理DOMの改変を避けるため、HTMLには `translate="no"` と `notranslate` メタタグを設定する。Productionでは開発用の Manus runtime を注入しない。

## 14. 現在の運用上の注意

- Workers AI の `AI` binding は Preview と Production でそれぞれ設定状態を確認する。
- Cloudflare Function ログのCLI閲覧には Cloudflare APIトークンまたは Wrangler ログインが必要である。
- tRPCを使う各機能は Express/Node サーバー、OAuth、MySQLへの接続を前提とする。Cloudflare Pages上で利用する範囲は、デプロイ形態に応じて別途確認する。

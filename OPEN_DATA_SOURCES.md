# オープンデータ利用状況

## 東京都福祉局「社会福祉施設等一覧（令和7年10月1日時点）」

- データセットID: `t000054d0000000374`
- カタログ: https://catalog.data.metro.tokyo.lg.jp/dataset/t000054d0000000374
- 提供者: 東京都福祉局
- ライセンス: CC BY
- アプリ内データ: `client/public/data/support-resources.json`

### 利用リソース

| リソース | リソースID | 原典CSV | アプリでの用途 |
|---|---|---|---|
| 女性相談センター | `ab7ad866-8b1e-4169-9d03-ca0352211046` | https://www.opendata.metro.tokyo.lg.jp/fukushi/202510-madoguchi_05-zyosei.csv | 女性向け相談先の検索 |
| 精神保健福祉センター | `09f573f7-eef8-4e28-8d02-2ab190523323` | https://www.opendata.metro.tokyo.lg.jp/fukushi/202510-madoguchi_10-seisinhoken.csv | メンタルヘルス相談先の検索 |
| 社会福祉協議会 | `3a087f16-3889-47d8-8c53-fe8d9d52f62d` | https://www.opendata.metro.tokyo.lg.jp/fukushi/202510-6-2-kyougikai.csv | 地域活動・生活相談先の検索 |
| 東京都福祉人材センター | `85fc2701-4825-44db-8f2e-e27d64eeb855` | https://www.opendata.metro.tokyo.lg.jp/fukushi/202510-madoguchi_09-zinzai.csv | 就労・リスキリング支援先の検索 |

## 加工内容

原典CSVの施設名、所在地、電話番号を保持し、アプリで検索できるようカテゴリ、対象地域、対象年齢、説明文を付与しています。全レコードにデータセットID、リソースID、原典CSV、カタログURL、更新日を保持し、支援窓口画面から確認できるようにしています。

更新確認日: 2026-08-16

# P10ER 設計書

## プロジェクト概要
- ポモドーロタイマー兼執事Bot（Slack App）
- 目的：公開リリース・アップデートリリース経験を積む
- 競合無視・経験積みプロジェクト

## リリース方針
- Slack App Directory掲載なし（審査不要）
- Distribution ONで自前インストールページから公開
- 無料・課金なし

## ロードマップ
### Phase 1（初回リリース）
- タイマー機能（/ppコマンド）
- 時間設定
- Slackステータス変更
- タイマー終了通知

### Phase 2（アップデートリリース）
- 執事モード（DM自動返信）
- トマト料理ランダム表示

---

## 技術スタック
| 用途 | 技術 |
|---|---|
| Botバックエンド | Slack Bolt for JS（Node.js） |
| Webページ（インストールページ） | Express（Boltと同居） |
| DB | Railway PostgreSQL |
| ホスティング | Railway（無料枠） |

## アプリ構成
1つのNode.jsアプリで完結

```
p10er/
├── src/
│   ├── app.js              # エントリーポイント（Bolt + Express）
│   ├── commands/
│   │   └── pp.js           # /ppコマンド処理
│   ├── events/
│   │   └── dm.js           # DM自動返信（Phase 2）
│   ├── web/
│   │   ├── install.js      # インストールページ
│   │   └── oauth.js        # OAuthコールバック
│   ├── db/
│   │   └── index.js        # DB操作
│   └── utils/
│       ├── timer.js        # タイマーロジック
│       └── tomato.js       # トマト料理リスト（Phase 2）
├── public/                 # インストールページの静的ファイル
├── .env                    # シークレット（gitignore）
├── .gitignore
└── package.json
```

---

## DB設計

### workspaces テーブル
| カラム | 型 | 内容 |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| team_id | VARCHAR | SlackワークスペースID |
| access_token | VARCHAR | BotトークンOAuth認証で取得 |
| created_at | TIMESTAMP | |

### timers テーブル
| カラム | 型 | 内容 |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| team_id | VARCHAR | ワークスペースID |
| user_id | VARCHAR | タイマー起動したユーザーID |
| channel_id | VARCHAR | コマンド実行チャンネル |
| focus_min | INTEGER | 集中時間（分） |
| break_min | INTEGER | 休憩時間（分） |
| started_at | TIMESTAMP | 開始時刻 |
| status | VARCHAR | running / stopped / done |

### user_settings テーブル
| カラム | 型 | 内容 |
|---|---|---|
| id | SERIAL PRIMARY KEY | |
| team_id | VARCHAR | ワークスペースID |
| user_id | VARCHAR | ユーザーID |
| custom_status_text | VARCHAR | /pp setで設定した文言 |

---

## データの流れ

### タイマー開始
```
ユーザー → /pp（または /pp 60）
  → 時間を計算（5:1比率）
  → DBにタイマー保存
  → Slackステータスを🍅に変更
  → 集中時間後に終了通知
  → ステータスを元に戻す
```

### インストール
```
他ユーザー → インストールページ
  → 「Add to Slack」ボタンをクリック
  → Slack OAuth認証
  → コールバックでトークン受け取り
  → DBのworkspacesに保存
  → そのワークスペースで使用可能に
```

### DM自動返信（Phase 2）
```
他ユーザー → タイマー中のユーザーにDM送信
  → Slackイベント受信
  → DBでそのユーザーがrunning状態か確認
  → running → 執事メッセージをランダムで返信
  → それ以外 → 無視
```

---

## コマンド設計
| コマンド | 内容 |
|---|---|
| `/pp` | デフォルト30分（25分集中+5分休憩）開始 |
| `/pp 60` | 総時間指定（5:1比率で自動分割） |
| `/pp stop` | タイマー停止 |
| `/pp status` | 残り時間確認 |
| `/pp set ○○` | ステータス文言をカスタム |

## 時間計算ロジック
```
総時間 × (5/6) = 集中時間
総時間 × (1/6) = 休憩時間

例：30分 → 25分集中・5分休憩
例：60分 → 50分集中・10分休憩
```

---

## Slackステータス
- デフォルト：🍅「逆から読んでもトマト中」
- `/pp set ○○` でカスタム可能
- タイマー終了時に元のステータスに戻す

## タイマー終了通知
```
お疲れ様でした🍅
集中中に○件のメッセージが届いております。ご確認くださいませ。
```

## 執事モード（Phase 2）
- DMのみ反応（グループ・チャンネルは無視）
- トマト料理はランダム表示
```
○○様は25分ごろまでトマトクリームパスタを召し上がっておられます🍅
```

### トマト料理リスト
- トマトクリームパスタ
- カプレーゼ
- トマトリゾット
- ガスパチョ
- トマトブルスケッタ
- シャクシュカ
- トマトスープ
- マルゲリータピザ
- トマトタルタル

---

## 環境変数（.env）
```
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
DATABASE_URL=
PORT=
```

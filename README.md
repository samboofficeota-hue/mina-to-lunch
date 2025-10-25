# みなとランチ - イベント予約サイト

## 📋 プロジェクト概要

「みなとランチ」は、学生・企業・地域の人々が一緒にランチをしながら交流するイベントの予約管理システムです。QRコードからアクセスして、簡単に席を予約できる**Jamstack アーキテクチャ**のWebアプリケーションです。

### アーキテクチャ
- **フロントエンド**: 静的HTML/CSS/JavaScript
- **バックエンド**: Vercel Serverless Functions
- **データベース**: Supabase (PostgreSQL)
- **メール送信**: SendGrid
- **ホスティング**: Vercel

---

## 🚀 クイックスタート

### デプロイ方法

詳細な手順は **[DEPLOYMENT.md](./DEPLOYMENT.md)** を参照してください。

```bash
# 1. リポジトリをクローン
git clone https://github.com/samboofficeota-hue/mina-to-lunch.git
cd mina-to-lunch

# 2. 依存関係をインストール
npm install

# 3. ローカル開発サーバー起動
vercel dev

# 4. ブラウザで開く
# http://localhost:3000
```

### イベント情報
- **イベント名**: みなとランチ (Mina to Lunch in Jindai)
- **日時**: 2024年11月27日(木) 12:00〜13:00
- **会場**: VOYAGE（神奈川大学みなとみらいキャンパス 1階）
- **会費**: 1,000円（選べるランチ付き、学生は自分でランチを用意）
- **定員**: 20名

---

## ✨ 実装済み機能

### 1. 予約フォーム（index.html）
- ✅ レスポンシブなイベント情報表示
- ✅ リアルタイム残席数表示
- ✅ フォームバリデーション
  - 必須項目チェック
  - メールアドレス形式検証
  - リアルタイムエラー表示
- ✅ 予約データの送信（API経由）
- ✅ 定員管理（20名上限）
- ✅ **予約確認メールの自動送信** 🆕
- ✅ 予約完了後の自動遷移

### 2. 予約一覧ページ（reservations.html）
- ✅ 全予約の一覧表示
- ✅ 統計情報の表示（予約数、残席数、キャンセル数）
- ✅ フィルター機能（すべて/確定/キャンセル）
- ✅ 予約詳細モーダル表示
- ✅ レスポンシブデザイン

### 3. キャンセル機能（cancel.html）🆕
- ✅ 予約IDとメールアドレスによる認証
- ✅ キャンセル処理
- ✅ **キャンセル完了メールの自動送信**
- ✅ URL パラメータからの自動入力

### 4. 管理者ダッシュボード（admin.html）🆕
- ✅ パスワード認証
- ✅ 予約一覧の表示（確定/キャンセル別）
- ✅ 統計情報（予約数、残席数、キャンセル数）
- ✅ **CSVエクスポート機能**
- ✅ **JSONエクスポート機能**
- ✅ 印刷機能
- ✅ 予約詳細モーダル

### 5. デザイン
- ✅ モダンで美しいグラデーションデザイン
- ✅ Font Awesome アイコン統合
- ✅ スマートフォン対応（レスポンシブ）
- ✅ アニメーション効果
- ✅ 直感的なUI/UX

---

## 🗂️ ファイル構成

```
mina-to-lunch/
├── public/                        # 静的ファイル
│   ├── index.html                # メイン予約フォーム
│   ├── reservations.html         # 予約一覧ページ
│   ├── cancel.html               # キャンセルページ 🆕
│   ├── admin.html                # 管理者ダッシュボード 🆕
│   ├── css/
│   │   ├── style.css            # メインスタイル
│   │   └── reservations.css     # 予約一覧スタイル
│   └── js/
│       ├── main.js              # 予約フォームロジック
│       ├── reservations.js      # 予約一覧ロジック
│       ├── cancel.js            # キャンセルロジック 🆕
│       └── admin.js             # 管理者ロジック 🆕
├── api/                           # サーバーレス関数 🆕
│   ├── create-reservation.js    # 予約作成API
│   ├── get-reservations.js      # 予約一覧取得API
│   └── cancel-reservation.js    # キャンセルAPI
├── package.json                   # 依存関係 🆕
├── vercel.json                    # Vercel設定 🆕
├── .gitignore                     # Git除外設定 🆕
├── DEPLOYMENT.md                  # デプロイ手順 🆕
└── README.md                      # プロジェクト説明書
```

---

## 🌐 機能的エントリーURI

### メインページ
- **パス**: `/index.html` または `/`
- **機能**: イベント情報表示、予約フォーム
- **パラメータ**: なし

### 予約一覧ページ
- **パス**: `/reservations.html`
- **機能**: 予約者リスト表示、統計情報
- **パラメータ**: なし

---

## 🔌 API エンドポイント

### サーバーレス関数

#### POST /api/create-reservation
予約を作成し、確認メールを送信

**リクエスト**:
```json
{
  "name": "山田太郎",
  "affiliation": "〇〇大学",
  "favorite": "プログラミング",
  "email": "yamada@example.com"
}
```

**レスポンス**:
```json
{
  "success": true,
  "message": "予約が完了しました",
  "reservation": {
    "id": "uuid",
    "name": "山田太郎",
    "email": "yamada@example.com",
    "status": "confirmed",
    "created_at": "2024-10-25T10:00:00Z"
  }
}
```

#### GET /api/get-reservations
予約一覧を取得

**クエリパラメータ**:
- `limit`: 取得件数（デフォルト: 100）
- `sort`: ソート順（例: `-created_at`）
- `status`: ステータスフィルター（`all`, `confirmed`, `cancelled`）

**レスポンス**:
```json
{
  "success": true,
  "data": [...],
  "stats": {
    "total": 15,
    "confirmed": 12,
    "cancelled": 3,
    "remaining": 8
  }
}
```

#### POST /api/cancel-reservation
予約をキャンセルし、通知メールを送信

**リクエスト**:
```json
{
  "reservationId": "uuid",
  "email": "yamada@example.com"
}
```

---

## 💾 データモデル

### reservationsテーブル

| フィールド名 | 型 | 説明 |
|------------|---|------|
| id | text | 予約ID（UUID、自動生成） |
| name | text | 名前（ニックネーム） |
| affiliation | text | 所属（大学名/会社名など） |
| favorite | text | 今の推し（好きなもの） |
| email | text | メールアドレス |
| status | text | ステータス（confirmed/cancelled） |
| reservation_date | datetime | 予約日時 |
| created_at | datetime | 作成日時（自動生成） |
| updated_at | datetime | 更新日時（自動生成） |

---

## 🚀 デプロイ方法

### 推奨: Vercel + Supabase + SendGrid

詳細な手順は **[DEPLOYMENT.md](./DEPLOYMENT.md)** を参照してください。

**簡易手順**:

1. **Supabase**: データベースとテーブルを作成
2. **SendGrid**: APIキーを取得、送信者認証
3. **GitHub**: リポジトリにプッシュ
4. **Vercel**: プロジェクトをインポート、環境変数を設定
5. **デプロイ**: 自動デプロイ完了！

### その他の方法

- Netlify + Supabase + SendGrid
- Cloudflare Pages + Supabase + SendGrid
- AWS Amplify + DynamoDB + SES

※ サーバーレス関数とデータベースが必要です

---

## 📱 QRコード対応

このサイトはQRコードからのアクセスに最適化されています：
- スマートフォンでの表示に完全対応
- タッチ操作に最適化されたUI
- モバイルファーストデザイン

---

## 🔜 今後の拡張案

以下の機能は今後追加可能です：

### 1. 高度な管理機能
- ⬜ 予約の承認/却下フロー
- ⬜ 参加者へのメール一斉送信
- ⬜ QRコード受付システム
- ⬜ リマインドメール自動送信

### 2. 決済機能
- ⬜ Stripe統合（オンライン決済）
- ⬜ 事前決済機能
- ⬜ 領収書発行

### 3. イベント管理
- ⬜ 複数イベント管理
- ⬜ イベントテンプレート
- ⬜ 定期開催イベント対応

### 4. アンケート機能
- ⬜ イベント後のフィードバック
- ⬜ 満足度調査
- ⬜ 次回参加意向調査

### 5. 多言語対応
- ⬜ 英語版ページ
- ⬜ 国際交流イベント対応

---

## 🔄 推奨される次のステップ

### 短期（優先度：高）
1. **メール送信APIの統合**
   - SendGrid、Mailgun、AWS SESなどを使用
   - 予約確認メールの自動送信

2. **予約キャンセル機能**
   - キャンセル専用ページの作成
   - 予約IDによるキャンセル処理

3. **管理者ダッシュボード**
   - 予約状況の可視化
   - 参加者管理

### 中期（優先度：中）
4. **データエクスポート機能**
   - CSVダウンロード機能
   - Excel形式での出力

5. **通知機能の強化**
   - イベント前日のリマインドメール
   - 定員間近の通知

6. **多言語対応**
   - 英語版ページの追加
   - 国際交流イベントへの対応

### 長期（優先度：低）
7. **イベント管理機能**
   - 複数イベントの管理
   - イベントテンプレート機能

8. **アンケート機能**
   - イベント後のフィードバック収集
   - 参加者満足度調査

---

## 🛠️ 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: 
  - カスタムプロパティ（CSS変数）
  - Flexbox/Grid レイアウト
  - アニメーション
- **JavaScript (ES6+)**: 
  - Fetch API
  - async/await
  - DOM操作
- **Font Awesome 6**: アイコンライブラリ
- **Google Fonts (Noto Sans JP)**: 日本語フォント
- **RESTful Table API**: データ永続化

---

## 📝 開発ノート

### バリデーション
- メールアドレスの形式検証
- 必須項目のチェック
- リアルタイムエラー表示

### データ管理
- 定員管理（20名上限）
- 予約ステータス管理（confirmed/cancelled）
- タイムスタンプ自動記録

### UX配慮
- ローディング状態の表示
- エラーメッセージの適切な表示
- 成功時の自動遷移
- レスポンシブデザイン

---

## 📞 サポート

質問や問題がある場合は、プロジェクト管理者にお問い合わせください。

---

## 📄 ライセンス

© 2024 みなとランチ. All rights reserved.

---

**プロジェクト作成日**: 2024年10月24日  
**最終更新日**: 2024年10月24日  
**バージョン**: 1.0.0

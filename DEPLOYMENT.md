# 🚀 みなとランチ - デプロイ手順

このドキュメントでは、みなとランチアプリケーションをGitHub、Vercel、Supabaseにデプロイする手順を説明します。

---

## 📋 事前準備

### 必要なアカウント

1. **GitHub**アカウント
   - URL: https://github.com
   - 無料プラン

2. **Vercel**アカウント
   - URL: https://vercel.com
   - 無料プラン（Hobby）

3. **Supabase**アカウント
   - URL: https://supabase.com
   - 無料プラン

4. **SendGrid**アカウント（メール送信用）
   - URL: https://sendgrid.com
   - 無料プラン: 100通/日

---

## 🗄️ Step 1: Supabase セットアップ

### 1-1. プロジェクト作成

1. [Supabase](https://supabase.com) にログイン
2. 「New Project」をクリック
3. 以下を設定：
   - **Name**: `mina-to-lunch`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)` を選択
   - **Pricing Plan**: `Free` を選択
4. 「Create new project」をクリック

### 1-2. テーブル作成

1. 左メニューから「Table Editor」をクリック
2. 「Create a new table」をクリック
3. 以下を設定：

**テーブル名**: `reservations`

**カラム設定**:

| Column Name | Type | Default Value | Primary | Nullable | Extra |
|------------|------|---------------|---------|----------|-------|
| id | uuid | `gen_random_uuid()` | ✅ | ❌ | - |
| name | text | - | ❌ | ❌ | - |
| affiliation | text | - | ❌ | ❌ | - |
| favorite | text | - | ❌ | ❌ | - |
| email | text | - | ❌ | ❌ | - |
| status | text | `'confirmed'` | ❌ | ❌ | - |
| reservation_date | timestamptz | `now()` | ❌ | ❌ | - |
| cancelled_at | timestamptz | - | ❌ | ✅ | - |
| created_at | timestamptz | `now()` | ❌ | ❌ | - |
| updated_at | timestamptz | `now()` | ❌ | ❌ | - |

4. 「Save」をクリック

### 1-3. RLS (Row Level Security) 設定

デフォルトではRLSが有効になっているため、アクセス許可を設定します。

**オプション1: テスト用（簡単、推奨）**

1. 「Authentication」→「Policies」
2. `reservations` テーブルを選択
3. 「Disable RLS」をクリック（テスト環境のみ）

**オプション2: 本番用（セキュア）**

APIキーを使用して、サーバーレス関数からのみアクセスを許可します。（RLSを有効のまま、Service Role Keyを使用）

### 1-4. APIキーの取得

1. 左メニューから「Settings」→「API」をクリック
2. 以下をコピーして保存：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...`（公開キー）
   - **service_role**: `eyJhbG...`（秘密キー、⚠️ 重要！）

---

## 📧 Step 2: SendGrid セットアップ

### 2-1. アカウント作成

1. [SendGrid](https://sendgrid.com) にサインアップ
2. メールアドレスの認証を完了

### 2-2. API キーの作成

1. 「Settings」→「API Keys」
2. 「Create API Key」をクリック
3. 以下を設定：
   - **API Key Name**: `mina-to-lunch`
   - **API Key Permissions**: `Full Access`
4. 「Create & View」をクリック
5. 表示されたAPIキーをコピー（⚠️ 一度しか表示されません）

### 2-3. 送信者メールアドレスの認証

1. 「Settings」→「Sender Authentication」
2. 「Single Sender Verification」を選択
3. 送信者情報を入力：
   - **From Name**: `みなとランチ`
   - **From Email Address**: あなたのメールアドレス
   - **Reply To**: 同じメールアドレス
4. 認証メールが届くので、リンクをクリック

---

## 🐙 Step 3: GitHub にプッシュ

### 3-1. Gitリポジトリの初期化

```bash
cd /Users/Yoshi/Desktop/CursorでWebアプリ開発/mina-to-lunch

# Gitリポジトリの初期化（まだの場合）
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit: Jamstack architecture with Vercel Functions"
```

### 3-2. GitHubリポジトリに接続

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/samboofficeota-hue/mina-to-lunch.git

# ブランチ名を変更（必要な場合）
git branch -M main

# プッシュ
git push -u origin main
```

---

## ▲ Step 4: Vercel デプロイ

### 4-1. プロジェクトのインポート

1. [Vercel](https://vercel.com) にログイン
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリを連携（初回のみ）
4. `mina-to-lunch` リポジトリを選択
5. 「Import」をクリック

### 4-2. プロジェクト設定

**Build & Development Settings**:

- **Framework Preset**: `Other`
- **Root Directory**: `./` (デフォルト)
- **Build Command**: (空欄)
- **Output Directory**: `public`
- **Install Command**: `npm install`

### 4-3. 環境変数の設定

「Environment Variables」セクションで以下を追加：

| Name | Value | 説明 |
|------|-------|------|
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | SupabaseのProject URL |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | Supabaseの anon public キー |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` | Supabaseの service_role キー（⚠️重要） |
| `SENDGRID_API_KEY` | `SG.xxxxx` | SendGridのAPIキー |
| `SENDGRID_FROM_EMAIL` | `your@email.com` | 送信者メールアドレス |
| `SENDGRID_FROM_NAME` | `みなとランチ` | 送信者名 |
| `EVENT_NAME` | `みなとランチ` | イベント名 |
| `EVENT_DATE` | `2024-11-27` | イベント日付 |
| `EVENT_TIME` | `12:00-13:00` | イベント時間 |
| `EVENT_VENUE` | `VOYAGE（神奈川大学みなとみらいキャンパス 1階）` | 会場 |
| `EVENT_CAPACITY` | `20` | 定員 |
| `ADMIN_PASSWORD` | `your-secure-password` | 管理者パスワード（お好きなものを設定） |

⚠️ **重要**: 
- `SUPABASE_SERVICE_KEY` は絶対に公開しないでください
- `ADMIN_PASSWORD` は強力なパスワードを設定してください

### 4-4. デプロイ実行

1. 「Deploy」をクリック
2. ビルドが完了するまで待つ（1-2分）
3. デプロイ完了後、URLをクリックして確認

---

## ✅ Step 5: 動作確認

### 5-1. 予約フォーム

1. デプロイされたURLにアクセス
2. 残席数が表示されることを確認
3. テスト予約を実行：
   - 名前: テスト太郎
   - 所属: テスト大学
   - 推し: テスト中
   - メール: your-test-email@example.com
4. 予約完了メッセージが表示されることを確認
5. 確認メールが届くことを確認

### 5-2. 予約一覧

1. 「予約一覧を見る」をクリック
2. 先ほどの予約が表示されることを確認
3. 統計情報が正しく表示されることを確認

### 5-3. キャンセル機能

1. 確認メールのキャンセルリンクをクリック
2. キャンセルフォームが表示されることを確認
3. 予約IDとメールアドレスを入力してキャンセル
4. キャンセル完了メールが届くことを確認

### 5-4. 管理者ダッシュボード

1. トップページの「管理者」ボタンをクリック
2. パスワードを入力してログイン
3. 予約一覧が表示されることを確認
4. CSVエクスポートが動作することを確認

---

## 🔧 Step 6: カスタムドメイン設定（オプション）

### 6-1. Vercelでドメイン追加

1. Vercelのプロジェクト設定を開く
2. 「Domains」タブをクリック
3. 「Add」をクリックして独自ドメインを入力
4. DNSレコードを設定（指示に従う）

### 6-2. SendGridのドメイン認証（推奨）

1. SendGridで「Sender Authentication」→「Authenticate Your Domain」
2. ドメインプロバイダーでDNS設定を追加

---

## 🐛 トラブルシューティング

### エラー: "Failed to fetch"

**原因**: APIエンドポイントにアクセスできない

**解決策**:
1. Vercelのデプロイログを確認
2. 環境変数が正しく設定されているか確認
3. SupabaseのURLが正しいか確認

### エラー: "Supabase client creation failed"

**原因**: Supabase APIキーが無効

**解決策**:
1. Supabaseの「Settings」→「API」で正しいキーをコピー
2. Vercelの環境変数を更新
3. 再デプロイ（Vercelの「Deployments」→「Redeploy」）

### エラー: メールが送信されない

**原因**: SendGrid APIキーが無効 or 送信者認証未完了

**解決策**:
1. SendGridのAPIキーが正しいか確認
2. 送信者メールアドレスが認証されているか確認
3. SendGridのダッシュボードでエラーログを確認

### エラー: 予約が表示されない

**原因**: Supabase RLS (Row Level Security) が有効

**解決策**:
1. Supabaseで `reservations` テーブルのRLSを無効化
2. または、適切なポリシーを設定

---

## 📊 本番運用チェックリスト

- [ ] Supabaseのデータベースが正しく設定されている
- [ ] SendGridの送信者認証が完了している
- [ ] Vercelの環境変数が全て設定されている
- [ ] テスト予約〜キャンセルまで一通り動作確認済み
- [ ] 管理者パスワードを安全に管理している
- [ ] 定員数が正しく設定されている（20名）
- [ ] イベント情報が正しく設定されている
- [ ] バックアップ方法を確認している

---

## 🔄 更新・再デプロイ

コードを更新した場合:

```bash
# 変更をコミット
git add .
git commit -m "Update: 機能追加"

# GitHubにプッシュ
git push origin main

# ↑ Vercelが自動的に再デプロイします
```

環境変数を更新した場合:

1. Vercelのプロジェクト設定を開く
2. 「Environment Variables」で値を更新
3. 「Deployments」→ 最新のデプロイを選択 → 「Redeploy」

---

## 📞 サポート

問題が解決しない場合:

- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **SendGrid**: https://docs.sendgrid.com

---

🎉 **デプロイ完了！**

イベントの成功をお祈りしています！


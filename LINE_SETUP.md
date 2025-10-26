# 📱 LINE通知機能 セットアップガイド

このガイドでは、みなとランチにLINE通知機能を追加する手順を説明します。

---

## 📋 概要

LINE通知機能を有効にすると、以下が可能になります：

- ✅ 予約確認通知をLINEで送信
- ✅ キャンセル通知をLINEで送信
- ✅ ユーザーがLINEで予約確認・キャンセルリンクにアクセス可能
- ✅ LINEチャットボットでの簡易操作（予約確認、キャンセルURL取得など）

---

## 🚀 セットアップ手順

### Step 1: LINE Developers アカウント作成

1. [LINE Developers](https://developers.line.biz/ja/) にアクセス
2. LINEアカウントでログイン
3. 「プロバイダー」を作成（初回のみ）
   - プロバイダー名: `みなとランチ` など任意の名前

---

### Step 2: LINE Official Account（公式アカウント）作成

1. [LINE Official Account Manager](https://manager.line.biz/) にアクセス
2. 「アカウントを作成」をクリック
3. 以下を設定：
   - **アカウント名**: `みなとランチ` （ユーザーに表示される名前）
   - **業種**: `イベント` または `教育`
   - **会社/事業者名**: あなたの組織名
   - **メールアドレス**: 連絡先メールアドレス

4. 利用規約に同意して作成

---

### Step 3: Messaging API チャネル作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. 先ほど作成したプロバイダーを選択
3. 「新規チャネル作成」→「Messaging API」を選択
4. 以下を設定：

| 項目 | 設定値 |
|------|--------|
| チャネル名 | `みなとランチ予約通知` |
| チャネル説明 | `イベント予約の通知を送信` |
| 大業種 | `その他` |
| 小業種 | `その他` |
| メールアドレス | あなたのメールアドレス |

5. 利用規約に同意して「作成」をクリック

---

### Step 4: Channel Access Token の取得

1. 作成したチャネルの「Messaging API設定」タブを開く
2. 「Channel access token」セクションまでスクロール
3. 「発行」ボタンをクリック
4. 表示されたトークンをコピー（後で使用）

```
例: eyJhbGciOiJIUzI1NiJ9...（長い文字列）
```

⚠️ **重要**: このトークンは他人に見せないでください

---

### Step 5: Channel Secret の取得

1. 同じチャネルの「チャネル基本設定」タブを開く
2. 「Channel Secret」をコピー（後で使用）

```
例: 1234567890abcdef1234567890abcdef
```

---

### Step 6: Webhook URL の設定

1. 「Messaging API設定」タブに戻る
2. 「Webhook設定」セクションを見つける
3. 「Webhook URL」に以下を入力：

```
https://YOUR_VERCEL_DOMAIN.vercel.app/api/line-webhook
```

**例**:
```
https://mina-to-lunch.vercel.app/api/line-webhook
```

4. 「検証」ボタンをクリックして接続確認
5. 「Webhookの利用」を **ON** にする

---

### Step 7: 応答メッセージの無効化

1. 「Messaging API設定」タブの「LINE公式アカウント機能」セクション
2. 「応答メッセージ」を **無効** にする
3. 「あいさつメッセージ」は **有効** のままでOK（任意）

これにより、ボットが重複して返信するのを防ぎます。

---

### Step 8: Basic ID の取得

1. 「Messaging API設定」タブの上部
2. 「Basic ID」をコピー（`@` から始まる文字列）

```
例: @123abcde
```

このIDは友だち追加用のリンクに使用します。

---

### Step 9: 環境変数の設定（Vercel）

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. あなたのプロジェクトを選択
3. 「Settings」→「Environment Variables」を開く
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|---|------|
| `LINE_CHANNEL_SECRET` | Step 5で取得したChannel Secret | LINEチャネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | Step 4で取得したChannel Access Token | LINE APIアクセストークン |
| `LINE_BOT_BASIC_ID` | Step 8で取得したBasic ID（@付き） | 友だち追加用ID |

**設定方法**:
```
Name: LINE_CHANNEL_SECRET
Value: 1234567890abcdef1234567890abcdef

Name: LINE_CHANNEL_ACCESS_TOKEN
Value: eyJhbGciOiJIUzI1NiJ9...

Name: LINE_BOT_BASIC_ID
Value: @123abcde
```

5. 各環境変数の「Add」をクリック
6. すべて追加したら「Save」

---

### Step 10: コードの更新

1. `public/js/main.js` を開く
2. 以下の行を見つける：

```javascript
const LINE_BOT_BASIC_ID = '@YOUR_LINE_BOT_ID'; // TODO: LINE Bot IDを設定
```

3. `@YOUR_LINE_BOT_ID` をStep 8で取得したBasic IDに置き換える：

```javascript
const LINE_BOT_BASIC_ID = '@123abcde'; // あなたのBasic ID
```

4. 変更をコミット&プッシュ：

```bash
git add public/js/main.js
git commit -m "Update LINE Bot Basic ID"
git push
```

---

### Step 11: Supabase データベースの更新

LINE User IDを保存するために、テーブルにカラムを追加します。

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. 左メニューから「Table Editor」を選択
4. `reservations` テーブルを開く
5. 右上の「+ New Column」をクリック
6. 以下を設定：

| 項目 | 設定値 |
|------|--------|
| Name | `line_user_id` |
| Type | `text` |
| Default Value | `NULL` |
| Is Nullable | ✅ チェック |

7. 「Save」をクリック

**または、SQLエディタで実行**:

```sql
ALTER TABLE reservations ADD COLUMN line_user_id TEXT;
```

---

### Step 12: デプロイ

1. 変更をGitHubにプッシュ（自動デプロイされます）

```bash
git add .
git commit -m "Add LINE notification feature"
git push
```

2. Vercelで自動デプロイが完了するのを待つ（1〜2分）

---

### Step 13: 動作確認

#### 1. LINE公式アカウントを友だち追加

1. スマートフォンでLINEアプリを開く
2. QRコードリーダーを起動
3. LINE Official Account ManagerまたはMessaging API設定画面のQRコードをスキャン
4. 「追加」をタップ
5. ウェルカムメッセージが届くことを確認

#### 2. 予約フロー確認

1. 予約フォーム（https://YOUR_DOMAIN.vercel.app）にアクセス
2. 「LINE公式アカウントを友だち追加」ボタンをクリック
3. 友だち追加（既に追加済みならスキップ）
4. 予約フォームに戻る
5. 必要事項を入力して予約
6. LINEに予約確認通知が届くことを確認 ✅

#### 3. チャットボット確認

LINEで以下のメッセージを送信してみる：

| メッセージ | 期待される応答 |
|-----------|--------------|
| `予約` | 予約ページのURLが返信される |
| `確認` | 予約情報が表示される（予約済みの場合） |
| `キャンセル` | キャンセルページのURLが返信される |
| その他 | ヘルプメッセージが返信される |

---

## 🎨 リッチメニューの設定（オプション）

より使いやすくするために、リッチメニューを設定できます。

### 設定手順

1. [LINE Official Account Manager](https://manager.line.biz/) にアクセス
2. アカウントを選択
3. 左メニューから「リッチメニュー」を選択
4. 「作成」をクリック
5. 以下のようなメニューを作成：

```
┌─────────┬─────────┐
│  予約   │  確認   │
│ Booking │  Check  │
├─────────┼─────────┤
│キャンセル│ヘルプ   │
│ Cancel  │  Help   │
└─────────┴─────────┘
```

**各ボタンのアクション**:
- **予約**: テキスト送信「予約」
- **確認**: テキスト送信「確認」
- **キャンセル**: テキスト送信「キャンセル」
- **ヘルプ**: テキスト送信「ヘルプ」

---

## 🔍 トラブルシューティング

### 1. LINE通知が届かない

**原因と対処法**:

- ❌ **環境変数が正しく設定されていない**
  - Vercelの環境変数を再確認
  - デプロイ後に環境変数を追加した場合は再デプロイ

- ❌ **友だち追加していない**
  - ユーザーが事前にLINE公式アカウントを友だち追加する必要がある

- ❌ **LINE User IDが保存されていない**
  - ブラウザのコンソールで `sessionStorage.getItem('line_user_id')` を確認
  - Supabaseのテーブルで `line_user_id` カラムが存在するか確認

### 2. Webhookエラー

**原因と対処法**:

- ❌ **Webhook URLが間違っている**
  - `https://YOUR_DOMAIN.vercel.app/api/line-webhook` が正しいか確認

- ❌ **APIファイルがデプロイされていない**
  - `api/line-webhook.js` が存在するか確認
  - GitHubリポジトリにプッシュされているか確認

### 3. チャットボットが反応しない

**原因と対処法**:

- ❌ **応答メッセージが有効になっている**
  - LINE Official Account Managerで「応答メッセージ」を無効化

- ❌ **Webhook URLが無効**
  - Messaging API設定で「Webhookの利用」がONか確認
  - Webhook URLが正しいか確認

---

## 📊 動作フロー図

```
【予約時】
ユーザー
  ↓
LINE友だち追加（オプション）
  ↓
予約フォーム入力
  ↓
予約API (/api/create-reservation)
  ↓
├─ Supabaseに保存（line_user_idを含む）
├─ LINE通知送信（sendLineNotification）
└─ メール送信（Resend）
  ↓
ユーザーのLINEに通知 🎉


【チャットボット】
ユーザーがLINEメッセージ送信
  ↓
LINE Webhook (/api/line-webhook)
  ↓
メッセージ内容を解析
  ↓
├─「予約」→ 予約URLを返信
├─「確認」→ Supabaseから予約検索 → 予約情報を返信
├─「キャンセル」→ キャンセルURLを返信
└─ その他 → ヘルプメッセージを返信
  ↓
ユーザーのLINEに返信 💬
```

---

## 🔐 セキュリティ注意事項

1. **トークンの管理**
   - Channel Access TokenとChannel Secretは絶対に公開しない
   - GitHubにコミットしない（環境変数で管理）
   - 定期的に再生成することを推奨

2. **Webhook署名検証**
   - 現在のコードではシンプルのため署名検証を省略していますが、本番環境では実装を推奨
   - `@line/bot-sdk` の `middleware` 機能を使用

3. **アクセス制限**
   - LINE User IDは個人情報として適切に管理
   - データベースのアクセス権限を適切に設定

---

## 📚 参考リンク

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [LINE Bot SDK for Node.js](https://github.com/line/line-bot-sdk-nodejs)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)
- [LINE Official Account Manager](https://manager.line.biz/)

---

## 💡 今後の拡張案

- リマインド通知（イベント前日に自動送信）
- QRコード受付システム（LINE経由）
- イベント後のフィードバック収集
- 画像・スタンプの送信
- リッチメニューの詳細カスタマイズ

---

## ❓ よくある質問

### Q1: LINE通知とメール通知、どちらが優先されますか？

A: 両方送信されます。LINE連携済みの場合はLINE通知とメール通知の両方が届きます。

### Q2: ユーザーがLINEをブロックしたらどうなりますか？

A: LINE通知は届きませんが、メール通知は届きます。システム側ではエラーログに記録されますが、予約自体は成功します。

### Q3: LINE公式アカウントの料金は？

A: メッセージ送信数に応じて課金されます：
- フリープラン: 月200通まで無料
- ライトプラン: 月5,000通まで 5,000円
- スタンダードプラン: 月30,000通まで 15,000円

小規模イベントならフリープランで十分です。

### Q4: 複数のイベントで同じLINE公式アカウントを使えますか？

A: はい。同じアカウントを複数イベントで使用できます。メッセージ内容でイベントを識別できます。

---

**セットアップに関するご質問は、プロジェクト管理者までお問い合わせください。**


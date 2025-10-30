# 🔧 LINE通知機能 クイックセットアップ

## 🚨 重要な設定（Vercel環境変数）

LINEログインとLINE通知機能を動作させるために、以下の環境変数をVercelに設定する必要があります。

### 1. Vercelで環境変数を設定

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクト `mina-to-lunch` を選択
3. **Settings** → **Environment Variables** を開く
4. 以下の環境変数を追加：

#### 必須の環境変数

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `LINE_CHANNEL_ID` | LINE Login用チャネルID | LINE Developers Console |
| `LINE_CHANNEL_SECRET` | LINEチャネルシークレット | LINE Developers Console |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE APIアクセストークン | LINE Developers Console |
| `LINE_LOGIN_REDIRECT_URI` | LINE LoginコールバックURL | 固定値 |

#### 設定値

```env
LINE_CHANNEL_ID=あなたのChannel ID
LINE_CHANNEL_SECRET=あなたのChannel Secret
LINE_CHANNEL_ACCESS_TOKEN=あなたのChannel Access Token
LINE_LOGIN_REDIRECT_URI=https://mina-to-lunch.vercel.app/api/line-login-callback
```

### 2. LINE Developers Consoleでの設定

#### Channel IDの取得

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダーを選択
3. **Messaging API** チャネルを選択
4. **チャネル基本設定**タブを開く
5. **Channel ID** をコピー（これを `LINE_CHANNEL_ID` に設定）

#### Channel Secretの取得

1. 同じチャネルの **Messaging API設定** タブを開く
2. **チャネルシークレット** をコピー（これを `LINE_CHANNEL_SECRET` に設定）

#### Channel Access Tokenの取得

1. **Messaging API設定** タブを開く
2. **Channel access token** セクションの **発行** ボタンをクリック
3. 表示されたトークンをコピー（これを `LINE_CHANNEL_ACCESS_TOKEN` に設定）

#### LINE Login設定

1. **LINEログイン設定** タブを開く
2. **ウェブアプリでLINEログインを利用する** を **ON** にする
3. **コールバックURL** に以下を設定：
   ```
   https://mina-to-lunch.vercel.app/api/line-login-callback
   ```
4. **テスター追加**（開発中ステータスの場合）
   - チャネルが「開発中」の場合、ログイン可能なユーザーをテスターとして追加する必要があります
   - 「テスター」セクションで **テスター追加** をクリック
   - LINE IDを入力するか、QRコードをスキャンして追加
   - ⚠️ **重要**: テスターとして登録されていないユーザーはログインできません
5. **更新** ボタンをクリック

#### Webhook設定

1. **Messaging API設定** タブを開く
2. **Webhook設定** セクションで、**Webhook URL** に以下を設定：
   ```
   https://mina-to-lunch.vercel.app/api/line-webhook
   ```
3. **検証** ボタンをクリックして接続確認
4. **Webhookの利用** を **ON** にする

#### 応答メッセージの無効化

1. **Messaging API設定** タブの **LINE公式アカウント機能** セクション
2. **応答メッセージ** を **無効** にする

### 3. Supabaseデータベースの設定

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Table Editor** を開く
4. `reservations` テーブルを開く
5. **New Column** をクリック
6. 以下を設定：
   - **Name**: `line_user_id`
   - **Type**: `text`
   - **Is Nullable**: ✅ チェック

### 4. 環境変数の設定確認

デプロイ後、以下のURLで環境変数の設定状況を確認できます：

```
https://mina-to-lunch.vercel.app/api/debug-env
```

### 5. 動作確認

1. **LINE公式アカウントを友だち追加**する
2. トップページで **LINEでログイン** をクリック
3. LINE認証を完了
4. 予約フォームに情報を入力して送信
5. **LINEに予約確認通知が届く**ことを確認 ✅

---

## 🔍 トラブルシューティング

### 400 Bad Request エラー - "This channel is now developing status"

**原因**: LINEログインチャネルが「開発中」ステータスで、ログインしようとしているユーザーがテスターとして登録されていない

**解決方法**:
1. **LINE Developers Console** で「みなとランチ (ログイン)」チャネルを開く
2. **LINEログイン設定** タブを開く
3. **テスター** セクションまでスクロール
4. **テスター追加** をクリック
5. ログインしたい **LINEユーザーのLINE ID** または **QRコード** をスキャンして追加
6. 追加後、再度LINEログインを試す

**重要**: 開発中ステータスのチャネルでは、テスターとして登録されたユーザーしかログインできません。

### 400 Bad Request エラー - "トークン取得に失敗しました"

**原因**: LINE Loginのトークン交換時にエラーが発生

**確認・解決方法**:

1. **Redirect URIの一致を確認**
   - LINE Developers Console → ログインチャネル → **LINEログイン設定**
   - **コールバックURL** が以下と完全一致しているか確認：
     ```
     https://mina-to-lunch.vercel.app/api/line-login-callback
     ```
   - ⚠️ 末尾のスラッシュや余分な文字がないか確認

2. **Channel IDの確認**
   - Vercelの環境変数で `LINE_CHANNEL_ID` を確認
   - LINE Developers Consoleで**ログインチャネル**（「みなとランチ (ログイン)」）のChannel IDと一致しているか確認
   - **Messaging APIチャネル**のIDではなく、**ログインチャネル**のIDを使用

3. **Channel Secretの確認**
   - LINE Loginチャネルには通常、チャネルシークレットがありません
   - もしLINE Loginチャネルにシークレットがない場合、`LINE_CHANNEL_SECRET`環境変数は空にしてください
   - または、Messaging APIチャネルと統合されている場合は、Messaging APIチャネルのSecretを使用

4. **Vercelログで詳細エラーを確認**
   - Vercelのログに `[line-login-callback] トークン取得エラー詳細:` が出力されます
   - `error_description` の内容を確認して、具体的なエラー原因を特定

5. **環境変数を再設定して再デプロイ**

### LINE通知が届かない

**原因**: LINE User IDが保存されていない

**確認方法**:
1. ブラウザのコンソールで `sessionStorage.getItem('line_user_id')` を確認
2. Vercelのログで LINE User ID の送信状況を確認
3. LINEログインが完了しているか確認

### LINE通知が届かない（友だち追加していない）

**原因**: LINE公式アカウントを友だち追加していない

**解決方法**:
1. LINE Official Account ManagerでQRコードを取得
2. QRコードを読み取って友だち追加
3. 再度予約をテスト

---

## 📞 サポート

設定に関するご質問は、プロジェクト管理者にお問い合わせください。


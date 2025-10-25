/**
 * 管理者パスワード認証API
 * Vercelの環境変数 ADMIN_PASSWORD と照合
 */

export default async function handler(req, res) {
    // CORSヘッダーの設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = req.body;

        // パスワードが送信されているか確認
        if (!password) {
            return res.status(400).json({ 
                success: false, 
                message: 'パスワードを入力してください' 
            });
        }

        // 環境変数と照合
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            console.error('ADMIN_PASSWORD environment variable is not set');
            return res.status(500).json({ 
                success: false, 
                message: 'サーバー設定エラー' 
            });
        }

        // パスワード照合
        if (password === adminPassword) {
            return res.status(200).json({ 
                success: true, 
                message: '認証成功' 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'パスワードが正しくありません' 
            });
        }

    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({ 
            success: false, 
            message: '認証処理に失敗しました' 
        });
    }
}


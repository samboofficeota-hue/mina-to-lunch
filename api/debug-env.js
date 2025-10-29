/**
 * 環境変数のデバッグ用API
 * 本番環境では使用しないでください
 */

export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GETメソッドのみ許可
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'このエンドポイントはGETメソッドのみ対応しています'
        });
    }

    // 本番環境では無効化
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'このAPIは本番環境では使用できません'
        });
    }

    try {
        const envCheck = {
            // Supabase設定
            SUPABASE_URL: !!process.env.SUPABASE_URL,
            SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
            
            // Resend設定
            RESEND_API_KEY: !!process.env.RESEND_API_KEY,
            RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
            
            // LINE設定
            LINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
            LINE_CHANNEL_ACCESS_TOKEN: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            LINE_CHANNEL_ID: !!process.env.LINE_CHANNEL_ID,
            LINE_LOGIN_REDIRECT_URI: !!process.env.LINE_LOGIN_REDIRECT_URI,
            
            // その他
            ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
            EVENT_CAPACITY: process.env.EVENT_CAPACITY || '20',
            VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000',
            NODE_ENV: process.env.NODE_ENV || 'development'
        };

        // 値の一部を表示（セキュリティのため一部のみ）
        const envValues = {
            RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
            LINE_CHANNEL_ID: process.env.LINE_CHANNEL_ID,
            LINE_LOGIN_REDIRECT_URI: process.env.LINE_LOGIN_REDIRECT_URI,
            EVENT_CAPACITY: process.env.EVENT_CAPACITY || '20',
            VERCEL_URL: process.env.VERCEL_URL || 'localhost:3000',
            NODE_ENV: process.env.NODE_ENV || 'development'
        };

        return res.status(200).json({
            success: true,
            message: '環境変数の設定状況',
            envCheck,
            envValues,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('環境変数チェックエラー:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: '環境変数のチェック中にエラーが発生しました',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
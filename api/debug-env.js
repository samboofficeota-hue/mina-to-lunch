// デバッグ用エンドポイント - 環境変数の状態を確認
export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        try {
            // 環境変数の存在確認（値は表示しない）
            const envStatus = {
                LINE_CHANNEL_ID: !!process.env.LINE_CHANNEL_ID,
                LINE_CHANNEL_SECRET: !!process.env.LINE_CHANNEL_SECRET,
                LINE_CHANNEL_ACCESS_TOKEN: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
                LINE_LOGIN_REDIRECT_URI: !!process.env.LINE_LOGIN_REDIRECT_URI,
                VERCEL_URL: !!process.env.VERCEL_URL,
                SUPABASE_URL: !!process.env.SUPABASE_URL,
                SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
            };
            
            // デバッグ情報
            const debugInfo = {
                environment: process.env.NODE_ENV || 'development',
                vercelUrl: process.env.VERCEL_URL || 'localhost:3000',
                redirectUri: process.env.LINE_LOGIN_REDIRECT_URI || 
                    `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/line-login-callback`,
                envStatus
            };
            
            return res.status(200).json({
                success: true,
                debug: debugInfo,
                message: '環境変数の状態を確認しました'
            });
            
        } catch (error) {
            console.error('デバッグ情報取得エラー:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

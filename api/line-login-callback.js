import { handleLineLoginCallback } from './line-login.js';

console.log('[line-login-callback] Starting initialization...');

// Vercel Serverless Function用のエクスポート
export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method === 'GET') {
        try {
            const { code, state, error } = req.query;
            
            // エラーチェック
            if (error) {
                console.error('LINE Login エラー:', error);
                return res.redirect(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}?line_login_error=${encodeURIComponent(error)}`);
            }
            
            if (!code || !state) {
                return res.redirect(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}?line_login_error=missing_parameters`);
            }
            
            // LINE Login コールバック処理
            const result = await handleLineLoginCallback(code, state);
            
            if (!result.success) {
                console.error('LINE Login コールバック処理エラー:', result.error);
                return res.redirect(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}?line_login_error=${encodeURIComponent(result.error)}`);
            }
            
            // 成功時はフロントエンドにリダイレクト
            const redirectUrl = new URL(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}`);
            redirectUrl.searchParams.set('line_user_id', result.userId);
            redirectUrl.searchParams.set('line_display_name', result.displayName);
            redirectUrl.searchParams.set('line_picture_url', result.pictureUrl || '');
            redirectUrl.searchParams.set('line_login_success', 'true');
            
            return res.redirect(redirectUrl.toString());
            
        } catch (error) {
            console.error('LINE Login コールバック処理エラー:', error);
            return res.redirect(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}?line_login_error=${encodeURIComponent(error.message)}`);
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

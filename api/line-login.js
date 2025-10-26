import { createClient } from '@supabase/supabase-js';

console.log('[line-login] Starting initialization...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * LINE Login の認証URLを生成
 */
export async function generateLineLoginUrl() {
    const channelId = process.env.LINE_CHANNEL_ID;
    const redirectUri = process.env.LINE_LOGIN_REDIRECT_URI || 
        `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/line-login-callback`;
    
    // 環境変数のチェック
    if (!channelId) {
        throw new Error('LINE_CHANNEL_ID環境変数が設定されていません');
    }
    
    console.log('[line-login] Channel ID:', channelId);
    console.log('[line-login] Redirect URI:', redirectUri);
    
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);
    
    // セッションにstateを保存（簡易実装）
    const sessionData = {
        state,
        nonce,
        timestamp: Date.now()
    };
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: channelId,
        redirect_uri: redirectUri,
        state: state,
        scope: 'profile openid',
        nonce: nonce
    });
    
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
    
    return {
        authUrl,
        state,
        nonce
    };
}

/**
 * LINE Login コールバック処理
 */
export async function handleLineLoginCallback(code, state, nonce) {
    try {
        // 環境変数のチェック
        if (!process.env.LINE_CHANNEL_ID) {
            throw new Error('LINE_CHANNEL_ID環境変数が設定されていません');
        }
        if (!process.env.LINE_CHANNEL_SECRET) {
            throw new Error('LINE_CHANNEL_SECRET環境変数が設定されていません');
        }
        
        const redirectUri = process.env.LINE_LOGIN_REDIRECT_URI || 
            `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/line-login-callback`;
        
        console.log('[line-login-callback] Channel ID:', process.env.LINE_CHANNEL_ID);
        console.log('[line-login-callback] Redirect URI:', redirectUri);
        
        // アクセストークンを取得
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                client_id: process.env.LINE_CHANNEL_ID,
                client_secret: process.env.LINE_CHANNEL_SECRET
            })
        });
        
        if (!tokenResponse.ok) {
            throw new Error('トークン取得に失敗しました');
        }
        
        const tokenData = await tokenResponse.json();
        
        // ユーザープロフィールを取得
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error('プロフィール取得に失敗しました');
        }
        
        const profile = await profileResponse.json();
        
        return {
            success: true,
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token
        };
        
    } catch (error) {
        console.error('LINE Login コールバック処理エラー:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * ランダム文字列生成
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

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
            const { authUrl, state, nonce } = await generateLineLoginUrl();
            
            // セッションにstateを保存（簡易実装）
            // 実際の実装では、Redisやデータベースを使用することを推奨
            res.setHeader('Set-Cookie', `line_login_state=${state}; HttpOnly; Secure; SameSite=Strict; Max-Age=600`);
            
            return res.status(200).json({
                success: true,
                authUrl,
                state,
                nonce
            });
            
        } catch (error) {
            console.error('LINE Login URL生成エラー:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}

import { sendLineNotification } from './send-line-notification.js';

/**
 * LINE通知のテスト用API
 * 開発・テスト環境でのみ使用してください
 */

export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONSリクエスト（プリフライト）への対応
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POSTメソッドのみ許可
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'このエンドポイントはPOSTメソッドのみ対応しています'
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
        const { userId, type, data } = req.body;

        // 入力バリデーション
        if (!userId) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: 'userId は必須です'
            });
        }

        if (!type) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: 'type は必須です'
            });
        }

        // デフォルトデータの設定
        const testData = data || {
            id: 'test-reservation-id',
            name: 'テストユーザー',
            affiliation: 'テスト大学',
            favorite: 'プログラミング',
            email: 'test@example.com'
        };

        console.log('[test-line-notification] テスト通知送信開始:', { userId, type, testData });

        // LINE通知を送信
        const result = await sendLineNotification(userId, type, testData);

        console.log('[test-line-notification] テスト通知結果:', result);

        return res.status(200).json({
            success: true,
            message: 'LINE通知テストが完了しました',
            result,
            testData: {
                userId,
                type,
                data: testData
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('LINE通知テストエラー:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'LINE通知テスト中にエラーが発生しました',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

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

    try {
        // クエリパラメータの取得
        const { 
            limit = 100, 
            sort = '-created_at',
            status 
        } = req.query;

        // クエリビルダー
        let query = supabase
            .from('reservations')
            .select('*');

        // ステータスフィルター
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // ソート
        const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
        const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
        query = query.order(sortField, { ascending: sortOrder === 'asc' });

        // 件数制限
        query = query.limit(parseInt(limit));

        // データ取得
        const { data, error, count } = await query;

        if (error) {
            console.error('予約データ取得エラー:', error);
            throw new Error('予約データの取得に失敗しました');
        }

        // 統計情報の取得
        const { count: totalCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true });

        const { count: confirmedCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed');

        const { count: cancelledCount } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'cancelled');

        // レスポンス
        return res.status(200).json({
            success: true,
            data: data || [],
            stats: {
                total: totalCount || 0,
                confirmed: confirmedCount || 0,
                cancelled: cancelledCount || 0,
                remaining: Math.max(0, 20 - (confirmedCount || 0))
            },
            meta: {
                count: data?.length || 0,
                limit: parseInt(limit),
                sort: sort
            }
        });

    } catch (error) {
        console.error('予約一覧取得エラー:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: '予約一覧の取得中にエラーが発生しました'
        });
    }
}


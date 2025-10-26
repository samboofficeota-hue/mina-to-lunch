import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendLineNotification } from './send-line-notification.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

    try {
        const { reservationId, email } = req.body;

        // 入力バリデーション
        if (!reservationId || !email) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: '予約IDとメールアドレスを入力してください'
            });
        }

        // メールアドレス形式チェック
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: '有効なメールアドレスを入力してください'
            });
        }

        // 予約を検索
        const { data: reservation, error: fetchError } = await supabase
            .from('reservations')
            .select('*')
            .eq('id', reservationId)
            .eq('email', email.trim().toLowerCase())
            .single();

        if (fetchError || !reservation) {
            return res.status(404).json({ 
                error: 'Not found',
                message: '予約が見つかりません。予約IDまたはメールアドレスが正しいか確認してください。'
            });
        }

        // 既にキャンセル済みの場合
        if (reservation.status === 'cancelled') {
            return res.status(400).json({ 
                error: 'Already cancelled',
                message: 'この予約は既にキャンセルされています'
            });
        }

        // 予約をキャンセル状態に更新
        const { data: updatedReservation, error: updateError } = await supabase
            .from('reservations')
            .update({ 
                status: 'cancelled',
                cancelled_at: new Date().toISOString()
            })
            .eq('id', reservationId)
            .select()
            .single();

        if (updateError) {
            console.error('キャンセル更新エラー:', updateError);
            throw new Error('予約のキャンセルに失敗しました');
        }

        // LINE通知を送信（LINE User IDがある場合）
        if (reservation.line_user_id) {
            try {
                console.log('[cancel-reservation] LINE通知を送信中...');
                await sendLineNotification(reservation.line_user_id, 'reservation_cancelled', {
                    id: reservation.id,
                    name: reservation.name,
                    affiliation: reservation.affiliation,
                    favorite: reservation.favorite,
                    email: reservation.email
                });
                console.log('[cancel-reservation] LINE通知送信成功');
            } catch (lineError) {
                console.error('[cancel-reservation] LINE通知送信エラー:', lineError);
                // LINE送信失敗してもエラーにしない
            }
        }

        // キャンセル通知メールを送信
        try {
            const emailContent = {
                from: `Minato Lunch <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: email,
                subject: '【みなとランチ】予約キャンセル完了',
                html: `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #999 0%, #666 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .info-box {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #999;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🍱 みなとランチ</h1>
        <p>予約キャンセル完了</p>
    </div>
    
    <div class="content">
        <p>${reservation.name} 様</p>
        
        <p>以下の予約をキャンセルいたしました。</p>
        
        <div class="info-box">
            <h3>📅 キャンセルされた予約</h3>
            <div style="margin: 10px 0;">
                <strong>イベント:</strong> みなとランチ<br>
                <strong>日時:</strong> 2024年11月27日(木) 12:00〜13:00<br>
                <strong>お名前:</strong> ${reservation.name}<br>
                <strong>予約ID:</strong> ${reservation.id}
            </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">またの機会がございましたら、ぜひご参加ください。</p>
        </div>
        
        <div class="footer">
            <p>ご質問等ございましたら、このメールに返信してください。</p>
        </div>
    </div>
</body>
</html>
                `,
                text: `
【みなとランチ】予約キャンセル完了

${reservation.name} 様

以下の予約をキャンセルいたしました。

━━━━━━━━━━━━━━━━━━━━
📅 キャンセルされた予約
━━━━━━━━━━━━━━━━━━━━
イベント: みなとランチ
日時: 2024年11月27日(木) 12:00〜13:00
お名前: ${reservation.name}
予約ID: ${reservation.id}

またの機会がございましたら、ぜひご参加ください。

ご質問等ございましたら、このメールに返信してください。

────────────────────────
みなとランチ 運営事務局
────────────────────────
                `
            };

            await resend.emails.send(emailContent);
            
        } catch (emailError) {
            // メール送信失敗してもエラーログに記録するのみ
            console.error('キャンセルメール送信エラー:', emailError);
            console.error('詳細:', emailError.response?.body);
        }

        // 成功レスポンス
        return res.status(200).json({
            success: true,
            message: '予約をキャンセルしました',
            reservation: {
                id: updatedReservation.id,
                name: updatedReservation.name,
                status: updatedReservation.status,
                cancelled_at: updatedReservation.cancelled_at
            }
        });

    } catch (error) {
        console.error('キャンセル処理エラー:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'キャンセル処理中にエラーが発生しました。しばらくしてから再度お試しください。'
        });
    }
}


import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendLineNotification } from './send-line-notification.js';

console.log('[create-reservation] Starting initialization...');
console.log('[create-reservation] RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
console.log('[create-reservation] SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('[create-reservation] LINE_CHANNEL_ACCESS_TOKEN exists:', !!process.env.LINE_CHANNEL_ACCESS_TOKEN);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
console.log('[create-reservation] Resend initialized successfully');

const MAX_CAPACITY = parseInt(process.env.EVENT_CAPACITY) || 20;

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
        const { name, affiliation, favorite, email, lineUserId } = req.body;

        // 入力バリデーション
        if (!name || !affiliation || !favorite || !email) {
            return res.status(400).json({ 
                error: 'Validation error',
                message: '必須項目がすべて入力されていません'
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

        // 定員チェック
        const { count, error: countError } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'confirmed');

        if (countError) {
            console.error('定員チェックエラー:', countError);
            throw new Error('定員チェックに失敗しました');
        }

        if (count >= MAX_CAPACITY) {
            return res.status(400).json({ 
                error: 'Capacity exceeded',
                message: '申し訳ございません。定員に達したため予約を受け付けることができません'
            });
        }

        // 予約データを保存
        const reservationData = {
            name: name.trim(),
            affiliation: affiliation.trim(),
            favorite: favorite.trim(),
            email: email.trim().toLowerCase(),
            status: 'confirmed',
            reservation_date: new Date().toISOString()
        };

        // LINE User IDがあれば追加
        if (lineUserId) {
            reservationData.line_user_id = lineUserId;
            console.log('[create-reservation] LINE User ID:', lineUserId);
        } else {
            console.log('[create-reservation] LINE User ID not provided');
        }

        const { data: reservation, error: insertError } = await supabase
            .from('reservations')
            .insert([reservationData])
            .select()
            .single();

        if (insertError) {
            console.error('予約登録エラー:', insertError);
            throw new Error('予約の登録に失敗しました');
        }

        // LINE通知を送信（LINE User IDがある場合）
        if (lineUserId) {
            try {
                console.log('[create-reservation] LINE通知を送信中...');
                console.log('[create-reservation] LINE User ID:', lineUserId);
                console.log('[create-reservation] Reservation data:', {
                    id: reservation.id,
                    name: reservation.name,
                    affiliation: reservation.affiliation,
                    favorite: reservation.favorite,
                    email: reservation.email
                });
                
                const lineResult = await sendLineNotification(lineUserId, 'reservation_confirmed', {
                    id: reservation.id,
                    name: reservation.name,
                    affiliation: reservation.affiliation,
                    favorite: reservation.favorite,
                    email: reservation.email
                });
                
                if (lineResult.success) {
                    console.log('[create-reservation] LINE通知送信成功');
                } else {
                    console.error('[create-reservation] LINE通知送信失敗:', lineResult);
                    
                    // 友だち追加が必要な場合のエラーログ
                    if (lineResult.reason === 'friend_not_added') {
                        console.warn('[create-reservation] LINE公式アカウントが友だち追加されていません。ユーザーに友だち追加を案内してください。');
                    }
                }
            } catch (lineError) {
                console.error('[create-reservation] LINE通知送信エラー:', lineError);
                console.error('[create-reservation] LINE Error details:', {
                    message: lineError.message,
                    stack: lineError.stack
                });
                // LINE送信失敗してもエラーにしない
            }
        } else {
            console.log('[create-reservation] LINE User IDがないため、LINE通知をスキップ');
        }

        // メール送信はLINE通知に統一（一時的にコメントアウト）
        // メールが必要な場合は後で有効化
        /*
        try {
            const emailContent = {
                from: `Minato Lunch <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: email,
                subject: '【みなとランチ】予約確認 - 11月27日(木)',
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            border-left: 4px solid #667eea;
            border-radius: 5px;
        }
        .info-item {
            margin: 10px 0;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .label {
            font-weight: bold;
            color: #667eea;
            display: inline-block;
            min-width: 120px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.9em;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🍱 みなとランチ</h1>
        <p>予約確認</p>
    </div>
    
    <div class="content">
        <p>${name} 様</p>
        
        <p>この度は「みなとランチ」へのお申し込みありがとうございます。<br>
        以下の内容で予約を承りました。</p>
        
        <div class="info-box">
            <h3>📅 イベント詳細</h3>
            <div class="info-item">
                <span class="label">イベント名:</span> みなとランチ
            </div>
            <div class="info-item">
                <span class="label">日時:</span> 2024年11月27日(木) 12:00〜13:00
            </div>
            <div class="info-item">
                <span class="label">会場:</span> VOYAGE（神奈川大学みなとみらいキャンパス 1階）
            </div>
            <div class="info-item">
                <span class="label">会費:</span> 1,000円（選べるランチ付き）<br>
                <small style="color: #666;">※学生の方は自分でランチをご用意ください</small>
            </div>
        </div>
        
        <div class="info-box">
            <h3>👤 ご予約情報</h3>
            <div class="info-item">
                <span class="label">お名前:</span> ${name}
            </div>
            <div class="info-item">
                <span class="label">所属:</span> ${affiliation}
            </div>
            <div class="info-item">
                <span class="label">今の推し:</span> ${favorite}
            </div>
            <div class="info-item">
                <span class="label">メールアドレス:</span> ${email}
            </div>
            <div class="info-item">
                <span class="label">予約ID:</span> <code>${reservation.id}</code>
            </div>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ キャンセルについて</strong><br>
            やむを得ずキャンセルされる場合は、下記のリンクから手続きをお願いいたします。<br>
            <a href="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/cancel.html?id=${reservation.id}&email=${encodeURIComponent(email)}" class="button">
                予約をキャンセルする
            </a>
        </div>
        
        <div class="footer">
            <p>当日お会いできることを楽しみにしております！</p>
            <p style="margin-top: 20px; font-size: 0.85em; color: #999;">
                本メールに心当たりがない場合は、お手数ですが破棄していただきますようお願いいたします。
            </p>
        </div>
    </div>
</body>
</html>
                `,
                text: `
【みなとランチ】予約確認

${name} 様

この度は「みなとランチ」へのお申し込みありがとうございます。
以下の内容で予約を承りました。

━━━━━━━━━━━━━━━━━━━━
📅 イベント詳細
━━━━━━━━━━━━━━━━━━━━
イベント名: みなとランチ
日時: 2024年11月27日(木) 12:00〜13:00
会場: VOYAGE（神奈川大学みなとみらいキャンパス 1階）
会費: 1,000円（選べるランチ付き）
※学生の方は自分でランチをご用意ください

━━━━━━━━━━━━━━━━━━━━
👤 ご予約情報
━━━━━━━━━━━━━━━━━━━━
お名前: ${name}
所属: ${affiliation}
今の推し: ${favorite}
メールアドレス: ${email}
予約ID: ${reservation.id}

━━━━━━━━━━━━━━━━━━━━
⚠️ キャンセルについて
━━━━━━━━━━━━━━━━━━━━
やむを得ずキャンセルされる場合は、このメールに返信するか、
下記URLからキャンセル手続きをお願いいたします。

キャンセルURL: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/cancel.html?id=${reservation.id}&email=${encodeURIComponent(email)}

当日お会いできることを楽しみにしております！

────────────────────────
みなとランチ 運営事務局
────────────────────────
                `
            };

            await resend.emails.send(emailContent);
            
        } catch (emailError) {
            // メール送信失敗してもエラーログに記録するのみ
            // 予約自体は成功しているため、エラーを返さない
            console.error('メール送信エラー:', emailError);
            console.error('詳細:', emailError.response?.body);
        }
        */

        // 成功レスポンス
        return res.status(201).json({
            success: true,
            message: '予約が完了しました',
            reservation: {
                id: reservation.id,
                name: reservation.name,
                email: reservation.email,
                status: reservation.status,
                created_at: reservation.created_at
            }
        });

    } catch (error) {
        console.error('予約処理エラー:', error);
        console.error('エラー詳細:', error.message);
        console.error('スタックトレース:', error.stack);
        return res.status(500).json({
            error: 'Internal server error',
            message: '予約処理中にエラーが発生しました。しばらくしてから再度お試しください。',
            debug: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}


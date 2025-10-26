import { createClient } from '@supabase/supabase-js';
import { Client, middleware } from '@line/bot-sdk';

console.log('[line-webhook] Starting initialization...');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const lineConfig = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const lineClient = new Client(lineConfig);

export default async function handler(req, res) {
    // CORSヘッダー設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Line-Signature');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const events = req.body.events;

        if (!events || events.length === 0) {
            return res.status(200).json({ message: 'No events' });
        }

        // 各イベントを処理
        const results = await Promise.all(
            events.map(event => handleEvent(event))
        );

        return res.status(200).json({ 
            success: true, 
            processed: results.length 
        });

    } catch (error) {
        console.error('Webhook処理エラー:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}

async function handleEvent(event) {
    const userId = event.source.userId;

    // 友だち追加イベント
    if (event.type === 'follow') {
        console.log(`[LINE] 友だち追加: ${userId}`);
        
        // ウェルカムメッセージを送信
        await lineClient.pushMessage(userId, {
            type: 'text',
            text: '🍱 みなとランチへようこそ！\n\nこのLINEアカウントでは、予約の確認通知やキャンセル通知をお送りします。\n\n予約する際は、このLINE公式アカウントと連携してください。'
        });

        return { success: true, type: 'follow' };
    }

    // 友だちブロック解除イベント
    if (event.type === 'unfollow') {
        console.log(`[LINE] ブロック: ${userId}`);
        return { success: true, type: 'unfollow' };
    }

    // メッセージイベント
    if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text.trim();
        const userMessageLower = userMessage.toLowerCase();

        // 予約IDのパターンマッチ（UUID形式）
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidPattern.test(userMessage)) {
            // 予約IDが送信された場合
            const reservationId = userMessage;
            
            // 予約を検索
            const { data: reservation, error: searchError } = await supabase
                .from('reservations')
                .select('*')
                .eq('id', reservationId)
                .single();
            
            if (searchError || !reservation) {
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '予約が見つかりませんでした。\n\n予約IDをもう一度確認してください。'
                });
                return { success: false, type: 'message', action: 'reservation_not_found' };
            }
            
            // 既にキャンセル済み
            if (reservation.status === 'cancelled') {
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: `この予約はキャンセル済みです。\n\n【予約情報】\nお名前: ${reservation.name}\nステータス: キャンセル済み`
                });
                return { success: true, type: 'message', action: 'already_cancelled' };
            }
            
            // LINE User IDを保存
            const { error: updateError } = await supabase
                .from('reservations')
                .update({ line_user_id: userId })
                .eq('id', reservationId);
            
            if (updateError) {
                console.error('LINE User ID保存エラー:', updateError);
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: 'エラーが発生しました。もう一度お試しください。'
                });
                return { success: false, type: 'message', action: 'update_error' };
            }
            
            // 予約確認通知を送信
            const { sendLineNotification } = await import('./send-line-notification.js');
            await sendLineNotification(userId, 'reservation_confirmed', {
                id: reservation.id,
                name: reservation.name,
                affiliation: reservation.affiliation,
                favorite: reservation.favorite,
                email: reservation.email
            });
            
            return { success: true, type: 'message', action: 'reservation_linked' };
        }

        // 「予約」キーワードに反応
        if (userMessageLower.includes('予約') || userMessageLower.includes('よやく')) {
            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: '予約は以下のURLからお願いします！\n\n' + 
                      (process.env.VERCEL_URL 
                          ? `https://${process.env.VERCEL_URL}` 
                          : 'http://localhost:3000')
            });
            return { success: true, type: 'message', action: 'reservation_info' };
        }

        // 「キャンセル」キーワードに反応
        if (userMessageLower.includes('キャンセル') || userMessageLower.includes('きゃんせる')) {
            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'キャンセルは以下のURLからお願いします！\n\n' + 
                      (process.env.VERCEL_URL 
                          ? `https://${process.env.VERCEL_URL}/cancel.html` 
                          : 'http://localhost:3000/cancel.html')
            });
            return { success: true, type: 'message', action: 'cancel_info' };
        }

        // 「確認」キーワードに反応
        if (userMessageLower.includes('確認') || userMessageLower.includes('かくにん')) {
            // ユーザーIDから予約を検索
            const { data: reservations, error } = await supabase
                .from('reservations')
                .select('*')
                .eq('line_user_id', userId)
                .eq('status', 'confirmed')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error('予約検索エラー:', error);
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '予約情報の取得に失敗しました。しばらくしてから再度お試しください。'
                });
                return { success: false, type: 'message', action: 'check_reservation' };
            }

            if (!reservations || reservations.length === 0) {
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '現在、確定済みの予約はありません。\n\n予約する場合は「予約」と送信してください。'
                });
                return { success: true, type: 'message', action: 'no_reservation' };
            }

            const reservation = reservations[0];
            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: `📋 予約情報\n\n` +
                      `お名前: ${reservation.name}\n` +
                      `所属: ${reservation.affiliation}\n` +
                      `今の推し: ${reservation.favorite}\n` +
                      `メール: ${reservation.email}\n` +
                      `予約ID: ${reservation.id}\n\n` +
                      `━━━━━━━━━━━━\n` +
                      `📅 イベント詳細\n` +
                      `日時: 11月27日(木) 12:00〜13:00\n` +
                      `会場: VOYAGE（神奈川大学みなとみらいキャンパス 1階）\n\n` +
                      `キャンセルする場合は「キャンセル」と送信してください。`
            });
            return { success: true, type: 'message', action: 'show_reservation' };
        }

        // デフォルトの応答
        await lineClient.replyMessage(event.replyToken, {
            type: 'text',
            text: 'こんにちは！みなとランチです🍱\n\n' +
                  '以下のメッセージを送信してください：\n' +
                  '・「予約」- 予約ページを表示\n' +
                  '・「確認」- 予約情報を確認\n' +
                  '・「キャンセル」- キャンセルページを表示'
        });
        return { success: true, type: 'message', action: 'help' };
    }

    return { success: true, type: event.type };
}


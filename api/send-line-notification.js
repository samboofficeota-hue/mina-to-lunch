import { Client } from '@line/bot-sdk';

console.log('[send-line-notification] Initializing...');

const lineConfig = {
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
};

const lineClient = new Client(lineConfig);

/**
 * LINE通知を送信するヘルパー関数
 */
export async function sendLineNotification(userId, type, data) {
    console.log('[LINE] sendLineNotification called with:', { userId, type, data });
    
    if (!userId) {
        console.log('[LINE] ユーザーIDがないため通知をスキップ');
        return { success: false, reason: 'no_user_id' };
    }

    // 環境変数のチェック
    if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
        console.error('[LINE] LINE_CHANNEL_ACCESS_TOKEN環境変数が設定されていません');
        return { success: false, reason: 'missing_access_token' };
    }

    if (!process.env.LINE_CHANNEL_SECRET) {
        console.error('[LINE] LINE_CHANNEL_SECRET環境変数が設定されていません');
        return { success: false, reason: 'missing_channel_secret' };
    }

    try {
        let message;

        switch (type) {
            case 'reservation_confirmed':
                console.log('[LINE] 予約確認メッセージを作成中...');
                message = {
                    type: 'flex',
                    altText: '【みなとランチ】予約確認',
                    contents: createReservationConfirmationFlex(data)
                };
                break;

            case 'reservation_cancelled':
                console.log('[LINE] キャンセル完了メッセージを作成中...');
                message = {
                    type: 'flex',
                    altText: '【みなとランチ】キャンセル完了',
                    contents: createCancellationFlex(data)
                };
                break;

            case 'reminder':
                console.log('[LINE] リマインダーメッセージを作成中...');
                message = {
                    type: 'text',
                    text: `🔔 リマインダー\n\n明日は「みなとランチ」の開催日です！\n\n日時: 11月27日(木) 12:00〜13:00\n会場: VOYAGE（神奈川大学みなとみらいキャンパス 1階）\n\nお待ちしております！`
                };
                break;

            default:
                console.error('[LINE] 未知の通知タイプ:', type);
                return { success: false, reason: 'unknown_type' };
        }

        console.log('[LINE] メッセージ送信開始:', { userId, messageType: message.type });
        await lineClient.pushMessage(userId, message);
        console.log(`[LINE] 通知送信成功: ${userId} (${type})`);
        return { success: true };

    } catch (error) {
        console.error('[LINE] 通知送信エラー:', error);
        console.error('[LINE] エラー詳細:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            response: error.response?.data
        });
        return { success: false, error: error.message };
    }
}

/**
 * 予約確認のFlex Message作成
 */
function createReservationConfirmationFlex(data) {
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';

    return {
        type: 'bubble',
        hero: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '🍱',
                    size: '4xl',
                    align: 'center',
                    margin: 'md'
                },
                {
                    type: 'text',
                    text: '予約確認',
                    weight: 'bold',
                    size: 'xl',
                    align: 'center',
                    color: '#ffffff'
                }
            ],
            backgroundColor: '#667eea',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: `${data.name} 様`,
                    weight: 'bold',
                    size: 'lg',
                    margin: 'md'
                },
                {
                    type: 'text',
                    text: 'この度は「みなとランチ」へのお申し込みありがとうございます。',
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    margin: 'md'
                },
                {
                    type: 'separator',
                    margin: 'xl'
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'xl',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '📅 日時',
                                    color: '#667eea',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: '11月27日(木) 12:00〜13:00',
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '📍 会場',
                                    color: '#667eea',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: 'VOYAGE（神奈川大学 1階）',
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '💰 会費',
                                    color: '#667eea',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: '1,000円（ランチ付き）',
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'separator',
                    margin: 'xl'
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'xl',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: 'ご予約情報',
                            weight: 'bold',
                            size: 'md',
                            color: '#667eea'
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'お名前',
                                    color: '#aaaaaa',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: data.name,
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '所属',
                                    color: '#aaaaaa',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: data.affiliation,
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '今の推し',
                                    color: '#aaaaaa',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: data.favorite,
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
                {
                    type: 'button',
                    style: 'primary',
                    height: 'sm',
                    action: {
                        type: 'uri',
                        label: '予約詳細を確認',
                        uri: `${baseUrl}/reservations.html`
                    },
                    color: '#667eea'
                },
                {
                    type: 'button',
                    style: 'link',
                    height: 'sm',
                    action: {
                        type: 'uri',
                        label: 'キャンセルする',
                        uri: `${baseUrl}/cancel.html?id=${data.id}&email=${encodeURIComponent(data.email)}`
                    }
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: '当日お会いできることを楽しみにしております！',
                            wrap: true,
                            color: '#aaaaaa',
                            size: 'xs',
                            align: 'center',
                            margin: 'md'
                        }
                    ]
                }
            ],
            flex: 0
        }
    };
}

/**
 * キャンセル完了のFlex Message作成
 */
function createCancellationFlex(data) {
    return {
        type: 'bubble',
        hero: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: '🔔',
                    size: '4xl',
                    align: 'center',
                    margin: 'md'
                },
                {
                    type: 'text',
                    text: 'キャンセル完了',
                    weight: 'bold',
                    size: 'xl',
                    align: 'center',
                    color: '#ffffff'
                }
            ],
            backgroundColor: '#764ba2',
            paddingAll: '20px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                {
                    type: 'text',
                    text: `${data.name} 様`,
                    weight: 'bold',
                    size: 'lg',
                    margin: 'md'
                },
                {
                    type: 'text',
                    text: '予約のキャンセルを承りました。',
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    margin: 'md'
                },
                {
                    type: 'separator',
                    margin: 'xl'
                },
                {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'xl',
                    spacing: 'sm',
                    contents: [
                        {
                            type: 'text',
                            text: 'キャンセル情報',
                            weight: 'bold',
                            size: 'md',
                            color: '#764ba2'
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: 'お名前',
                                    color: '#aaaaaa',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: data.name,
                                    wrap: true,
                                    color: '#666666',
                                    size: 'sm',
                                    align: 'end'
                                }
                            ]
                        },
                        {
                            type: 'box',
                            layout: 'horizontal',
                            contents: [
                                {
                                    type: 'text',
                                    text: '予約ID',
                                    color: '#aaaaaa',
                                    size: 'sm',
                                    flex: 0
                                },
                                {
                                    type: 'text',
                                    text: data.id,
                                    wrap: true,
                                    color: '#666666',
                                    size: 'xs',
                                    align: 'end'
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'separator',
                    margin: 'xl'
                },
                {
                    type: 'text',
                    text: 'またの機会にお会いできることを楽しみにしております。',
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    margin: 'xl'
                }
            ]
        }
    };
}

// Vercel Serverless Function用のエクスポート（必要に応じて）
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, type, data } = req.body;
        const result = await sendLineNotification(userId, type, data);
        return res.status(200).json(result);
    } catch (error) {
        console.error('通知送信エラー:', error);
        return res.status(500).json({ error: error.message });
    }
}


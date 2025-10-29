// ===== 定数定義 =====
const MAX_CAPACITY = 20;
const TABLE_NAME = 'reservations';

// ===== DOM要素 =====
const form = document.getElementById('reservation-form');
const submitButton = document.getElementById('submit-button');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const remainingSeatsElement = document.getElementById('remaining-seats');
const lineConnectButton = document.getElementById('line-connect-button');
const lineStatus = document.getElementById('line-status');

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadRemainingSeats();
    setupFormValidation();
    setupLineConnect();
    checkLineConnection();
});

// ===== 残席数の取得と表示 =====
async function loadRemainingSeats() {
    try {
        const response = await fetch('/api/get-reservations?limit=100');
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error('予約データの取得に失敗しました');
        }
        
        const remaining = result.stats.remaining || 0;
        
        if (remainingSeatsElement) {
            if (remaining > 0) {
                remainingSeatsElement.textContent = `（残り${remaining}席）`;
                remainingSeatsElement.className = 'seats-info';
            } else {
                remainingSeatsElement.textContent = '（満席）';
                remainingSeatsElement.className = 'seats-info seats-full';
                remainingSeatsElement.style.background = '#FFCDD2';
                remainingSeatsElement.style.color = '#C62828';
                
                // フォームを無効化
                disableForm('申し訳ございません。定員に達したため、現在予約を受け付けておりません。');
            }
        }
        
        return remaining;
    } catch (error) {
        console.error('残席数の取得に失敗しました:', error);
        if (remainingSeatsElement) {
            remainingSeatsElement.textContent = '';
        }
        return MAX_CAPACITY; // エラー時は予約可能とする
    }
}

// ===== LINE連携設定 =====
function setupLineConnect() {
    if (lineConnectButton) {
        lineConnectButton.addEventListener('click', async () => {
            try {
                // LINEログインを開始
                await startLineLogin();
            } catch (error) {
                console.error('LINEログインエラー:', error);
                showError('LINEログインに失敗しました。もう一度お試しください。');
            }
        });
    }
}

// ===== LINEログイン開始 =====
async function startLineLogin() {
    try {
        // LINEログインURLを取得
        const response = await fetch('/api/line-login');
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'LINEログインURLの取得に失敗しました');
        }
        
        // LINEログイン画面に遷移
        window.location.href = result.authUrl;
        
    } catch (error) {
        console.error('LINEログイン開始エラー:', error);
        throw error;
    }
}

// ===== LINE連携状態の確認 =====
function checkLineConnection() {
    // URLパラメータからLINE User IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const lineUserId = urlParams.get('line_user_id');
    const lineDisplayName = urlParams.get('line_display_name');
    const linePictureUrl = urlParams.get('line_picture_url');
    const lineLoginSuccess = urlParams.get('line_login_success');
    const lineLoginError = urlParams.get('line_login_error');
    
    // LINEログインエラーの処理
    if (lineLoginError) {
        showError(`LINEログインに失敗しました: ${decodeURIComponent(lineLoginError)}`);
        // URLパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }
    
    // LINEログイン成功の処理
    if (lineLoginSuccess === 'true' && lineUserId) {
        // LINE User IDをセッションストレージに保存
        sessionStorage.setItem('line_user_id', lineUserId);
        sessionStorage.setItem('line_display_name', lineDisplayName || '');
        sessionStorage.setItem('line_picture_url', linePictureUrl || '');
        
        // フォームに自動入力
        if (lineDisplayName) {
            const nameField = document.getElementById('name');
            if (nameField && !nameField.value) {
                nameField.value = lineDisplayName;
            }
        }
        
        // 成功メッセージ表示
        showSuccess(`🎉 LINEログインが完了しました！<br>こんにちは、<strong>${lineDisplayName}</strong> さん！<br>予約フォームに自動入力されました。`);
        
        // URLパラメータをクリア
        window.history.replaceState({}, document.title, window.location.pathname);
        
        updateLineStatus(true);
        return;
    }
    
    // 既存のLINE User IDを確認
    if (lineUserId) {
        // LINE User IDをセッションストレージに保存
        sessionStorage.setItem('line_user_id', lineUserId);
        updateLineStatus(true);
    } else {
        // セッションストレージから確認
        const storedLineUserId = sessionStorage.getItem('line_user_id');
        if (storedLineUserId) {
            updateLineStatus(true);
        }
    }
}

// ===== LINE連携状態の表示更新 =====
function updateLineStatus(isConnected) {
    const warningSection = document.getElementById('line-not-connected-warning');
    
    if (isConnected && lineStatus && lineConnectButton) {
        lineStatus.style.display = 'block';
        lineConnectButton.style.display = 'none';
        if (warningSection) {
            warningSection.style.display = 'none';
        }
    } else {
        if (warningSection) {
            warningSection.style.display = 'block';
        }
    }
}

// ===== フォームバリデーション設定 =====
function setupFormValidation() {
    // リアルタイムバリデーション
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });
}

// ===== フィールドバリデーション =====
function validateField(field) {
    // 非表示のメールフィールドはスキップ
    if (field.type === 'hidden') {
        return true;
    }

    const value = field.value.trim();
    let isValid = true;
    let errorMsg = '';

    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMsg = 'この項目は必須です';
    }

    if (!isValid) {
        field.classList.add('error');
        field.style.borderColor = '#f44336';
        showFieldError(field, errorMsg);
    } else {
        field.classList.remove('error');
        field.style.borderColor = '';
        removeFieldError(field);
    }

    return isValid;
}

// ===== フィールドエラー表示 =====
function showFieldError(field, message) {
    removeFieldError(field);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = '#f44336';
    errorDiv.style.fontSize = '0.85rem';
    errorDiv.style.marginTop = '4px';
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
}

// ===== フィールドエラー削除 =====
function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// ===== フォーム送信処理 =====
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // メッセージをクリア
    hideMessages();
    
    // フォームバリデーション
    const inputs = form.querySelectorAll('input[required]');
    let isFormValid = true;
    
    inputs.forEach(input => {
        if (!validateField(input)) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showError('入力内容に誤りがあります。赤く表示された項目を確認してください。');
        return;
    }
    
    // 確認チェックボックスの検証
    const attendConfirm = document.getElementById('attend-confirm');
    if (!attendConfirm.checked) {
        showError('出席確認のチェックボックスにチェックを入れてください。');
        return;
    }
    
    // 残席確認
    const remaining = await loadRemainingSeats();
    if (remaining <= 0) {
        showError('申し訳ございません。定員に達したため予約できません。');
        return;
    }
    
    // フォームデータ取得
    const formData = {
        name: document.getElementById('name').value.trim(),
        affiliation: document.getElementById('affiliation').value.trim(),
        favorite: document.getElementById('favorite').value.trim(),
        email: document.getElementById('email').value, // 隠しフィールドの値
        status: 'confirmed',
        reservation_date: new Date().toISOString()
    };
    
    // LINE User IDがあれば追加
    const lineUserId = sessionStorage.getItem('line_user_id');
    if (lineUserId) {
        formData.lineUserId = lineUserId;
        console.log('LINE連携済み予約:', lineUserId);
        console.log('送信データ:', formData);
    } else {
        console.log('LINE未連携での予約');
        console.log('送信データ:', formData);
    }
    
    // 送信ボタンを無効化
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 送信中...';
    
    try {
        // 予約データを送信（API経由）
        const response = await fetch('/api/create-reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '予約の登録に失敗しました');
        }
        
        // 成功メッセージ表示
        const reservationId = result.reservation?.id || '';
        const lineUserId = sessionStorage.getItem('line_user_id');
        
        let successMsg = `🎉 予約が完了しました！<br>
            <strong>${formData.name}</strong> 様、ご予約ありがとうございます。<br><br>`;
        
        if (lineUserId) {
            // LINEログイン済みの場合
            successMsg += `📱 <strong>LINE通知が自動送信されました！</strong><br>
                予約確認通知がLINEに届いているはずです。<br>
                <div style="background: #e8f5e9; padding: 20px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #4CAF50;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #4CAF50;">
                        <i class="fab fa-line"></i> LINE通知完了
                    </p>
                    <p style="margin: 0; font-size: 0.9rem; color: #2E7D32;">
                        ✅ 予約確認通知が自動的にLINEに送信されました<br>
                        ✅ キャンセル時もLINEに通知が届きます<br>
                        ✅ LINEアプリで確認してください
                    </p>
                </div>`;
        } else {
            // LINE未連携の場合
            successMsg += `📱 <strong>予約が完了しました</strong><br>
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">
                        <i class="fab fa-line"></i> LINE通知を受け取るには
                    </p>
                    <p style="margin: 0; font-size: 0.9rem; color: #856404;">
                        ℹ️ LINE通知を受け取るには、次回はLINEログインをお試しください<br>
                        ℹ️ LINE通知では予約確認とキャンセル通知が自動送信されます
                    </p>
                </div>`;
        }
        
        showSuccess(successMsg);
        
        // フォームをリセット
        form.reset();
        
        // 残席数を更新
        await loadRemainingSeats();
        
        // 3秒後に管理者ページに遷移
        setTimeout(() => {
            window.location.href = './admin.html';
        }, 3000);
        
    } catch (error) {
        console.error('予約エラー:', error);
        showError(error.message || '予約の登録中にエラーが発生しました。もう一度お試しください。');
    } finally {
        // 送信ボタンを有効化
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-check-circle"></i> 予約を確定する';
    }
});

// ===== エラーメッセージ表示 =====
function showError(message) {
    errorMessage.innerHTML = message;
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 成功メッセージ表示 =====
function showSuccess(message) {
    successMessage.innerHTML = message;
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== メッセージ非表示 =====
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// ===== フォーム無効化 =====
function disableForm(message) {
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => input.disabled = true);
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-times-circle"></i> 予約受付終了';
    showError(message);
}

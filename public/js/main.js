// ===== 定数定義 =====
const MAX_CAPACITY = 20;
const TABLE_NAME = 'reservations';

// ===== DOM要素 =====
const form = document.getElementById('reservation-form');
const submitButton = document.getElementById('submit-button');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const remainingSeatsElement = document.getElementById('remaining-seats');

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    loadRemainingSeats();
    setupFormValidation();
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
    const value = field.value.trim();
    let isValid = true;
    let errorMsg = '';

    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMsg = 'この項目は必須です';
    } else if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMsg = '有効なメールアドレスを入力してください';
        }
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
        email: document.getElementById('email').value.trim(),
        status: 'confirmed',
        reservation_date: new Date().toISOString()
    };
    
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
        showSuccess(`予約が完了しました！<br>
            <strong>${formData.name}</strong> 様、ご予約ありがとうございます。<br>
            確認メールを <strong>${formData.email}</strong> 宛に送信いたしました。`);
        
        // フォームをリセット
        form.reset();
        
        // 残席数を更新
        await loadRemainingSeats();
        
        // 3秒後に予約一覧ページに遷移
        setTimeout(() => {
            window.location.href = './reservations.html';
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

// ===== DOM要素 =====
const form = document.getElementById('cancel-form');
const submitButton = document.getElementById('submit-button');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const reservationIdInput = document.getElementById('reservation-id');
const emailInput = document.getElementById('email');

// ===== URLパラメータから値を取得 =====
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const email = urlParams.get('email');
    
    if (id) {
        reservationIdInput.value = id;
    }
    
    if (email) {
        emailInput.value = decodeURIComponent(email);
    }

    setupFormValidation();
});

// ===== フォームバリデーション設定 =====
function setupFormValidation() {
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
    const inputs = form.querySelectorAll('input[required]:not([type="checkbox"])');
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
    const cancelConfirm = document.getElementById('cancel-confirm');
    if (!cancelConfirm.checked) {
        showError('キャンセル確認のチェックボックスにチェックを入れてください。');
        return;
    }
    
    // フォームデータ取得
    const formData = {
        reservationId: reservationIdInput.value.trim(),
        email: emailInput.value.trim()
    };
    
    // 送信ボタンを無効化
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> キャンセル中...';
    
    try {
        // キャンセルAPIを呼び出し
        const response = await fetch('/api/cancel-reservation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '予約のキャンセルに失敗しました');
        }
        
        // 成功メッセージ表示
        showSuccess(`予約をキャンセルしました。<br>
            キャンセル確認メールを <strong>${formData.email}</strong> 宛に送信いたしました。<br>
            またの機会をお待ちしております。`);
        
        // フォームをリセット
        form.reset();
        
        // 3秒後にトップページに遷移
        setTimeout(() => {
            window.location.href = './index.html';
        }, 3000);
        
    } catch (error) {
        console.error('キャンセルエラー:', error);
        showError(error.message || '予約のキャンセル中にエラーが発生しました。もう一度お試しください。');
    } finally {
        // 送信ボタンを有効化
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-times-circle"></i> 予約をキャンセルする';
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


// ===== 定数定義 =====
const MAX_CAPACITY = 20;

// ===== DOM要素 =====
const authSection = document.getElementById('auth-section');
const adminDashboard = document.getElementById('admin-dashboard');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const loadingElement = document.getElementById('loading');
const noReservationsElement = document.getElementById('no-reservations');
const reservationsListElement = document.getElementById('reservations-list');
const totalReservationsElement = document.getElementById('total-reservations');
const remainingSeatsElement = document.getElementById('remaining-seats');
const cancelledCountElement = document.getElementById('cancelled-count');
const filterButtons = document.querySelectorAll('.filter-btn');
const detailModal = document.getElementById('detail-modal');
const modalBody = document.getElementById('modal-body');

// ===== 状態管理 =====
let allReservations = [];
let currentFilter = 'all';

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
    // セッションチェック
    if (sessionStorage.getItem('admin_authenticated') === 'true') {
        showDashboard();
    }
});

// ===== 認証処理 =====
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    
    // 簡易認証（本番環境では適切な認証システムを使用）
    // 環境変数 ADMIN_PASSWORD と照合するAPIを作成することも可能
    const validPasswords = ['admin123', 'minatoadmin2024']; // デモ用
    
    if (validPasswords.includes(password)) {
        sessionStorage.setItem('admin_authenticated', 'true');
        showDashboard();
    } else {
        authError.textContent = 'パスワードが正しくありません';
        authError.style.display = 'flex';
    }
});

// ===== ダッシュボード表示 =====
function showDashboard() {
    authSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    loadReservations();
    setupFilterButtons();
}

// ===== ログアウト =====
function logout() {
    sessionStorage.removeItem('admin_authenticated');
    adminDashboard.classList.add('hidden');
    authSection.classList.remove('hidden');
    authForm.reset();
    authError.style.display = 'none';
}

// ===== 予約データの読み込み =====
async function loadReservations() {
    try {
        showLoading();
        
        const response = await fetch('/api/get-reservations?limit=100&sort=-created_at');
        
        if (!response.ok) {
            throw new Error('予約データの取得に失敗しました');
        }
        
        const result = await response.json();
        allReservations = result.data || [];
        
        updateStatistics(result.stats);
        displayReservations();
        
    } catch (error) {
        console.error('予約データ読み込みエラー:', error);
        hideLoading();
        showNoData('データの読み込みに失敗しました');
    }
}

// ===== 統計情報の更新 =====
function updateStatistics(stats) {
    if (totalReservationsElement) {
        totalReservationsElement.textContent = stats.confirmed || 0;
    }
    
    if (remainingSeatsElement) {
        const remaining = stats.remaining || 0;
        remainingSeatsElement.textContent = remaining;
        
        // 残席数に応じて色を変更
        if (remaining === 0) {
            remainingSeatsElement.style.color = '#C62828';
        } else if (remaining <= 5) {
            remainingSeatsElement.style.color = '#F57C00';
        } else {
            remainingSeatsElement.style.color = '#2E7D32';
        }
    }
    
    if (cancelledCountElement) {
        cancelledCountElement.textContent = stats.cancelled || 0;
    }
}

// ===== 予約リストの表示 =====
function displayReservations() {
    hideLoading();
    
    // フィルター適用
    let filteredReservations = allReservations;
    if (currentFilter !== 'all') {
        filteredReservations = allReservations.filter(r => r.status === currentFilter);
    }
    
    if (filteredReservations.length === 0) {
        showNoData('予約がありません');
        return;
    }
    
    // リストをクリア
    reservationsListElement.innerHTML = '';
    noReservationsElement.style.display = 'none';
    
    // 予約カードを生成
    filteredReservations.forEach((reservation, index) => {
        const card = createReservationCard(reservation, index + 1);
        reservationsListElement.appendChild(card);
    });
}

// ===== 予約カードの生成 =====
function createReservationCard(reservation, number) {
    const card = document.createElement('div');
    card.className = `reservation-card ${reservation.status === 'cancelled' ? 'cancelled' : ''}`;
    card.onclick = () => showReservationDetail(reservation);
    
    const statusText = reservation.status === 'confirmed' ? '確定' : 'キャンセル';
    const statusClass = reservation.status === 'confirmed' ? 'confirmed' : 'cancelled';
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-name">
                ${number}. <i class="fas fa-user-circle"></i> ${escapeHtml(reservation.name)}
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div class="card-details">
            <div class="detail-item">
                <i class="fas fa-building"></i>
                <span class="detail-label">所属:</span>
                <span class="detail-value">${escapeHtml(reservation.affiliation)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-heart"></i>
                <span class="detail-label">推し:</span>
                <span class="detail-value">${escapeHtml(reservation.favorite)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-envelope"></i>
                <span class="detail-label">メール:</span>
                <span class="detail-value">${escapeHtml(reservation.email)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span class="detail-label">予約日時:</span>
                <span class="detail-value">${formatDate(reservation.created_at)}</span>
            </div>
        </div>
    `;
    
    return card;
}

// ===== 予約詳細モーダルの表示 =====
function showReservationDetail(reservation) {
    const statusText = reservation.status === 'confirmed' ? '確定' : 'キャンセル済み';
    const statusClass = reservation.status === 'confirmed' ? 'confirmed' : 'cancelled';
    
    modalBody.innerHTML = `
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-info-circle"></i> ステータス</div>
            <div class="modal-detail-value"><span class="status-badge ${statusClass}">${statusText}</span></div>
        </div>
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-user"></i> 名前（ニックネーム）</div>
            <div class="modal-detail-value">${escapeHtml(reservation.name)}</div>
        </div>
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-building"></i> 所属</div>
            <div class="modal-detail-value">${escapeHtml(reservation.affiliation)}</div>
        </div>
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-heart"></i> 今の推し</div>
            <div class="modal-detail-value">${escapeHtml(reservation.favorite)}</div>
        </div>
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-envelope"></i> メールアドレス</div>
            <div class="modal-detail-value">${escapeHtml(reservation.email)}</div>
        </div>
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-calendar-alt"></i> 予約日時</div>
            <div class="modal-detail-value">${formatDate(reservation.created_at)}</div>
        </div>
        ${reservation.cancelled_at ? `
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-ban"></i> キャンセル日時</div>
            <div class="modal-detail-value">${formatDate(reservation.cancelled_at)}</div>
        </div>
        ` : ''}
        <div class="modal-detail-item">
            <div class="modal-detail-label"><i class="fas fa-fingerprint"></i> 予約ID</div>
            <div class="modal-detail-value" style="font-size: 0.9rem; color: #999;">${reservation.id}</div>
        </div>
    `;
    
    detailModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ===== モーダルを閉じる =====
function closeModal() {
    detailModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detailModal.style.display === 'flex') closeModal();
});

// ===== フィルターボタンの設定 =====
function setupFilterButtons() {
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            displayReservations();
        });
    });
}

// ===== CSV エクスポート =====
function exportToCSV() {
    const filteredReservations = currentFilter === 'all' 
        ? allReservations 
        : allReservations.filter(r => r.status === currentFilter);
    
    if (filteredReservations.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    // CSVヘッダー
    const headers = ['予約ID', '名前', '所属', '今の推し', 'メールアドレス', 'ステータス', '予約日時', 'キャンセル日時'];
    
    // CSVデータ
    const rows = filteredReservations.map(r => [
        r.id,
        r.name,
        r.affiliation,
        r.favorite,
        r.email,
        r.status === 'confirmed' ? '確定' : 'キャンセル',
        formatDate(r.created_at),
        r.cancelled_at ? formatDate(r.cancelled_at) : ''
    ]);
    
    // CSV生成
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // BOM付きでダウンロード（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mina-to-lunch-reservations-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== JSON エクスポート =====
function exportToJSON() {
    const filteredReservations = currentFilter === 'all' 
        ? allReservations 
        : allReservations.filter(r => r.status === currentFilter);
    
    if (filteredReservations.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    const jsonContent = JSON.stringify(filteredReservations, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mina-to-lunch-reservations-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== 印刷 =====
function printList() {
    window.print();
}

// ===== ユーティリティ関数 =====

function showLoading() {
    loadingElement.style.display = 'block';
    noReservationsElement.style.display = 'none';
    reservationsListElement.innerHTML = '';
}

function hideLoading() {
    loadingElement.style.display = 'none';
}

function showNoData(message) {
    noReservationsElement.style.display = 'block';
    noReservationsElement.querySelector('p').textContent = message;
    reservationsListElement.innerHTML = '';
}

function formatDate(timestamp) {
    if (!timestamp) return '---';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}


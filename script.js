// スムーズスクロール
function smoothScroll(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// フォーム送信
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const formData = {
        petName: document.getElementById('petName').value,
        petType: document.getElementById('petType').value,
        petAge: document.getElementById('petAge').value,
        size: document.getElementById('size').value,
        background: document.getElementById('background').value,
        requests: document.getElementById('requests').value,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        timestamp: new Date().toLocaleString('ja-JP')
    };

    // フォームデータをコンソールに出力（実装時はサーバーに送信）
    console.log('依頼内容:', formData);

    // メッセージを表示
    const messageDiv = document.getElementById('formMessage');
    messageDiv.style.display = 'block';
    messageDiv.className = 'form-message success';
    messageDiv.innerHTML = `
        <strong>✓ 送信完了！</strong><br>
        ご依頼をお受けしました。メールをご確認ください。<br>
        2営業日以内に担当者からご連絡させていただきます。
    `;

    // フォームをリセット
    this.reset();

    // 5秒後にメッセージを非表示
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
});

// FAQ の Q クリックで答えを表示/非表示
document.querySelectorAll('.faq-question').forEach(question => {
    question.style.cursor = 'pointer';
    question.addEventListener('click', function() {
        const answer = this.nextElementSibling;
        answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
    });
});

// ナビゲーション リンクをクリックしたときに FAQ の答えを非表示にする
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.faq-answer').forEach(answer => {
            answer.style.display = 'none';
        });
    });
});

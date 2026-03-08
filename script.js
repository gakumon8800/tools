const form = document.getElementById('diagnosisForm');
const errorBox = document.getElementById('formError');
const resultSection = document.getElementById('result');
const levelBadge = document.getElementById('levelBadge');
const resultMessage = document.getElementById('resultMessage');
const resultActions = document.getElementById('resultActions');

const levels = [
  {
    min: 12,
    className: 'level-high',
    title: '対応レベル：緊急（高）',
    message:
      '管理会社へ即日で文書連絡し、期限を区切って対応を求める段階です。状況により行政窓口や専門家相談を並行してください。',
    actions: [
      'メール・書面で「不具合内容・発生日・希望対応期限」を明記して送付する',
      '証拠（写真・動画・通話履歴）を時系列で保存する',
      '期限超過時は消費生活センターや住宅相談窓口へ相談する'
    ]
  },
  {
    min: 8,
    className: 'level-mid',
    title: '対応レベル：要フォロー（中）',
    message:
      '管理会社へ具体的な改善依頼を行い、進捗確認を定期的に実施する段階です。連絡記録を残すことで解決率が上がります。',
    actions: [
      '電話だけでなくメールでも同内容を送って記録を残す',
      '改善予定日を確認し、遅延時の再連絡日を決める',
      '症状が悪化した場合は証拠を追加して再度連絡する'
    ]
  },
  {
    min: 0,
    className: 'level-low',
    title: '対応レベル：通常（低）',
    message:
      'まずは管理会社へ通常連絡し、状況を共有する段階です。初動で情報を整理して伝えるとスムーズです。',
    actions: [
      '不具合の発生場所・時間・頻度を簡潔にまとめる',
      '可能なら写真を添付して客観的に伝える',
      '3日以上進展がなければ再連絡して優先度を上げる'
    ]
  }
];

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorBox.textContent = '';

  const formData = new FormData(form);
  const fields = ['impact', 'duration', 'contact', 'risk', 'evidence'];

  const missing = fields.some((field) => !formData.get(field));
  if (missing) {
    errorBox.textContent = 'すべての質問に回答してください。';
    resultSection.classList.add('hidden');
    return;
  }

  const score = fields.reduce((sum, field) => sum + Number(formData.get(field)), 0);
  const selectedLevel = levels.find((level) => score >= level.min);

  levelBadge.className = `badge ${selectedLevel.className}`;
  levelBadge.textContent = `${selectedLevel.title}（スコア: ${score} / 15）`;
  resultMessage.textContent = selectedLevel.message;

  resultActions.innerHTML = '';
  selectedLevel.actions.forEach((action) => {
    const li = document.createElement('li');
    li.textContent = action;
    resultActions.appendChild(li);
  });

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form.addEventListener('reset', () => {
  errorBox.textContent = '';
  resultSection.classList.add('hidden');
});

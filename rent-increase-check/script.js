diff --git a/rent-increase-check/script.js b/rent-increase-check/script.js
new file mode 100644
index 0000000000000000000000000000000000000000..231805a9d9766f48d8f0bd60298604110cb20358
--- /dev/null
+++ b/rent-increase-check/script.js
@@ -0,0 +1,113 @@
+const form = document.getElementById('rentForm');
+const errorText = document.getElementById('errorText');
+const resultSection = document.getElementById('result');
+const validityLevel = document.getElementById('validityLevel');
+const validityMessage = document.getElementById('validityMessage');
+const disputeLevel = document.getElementById('disputeLevel');
+const disputeMessage = document.getElementById('disputeMessage');
+
+const validityMap = {
+  high: {
+    label: '値上げ妥当性：高',
+    className: 'level-high',
+    message: '値上げ理由を説明しやすい条件です。客観資料を添えて合意形成を進めるのが有効です。'
+  },
+  mid: {
+    label: '値上げ妥当性：中',
+    className: 'level-mid',
+    message: '一定の妥当性はありますが、説明不足だと反発を招きやすい状態です。'
+  },
+  low: {
+    label: '値上げ妥当性：低',
+    className: 'level-low',
+    message: '値上げ根拠が弱めです。相場データや費用上昇の再確認をおすすめします。'
+  }
+};
+
+const disputeMap = {
+  high: {
+    label: '紛争リスク：高',
+    className: 'risk-high',
+    message: '認識差が大きく、争いになりやすい状況です。通知内容と根拠を丁寧に整理しましょう。'
+  },
+  mid: {
+    label: '紛争リスク：中',
+    className: 'risk-mid',
+    message: '条件次第で意見が分かれやすい状態です。説明と交渉余地の提示が重要です。'
+  },
+  low: {
+    label: '紛争リスク：低',
+    className: 'risk-low',
+    message: '争いにつながる可能性は比較的低めです。記録を残しつつ進めると安心です。'
+  }
+};
+
+function calcValidityScore(input) {
+  let score = 0;
+  score += Number(input.marketComparison);
+  score += Number(input.costIncrease);
+
+  if (input.yearsSinceRevision >= 5) score += 2;
+  else if (input.yearsSinceRevision >= 2) score += 1;
+
+  if (input.buildingAge <= 10) score += 1;
+  else if (input.buildingAge >= 35) score -= 1;
+
+  return score;
+}
+
+function validityFromScore(score) {
+  if (score >= 5) return validityMap.high;
+  if (score >= 3) return validityMap.mid;
+  return validityMap.low;
+}
+
+function disputeFromValidityScore(score) {
+  if (score <= 1) return disputeMap.high;
+  if (score <= 3) return disputeMap.mid;
+  return disputeMap.low;
+}
+
+form.addEventListener('submit', (event) => {
+  event.preventDefault();
+  errorText.textContent = '';
+
+  const formData = new FormData(form);
+  const currentRent = Number(formData.get('currentRent'));
+  const marketComparison = formData.get('marketComparison');
+  const buildingAge = Number(formData.get('buildingAge'));
+  const yearsSinceRevision = Number(formData.get('yearsSinceRevision'));
+  const costIncrease = formData.get('costIncrease');
+
+  if (
+    currentRent < 10000 ||
+    !marketComparison ||
+    Number.isNaN(buildingAge) ||
+    Number.isNaN(yearsSinceRevision) ||
+    !costIncrease
+  ) {
+    errorText.textContent = 'すべての項目を正しく入力・選択してください。';
+    resultSection.classList.add('hidden');
+    return;
+  }
+
+  const score = calcValidityScore({ marketComparison, costIncrease, yearsSinceRevision, buildingAge });
+  const validity = validityFromScore(score);
+  const disputeRisk = disputeFromValidityScore(score);
+
+  validityLevel.className = `badge ${validity.className}`;
+  validityLevel.textContent = validity.label;
+  validityMessage.textContent = `${validity.message}（現在賃料: ${currentRent.toLocaleString('ja-JP')}円）`;
+
+  disputeLevel.className = `badge ${disputeRisk.className}`;
+  disputeLevel.textContent = disputeRisk.label;
+  disputeMessage.textContent = disputeRisk.message;
+
+  resultSection.classList.remove('hidden');
+  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
+});
+
+form.addEventListener('reset', () => {
+  errorText.textContent = '';
+  resultSection.classList.add('hidden');
+});

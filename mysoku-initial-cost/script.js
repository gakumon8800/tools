const fieldIds = [
  'rent',
  'managementFee',
  'deposit',
  'keyMoney',
  'securityDeposit',
  'amortization',
  'brokerFee',
  'guaranteeFee',
  'fireInsurance',
  'keyExchange',
  'support24',
  'disinfection',
  'adminFee',
  'contractStartDate',
  'freeRentMonths',
  'renewalFee',
  'shortTermPenalty',
  'notes'
];

const amountFieldIds = [
  'rent',
  'managementFee',
  'deposit',
  'keyMoney',
  'securityDeposit',
  'amortization',
  'brokerFee',
  'guaranteeFee',
  'fireInsurance',
  'keyExchange',
  'support24',
  'disinfection',
  'adminFee',
  'renewalFee'
];

const keywordRules = [
  { key: 'rent', patterns: ['賃料', '家賃'], type: 'amount' },
  { key: 'managementFee', patterns: ['管理費', '共益費'], type: 'amount' },
  { key: 'deposit', patterns: ['敷金'], type: 'amount' },
  { key: 'keyMoney', patterns: ['礼金'], type: 'amount' },
  { key: 'securityDeposit', patterns: ['保証金'], type: 'amount' },
  { key: 'amortization', patterns: ['償却'], type: 'amount' },
  { key: 'brokerFee', patterns: ['仲介手数料'], type: 'amount' },
  { key: 'guaranteeFee', patterns: ['保証会社', '初回保証料', '保証料'], type: 'amount' },
  { key: 'fireInsurance', patterns: ['火災保険', '保険料'], type: 'amount' },
  { key: 'keyExchange', patterns: ['鍵交換'], type: 'amount' },
  { key: 'support24', patterns: ['24時間', 'サポート', '安心入居'], type: 'amount' },
  { key: 'disinfection', patterns: ['消毒', '抗菌'], type: 'amount' },
  { key: 'adminFee', patterns: ['事務手数料'], type: 'amount' },
  { key: 'renewalFee', patterns: ['更新料'], type: 'amount' },
  { key: 'shortTermPenalty', patterns: ['短期解約違約金'], type: 'flag', value: 'yes' },
  { key: 'freeRentMonths', patterns: ['フリーレント'], type: 'months' }
];

const warningMatchers = [
  { id: 'shortPenalty', label: '短期解約違約金あり', test: (ctx) => ctx.shortTermPenalty === 'yes' || containsAny(ctx.sourceText, ['短期解約違約金']) },
  { id: 'renewalFee', label: '更新料あり', test: (ctx) => ctx.renewalFee > 0 || containsAny(ctx.sourceText, ['更新料']) },
  { id: 'cleaningFee', label: '退去時クリーニング費あり', test: (ctx) => containsAny(ctx.sourceText, ['クリーニング', '清掃費', 'ハウスクリーニング']) },
  { id: 'guaranteeRenewal', label: '保証会社更新料の記載がありそう', test: (ctx) => containsAny(ctx.sourceText, ['保証会社更新料', '年間保証料', '更新保証料']) },
  { id: 'freeRent', label: 'フリーレントあり', test: (ctx) => ctx.freeRentMonths > 0 || containsAny(ctx.sourceText, ['フリーレント']) },
  { id: 'ambiguous', label: '別途・要確認など曖昧文言あり', test: (ctx) => containsAny(ctx.sourceText, ['別途', '要確認', '確認中']) },
  { id: 'missing', label: '未入力項目あり', test: (ctx) => ctx.missingFields.length > 0 }
];

const form = document.getElementById('estimateForm');
const fileInput = document.getElementById('fileInput');
const sampleButton = document.getElementById('sampleButton');
const resetButton = document.getElementById('resetButton');
const fileNameEl = document.getElementById('fileName');
const parseStatusEl = document.getElementById('parseStatus');
const formMessageEl = document.getElementById('formMessage');
const resultTableEl = document.getElementById('resultTable');
const totalAmountEl = document.getElementById('totalAmount');
const warningTagsEl = document.getElementById('warningTags');
const warningListEl = document.getElementById('warningList');

const state = {
  extractedText: '',
  fileName: '',
  lastParseSummary: '未実行'
};

initialize();

function initialize() {
  bindEvents();
  loadEmptyResult();
}

function bindEvents() {
  fileInput.addEventListener('change', handleFileSelection);
  form.addEventListener('submit', handleSubmit);
  sampleButton.addEventListener('click', loadSampleData);
  resetButton.addEventListener('click', resetApp);

  amountFieldIds.forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    input.addEventListener('blur', () => {
      input.value = prettifyAmountInput(input.value);
    });
  });
}

async function handleFileSelection(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) {
    return;
  }

  state.fileName = file.name;
  fileNameEl.textContent = file.name;
  parseStatusEl.textContent = '読取中...';
  formMessageEl.textContent = 'ファイルから読取候補を推定しています。';

  try {
    const extractedText = await extractTextFromFile(file);
    state.extractedText = extractedText.trim();
    const compositeText = [file.name, state.extractedText].filter(Boolean).join('\n');
    applyGuessesFromText(compositeText);

    if (state.extractedText) {
      appendExtractedTextToNotes(state.extractedText);
      state.lastParseSummary = 'キーワード抽出をフォームへ反映しました。';
    } else {
      state.lastParseSummary = '自動抽出は限定的でした。必要項目を手入力してください。';
    }

    parseStatusEl.textContent = state.lastParseSummary;
    formMessageEl.textContent = state.lastParseSummary;
    calculateAndRender();
  } catch (error) {
    console.error(error);
    state.extractedText = '';
    state.lastParseSummary = '読取に失敗しました。手入力で続行してください。';
    parseStatusEl.textContent = state.lastParseSummary;
    formMessageEl.textContent = state.lastParseSummary;
  }
}

async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return extractTextFromPdf(file);
  }

  if (file.type.startsWith('image/')) {
    return '';
  }

  return '';
}

async function extractTextFromPdf(file) {
  const buffer = await file.arrayBuffer();
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(buffer);

  const textChunks = [];
  const parenthesesMatches = raw.match(/\(([^()]{1,120})\)/g) || [];
  parenthesesMatches.forEach((chunk) => {
    const cleaned = chunk.slice(1, -1).replace(/\\[nrtbf]/g, ' ').trim();
    if (/[一-龠ぁ-んァ-ヶA-Za-z0-9]/.test(cleaned)) {
      textChunks.push(cleaned);
    }
  });

  const unicodeMatches = raw.match(/(?:賃料|家賃|管理費|共益費|礼金|敷金|保証金|仲介手数料|火災保険|鍵交換|更新料|短期解約違約金|フリーレント).{0,20}/g) || [];
  textChunks.push(...unicodeMatches);

  return textChunks.join('\n').replace(/\s+/g, ' ').trim();
}

function applyGuessesFromText(sourceText) {
  if (!sourceText) {
    return;
  }

  keywordRules.forEach((rule) => {
    if (!containsAny(sourceText, rule.patterns)) {
      return;
    }

    const field = document.getElementById(rule.key);
    if (!field || (field.value && field.value.trim() !== '')) {
      return;
    }

    if (rule.type === 'flag') {
      field.value = rule.value;
      return;
    }

    if (rule.type === 'months') {
      const months = extractMonthsNearKeyword(sourceText, rule.patterns);
      if (months !== null) {
        field.value = String(months);
      }
      return;
    }

    const amount = extractAmountNearKeyword(sourceText, rule.patterns);
    if (amount !== null) {
      field.value = prettifyAmountInput(String(amount));
    }
  });
}

function extractAmountNearKeyword(sourceText, patterns) {
  const normalized = sourceText.replace(/\s+/g, ' ');

  for (const pattern of patterns) {
    const escaped = escapeRegExp(pattern);
    const monthRegex = new RegExp(`${escaped}[^\\d]{0,12}(\\d+(?:\\.\\d+)?)\\s*ヶ月`, 'i');
    const monthMatch = normalized.match(monthRegex);
    if (monthMatch) {
      return `${monthMatch[1]}ヶ月`;
    }

    const yenRegex = new RegExp(`${escaped}[^\\d]{0,18}([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+(?:\\.[0-9]+)?)`, 'i');
    const yenMatch = normalized.match(yenRegex);
    if (yenMatch) {
      return yenMatch[1];
    }
  }

  return null;
}

function extractMonthsNearKeyword(sourceText, patterns) {
  const normalized = sourceText.replace(/\s+/g, ' ');

  for (const pattern of patterns) {
    const escaped = escapeRegExp(pattern);
    const regex = new RegExp(`${escaped}[^\\d]{0,10}(\\d+(?:\\.\\d+)?)\\s*ヶ月`, 'i');
    const match = normalized.match(regex);
    if (match) {
      return Number(match[1]);
    }
  }

  return containsAny(sourceText, patterns) ? 1 : null;
}

function appendExtractedTextToNotes(extractedText) {
  const notesEl = document.getElementById('notes');
  const label = '【抽出テキスト（参考）】';
  if (notesEl.value.includes(label)) {
    return;
  }

  const text = extractedText.slice(0, 1500);
  notesEl.value = notesEl.value.trim()
    ? `${notesEl.value.trim()}\n\n${label}\n${text}`
    : `${label}\n${text}`;
}

function handleSubmit(event) {
  event.preventDefault();
  calculateAndRender();
  formMessageEl.textContent = '概算明細を更新しました。';
}

function calculateAndRender() {
  const values = collectFormValues();
  const result = calculateEstimate(values);
  renderResult(result);
}

function collectFormValues() {
  const rent = parseAmountInput(document.getElementById('rent').value);
  const managementFee = parseAmountInput(document.getElementById('managementFee').value);

  return {
    rent,
    managementFee,
    deposit: parseAmountInput(document.getElementById('deposit').value, rent),
    keyMoney: parseAmountInput(document.getElementById('keyMoney').value, rent),
    securityDeposit: parseAmountInput(document.getElementById('securityDeposit').value, rent),
    amortization: parseAmountInput(document.getElementById('amortization').value, rent),
    brokerFee: parseAmountInput(document.getElementById('brokerFee').value),
    guaranteeFee: parseAmountInput(document.getElementById('guaranteeFee').value),
    fireInsurance: parseAmountInput(document.getElementById('fireInsurance').value),
    keyExchange: parseAmountInput(document.getElementById('keyExchange').value),
    support24: parseAmountInput(document.getElementById('support24').value),
    disinfection: parseAmountInput(document.getElementById('disinfection').value),
    adminFee: parseAmountInput(document.getElementById('adminFee').value),
    renewalFee: parseAmountInput(document.getElementById('renewalFee').value, rent),
    contractStartDate: document.getElementById('contractStartDate').value,
    freeRentMonths: Number(document.getElementById('freeRentMonths').value || 0),
    includeProrated: document.getElementById('includeProrated').checked,
    includeNextMonth: document.getElementById('includeNextMonth').checked,
    shortTermPenalty: document.getElementById('shortTermPenalty').value,
    notes: document.getElementById('notes').value.trim(),
    sourceText: `${state.fileName}\n${state.extractedText}\n${document.getElementById('notes').value}`.trim(),
    missingFields: findMissingFields()
  };
}

function calculateEstimate(values) {
  const prorated = values.includeProrated
    ? calculateProratedRent(values.contractStartDate, values.rent, values.managementFee)
    : { rent: 0, managementFee: 0, total: 0 };
  const freeRentOffset = values.includeNextMonth
    ? Math.min(values.rent * values.freeRentMonths, values.rent)
    : 0;
  const nextMonthRent = values.includeNextMonth ? Math.max(values.rent - freeRentOffset, 0) : 0;
  const managementFeeLine = values.includeNextMonth ? values.managementFee : 0;
  const otherFees = 0;

  const lineItems = [
    { label: '前家賃（日割り）', amount: prorated.total },
    { label: '翌月賃料', amount: nextMonthRent },
    { label: '管理費', amount: managementFeeLine },
    { label: '敷金', amount: values.deposit },
    { label: '礼金', amount: values.keyMoney },
    { label: '保証金', amount: values.securityDeposit },
    { label: '仲介手数料', amount: values.brokerFee },
    { label: '保証会社初回費用', amount: values.guaranteeFee },
    { label: '火災保険料', amount: values.fireInsurance },
    { label: '鍵交換代', amount: values.keyExchange },
    { label: '24時間サポート', amount: values.support24 },
    { label: '消毒料', amount: values.disinfection },
    { label: '事務手数料', amount: values.adminFee },
    { label: 'その他費用', amount: otherFees }
  ];

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const warnings = buildWarnings(values, freeRentOffset);

  return {
    lineItems,
    total,
    warnings
  };
}

function calculateProratedRent(contractStartDate, rent, managementFee) {
  if (!contractStartDate) {
    return { rent: 0, managementFee: 0, total: 0 };
  }

  const date = new Date(`${contractStartDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return { rent: 0, managementFee: 0, total: 0 };
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDays = daysInMonth - day + 1;

  const proratedRent = Math.round((rent / daysInMonth) * remainingDays);
  const proratedManagementFee = Math.round((managementFee / daysInMonth) * remainingDays);
  return {
    rent: proratedRent,
    managementFee: proratedManagementFee,
    total: proratedRent + proratedManagementFee
  };
}

function buildWarnings(values, freeRentOffset) {
  const warnings = [];

  warningMatchers.forEach((matcher) => {
    if (matcher.test(values)) {
      warnings.push(matcher.label);
    }
  });

  if (values.amortization > 0) {
    warnings.push(`償却 ${formatCurrency(values.amortization)} の記載があります。返還条件を確認してください。`);
  }

  if (values.freeRentMonths > 0 && values.includeNextMonth) {
    warnings.push(`翌月賃料から ${formatCurrency(freeRentOffset)} を控除しています。`);
  }

  if (!values.contractStartDate && values.includeProrated) {
    warnings.push('契約開始日が未入力のため、日割り計算は 0 円で表示しています。');
  }

  if (warnings.length === 0) {
    warnings.push('現時点で大きな注意喚起はありません。原本条件と課税区分をご確認ください。');
  }

  return Array.from(new Set(warnings));
}

function renderResult(result) {
  resultTableEl.innerHTML = '';

  result.lineItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML = `<span>${item.label}</span><strong>${formatCurrency(item.amount)}</strong>`;
    resultTableEl.appendChild(row);
  });

  const totalRow = document.createElement('div');
  totalRow.className = 'result-row total-row';
  totalRow.innerHTML = `<span>合計金額</span><strong>${formatCurrency(result.total)}</strong>`;
  resultTableEl.appendChild(totalRow);
  totalAmountEl.textContent = formatCurrency(result.total);

  renderWarnings(result.warnings);
}

function renderWarnings(warnings) {
  warningTagsEl.innerHTML = '';
  warningListEl.innerHTML = '';

  warnings.forEach((warning) => {
    const tag = document.createElement('span');
    tag.className = `tag${warning.includes('ありません') ? ' is-neutral' : ''}`;
    tag.textContent = warning.length > 22 ? `${warning.slice(0, 22)}...` : warning;
    warningTagsEl.appendChild(tag);

    const item = document.createElement('li');
    item.textContent = warning;
    warningListEl.appendChild(item);
  });

  if (warnings.length === 0) {
    const tag = document.createElement('span');
    tag.className = 'tag is-neutral';
    tag.textContent = '注意事項なし';
    warningTagsEl.appendChild(tag);
  }
}

function loadSampleData() {
  const sample = {
    rent: '72,000',
    managementFee: '3,000',
    deposit: '0',
    keyMoney: '1ヶ月',
    securityDeposit: '0',
    amortization: '0',
    brokerFee: '79,200',
    guaranteeFee: '37,500',
    fireInsurance: '18,000',
    keyExchange: '22,000',
    support24: '16,500',
    disinfection: '0',
    adminFee: '0',
    contractStartDate: '2026-04-15',
    freeRentMonths: '0',
    renewalFee: '0',
    shortTermPenalty: '',
    notes: 'サンプル募集図面: 礼金1ヶ月、保証会社加入必須、火災保険18,000円、鍵交換22,000円。',
    includeProrated: true,
    includeNextMonth: true
  };

  fieldIds.forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) {
      return;
    }

    field.value = sample[fieldId] || '';
  });

  document.getElementById('includeProrated').checked = sample.includeProrated;
  document.getElementById('includeNextMonth').checked = sample.includeNextMonth;
  state.extractedText = '賃料 72000 管理費 3000 礼金 1ヶ月 仲介手数料 79200 保証会社初回費用 37500 火災保険料 18000 鍵交換代 22000 24時間サポート 16500';
  state.fileName = 'sample-mysoku.pdf';
  fileNameEl.textContent = state.fileName;
  parseStatusEl.textContent = 'サンプルデータを読み込みました。';
  formMessageEl.textContent = 'サンプルデータを反映しました。';
  calculateAndRender();
}

function resetApp() {
  form.reset();
  state.extractedText = '';
  state.fileName = '';
  state.lastParseSummary = '未実行';
  fileNameEl.textContent = '未選択';
  parseStatusEl.textContent = '未実行';
  formMessageEl.textContent = 'フォームをリセットしました。';
  fileInput.value = '';
  loadEmptyResult();
}

function loadEmptyResult() {
  renderResult({
    lineItems: [
      { label: '前家賃（日割り）', amount: 0 },
      { label: '翌月賃料', amount: 0 },
      { label: '管理費', amount: 0 },
      { label: '敷金', amount: 0 },
      { label: '礼金', amount: 0 },
      { label: '保証金', amount: 0 },
      { label: '仲介手数料', amount: 0 },
      { label: '保証会社初回費用', amount: 0 },
      { label: '火災保険料', amount: 0 },
      { label: '鍵交換代', amount: 0 },
      { label: '24時間サポート', amount: 0 },
      { label: '消毒料', amount: 0 },
      { label: '事務手数料', amount: 0 },
      { label: 'その他費用', amount: 0 }
    ],
    total: 0,
    warnings: ['未入力項目あり']
  });
}

function findMissingFields() {
  const requiredForEstimate = [
    { id: 'rent', label: '賃料' },
    { id: 'contractStartDate', label: '契約開始日' }
  ];

  return requiredForEstimate
    .filter((field) => {
      const value = document.getElementById(field.id).value;
      return !String(value || '').trim();
    })
    .map((field) => field.label);
}

function parseAmountInput(value, monthlyBase = 0) {
  if (value === null || value === undefined) {
    return 0;
  }

  const text = String(value).trim();
  if (!text) {
    return 0;
  }

  const normalized = text.replace(/,/g, '').replace(/円/g, '').trim();
  const monthMatch = normalized.match(/(-?\d+(?:\.\d+)?)\s*ヶ月?/i);
  if (monthMatch) {
    return Math.round(Number(monthMatch[1]) * monthlyBase);
  }

  const numeric = normalized.match(/-?\d+(?:\.\d+)?/);
  return numeric ? Math.round(Number(numeric[0])) : 0;
}

function prettifyAmountInput(value) {
  if (!value) {
    return '';
  }

  const text = String(value).trim();
  if (text.includes('ヶ月')) {
    return text;
  }

  const amount = parseAmountInput(text);
  return amount ? amount.toLocaleString('ja-JP') : text;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function containsAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

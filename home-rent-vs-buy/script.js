const form = document.getElementById("simulatorForm");
const sampleButton = document.getElementById("sampleButton");
const resetButton = document.getElementById("resetButton");
const errorMessage = document.getElementById("errorMessage");

const fields = {
  monthlyRent: document.getElementById("monthlyRent"),
  years: document.getElementById("years"),
  renewalFee: document.getElementById("renewalFee"),
  renewalFrequency: document.getElementById("renewalFrequency"),
  propertyPrice: document.getElementById("propertyPrice"),
  downPayment: document.getElementById("downPayment"),
  interestRate: document.getElementById("interestRate"),
  loanYears: document.getElementById("loanYears"),
  propertyTaxAnnual: document.getElementById("propertyTaxAnnual"),
  managementFee: document.getElementById("managementFee"),
  repairReserve: document.getElementById("repairReserve"),
  purchaseCostRate: document.getElementById("purchaseCostRate"),
  futureSalePrice: document.getElementById("futureSalePrice"),
  rentGrowthRate: document.getElementById("rentGrowthRate")
};

const outputs = {
  summaryMessage: document.getElementById("summaryMessage"),
  buyTotal: document.getElementById("buyTotal"),
  rentTotal: document.getElementById("rentTotal"),
  differenceTotal: document.getElementById("differenceTotal"),
  loanRepaymentTotal: document.getElementById("loanRepaymentTotal"),
  purchaseCostTotal: document.getElementById("purchaseCostTotal"),
  salePriceNote: document.getElementById("salePriceNote"),
  rentOnlyTotal: document.getElementById("rentOnlyTotal"),
  renewalTotal: document.getElementById("renewalTotal")
};

const sampleValues = {
  monthlyRent: 145000,
  years: 12,
  renewalFee: 145000,
  renewalFrequency: 2,
  propertyPrice: 49800000,
  downPayment: 6000000,
  interestRate: 1.1,
  loanYears: 35,
  propertyTaxAnnual: 135000,
  managementFee: 16000,
  repairReserve: 14000,
  purchaseCostRate: 6.5,
  futureSalePrice: 39000000,
  rentGrowthRate: 1
};

function parseValue(input) {
  return Number(input.value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

// 元利均等返済の月返済額を計算する
function calculateMonthlyMortgage(principal, annualRate, months) {
  if (principal <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 12;

  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

// 家賃上昇率を年単位で反映して賃貸総額を出す
function calculateRentTotal(monthlyRent, years, growthRate) {
  let total = 0;
  let currentMonthlyRent = monthlyRent;

  for (let year = 1; year <= years; year += 1) {
    total += currentMonthlyRent * 12;
    currentMonthlyRent *= 1 + growthRate;
  }

  return total;
}

function calculateRenewalTotal(years, renewalFrequency, renewalFee) {
  if (renewalFrequency <= 0) {
    return 0;
  }

  return Math.floor(years / renewalFrequency) * renewalFee;
}

function getFormValues() {
  return Object.fromEntries(
    Object.entries(fields).map(([key, input]) => [key, parseValue(input)])
  );
}

function getLabel(key) {
  const labels = {
    monthlyRent: "月額家賃",
    years: "想定居住年数",
    renewalFee: "更新料",
    renewalFrequency: "更新頻度",
    propertyPrice: "購入物件価格",
    downPayment: "頭金",
    interestRate: "住宅ローン金利",
    loanYears: "ローン年数",
    propertyTaxAnnual: "固定資産税",
    managementFee: "管理費",
    repairReserve: "修繕積立金",
    purchaseCostRate: "購入時諸費用",
    futureSalePrice: "将来売却価格",
    rentGrowthRate: "家賃上昇率"
  };

  return labels[key] || key;
}

function validate(values) {
  for (const [key, value] of Object.entries(values)) {
    if (Number.isNaN(value)) {
      return `${getLabel(key)}を正しく入力してください。`;
    }

    if (value < 0) {
      return `${getLabel(key)}は0以上で入力してください。`;
    }
  }

  if (values.years < 1) {
    return "想定居住年数は1年以上で入力してください。";
  }

  if (values.loanYears < 1) {
    return "ローン年数は1年以上で入力してください。";
  }

  if (values.renewalFrequency < 1) {
    return "更新頻度は1年以上で入力してください。";
  }

  if (values.downPayment > values.propertyPrice) {
    return "頭金は購入物件価格以下で入力してください。";
  }

  return "";
}

function renderResults(result) {
  outputs.buyTotal.textContent = formatCurrency(result.buyTotal);
  outputs.rentTotal.textContent = formatCurrency(result.rentTotal);
  outputs.differenceTotal.textContent = formatCurrency(result.difference);
  outputs.loanRepaymentTotal.textContent = formatCurrency(result.loanRepaymentTotal);
  outputs.purchaseCostTotal.textContent = formatCurrency(result.purchaseCostTotal);
  outputs.salePriceNote.textContent = `-${formatCurrency(result.futureSalePrice)}`;
  outputs.rentOnlyTotal.textContent = formatCurrency(result.rentOnlyTotal);
  outputs.renewalTotal.textContent = formatCurrency(result.renewalTotal);

  const absoluteDifference = Math.abs(result.difference);
  if (result.difference > 0) {
    outputs.summaryMessage.textContent =
      `今回の条件では、賃貸のほうが ${formatCurrency(absoluteDifference)} 安い参考結果です。`;
  } else if (result.difference < 0) {
    outputs.summaryMessage.textContent =
      `今回の条件では、購入のほうが ${formatCurrency(absoluteDifference)} 安い参考結果です。`;
  } else {
    outputs.summaryMessage.textContent =
      "今回の条件では、購入と賃貸の総コストはほぼ同水準です。";
  }
}

function updateError(message) {
  errorMessage.textContent = message;
}

function calculate() {
  const values = getFormValues();
  const validationMessage = validate(values);

  if (validationMessage) {
    updateError(validationMessage);
    outputs.summaryMessage.textContent = "入力内容を見直すと計算結果を表示できます。";
    return;
  }

  updateError("");

  const principal = values.propertyPrice - values.downPayment;
  const loanMonths = values.loanYears * 12;
  const livingMonths = values.years * 12;
  const monthlyMortgage = calculateMonthlyMortgage(
    principal,
    values.interestRate / 100,
    loanMonths
  );

  // 居住年数分だけ支払ったローン返済額を総コストに含める
  const loanRepaymentTotal = monthlyMortgage * Math.min(livingMonths, loanMonths);
  const purchaseCostTotal = values.propertyPrice * (values.purchaseCostRate / 100);
  const fixedTaxTotal = values.propertyTaxAnnual * values.years;
  const managementFeeTotal = values.managementFee * livingMonths;
  const repairReserveTotal = values.repairReserve * livingMonths;
  const buyTotal =
    loanRepaymentTotal +
    fixedTaxTotal +
    managementFeeTotal +
    repairReserveTotal +
    purchaseCostTotal -
    values.futureSalePrice;

  const rentOnlyTotal = calculateRentTotal(
    values.monthlyRent,
    values.years,
    values.rentGrowthRate / 100
  );
  const renewalTotal = calculateRenewalTotal(
    values.years,
    values.renewalFrequency,
    values.renewalFee
  );
  const rentTotal = rentOnlyTotal + renewalTotal;

  renderResults({
    buyTotal,
    rentTotal,
    difference: buyTotal - rentTotal,
    loanRepaymentTotal,
    purchaseCostTotal,
    futureSalePrice: values.futureSalePrice,
    rentOnlyTotal,
    renewalTotal
  });
}

function applyValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (fields[key]) {
      fields[key].value = value;
    }
  });
  calculate();
}

form.addEventListener("input", calculate);

sampleButton.addEventListener("click", () => {
  applyValues(sampleValues);
});

resetButton.addEventListener("click", () => {
  form.reset();
  calculate();
});

calculate();

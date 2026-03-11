document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("rentForm");
  const resultEmpty = document.getElementById("resultEmpty");
  const resultBox = document.getElementById("resultBox");
  const validityBadge = document.getElementById("validityBadge");
  const riskBadge = document.getElementById("riskBadge");
  const resultSummary = document.getElementById("resultSummary");
  const resultDetail = document.getElementById("resultDetail");

  function getLevelLabel(level) {
    if (level === "high") return "高";
    if (level === "medium") return "中";
    return "低";
  }

  function setBadge(el, prefix, level) {
    el.className = `badge ${level}`;
    el.textContent = `${prefix}：${getLevelLabel(level)}`;
  }

  function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function validityScoreToLevel(score) {
    if (score >= 6) return "high";
    if (score >= 3) return "medium";
    return "low";
  }

  function riskScoreToLevel(score) {
    if (score >= 5) return "high";
    if (score >= 3) return "medium";
    return "low";
  }

  function buildValidityComment(level) {
    if (level === "high") {
      return "周辺相場との乖離や、前回改定からの経過、維持費上昇などを踏まえると、値上げに一定の合理性がある可能性があります。";
    }
    if (level === "medium") {
      return "値上げを主張する事情はありますが、事情としてはやや混在しており、妥当性は中程度と考えられます。";
    }
    return "現時点では、値上げの合理性を強く支える事情は多くありません。相場や費用上昇の裏付けが弱いと争いになりやすいです。";
  }

  function buildRiskComment(level) {
    if (level === "high") {
      return "当事者間で見解が割れやすく、交渉や法的手続に発展するリスクがあります。資料整理や専門家相談を前提にした方が安全です。";
    }
    if (level === "medium") {
      return "一定の争いは想定されますが、説明資料や相場根拠が整っていれば調整可能な余地があります。";
    }
    return "大きな争いに発展する可能性は比較的低めですが、個別事情次第では結論が変わることがあります。";
  }

  function diagnose(data) {
    const currentRent = toNumber(data.get("currentRent"));
    const marketComparison = toNumber(data.get("marketComparison"));
    const buildingAge = toNumber(data.get("buildingAge"));
    const yearsSinceRevision = toNumber(data.get("yearsSinceRevision"));
    const costIncrease = toNumber(data.get("costIncrease"));

    let validityScore = 0;
    let riskScore = 0;
    const reasons = [];

    // 1. 周辺相場との比較
    // 2 = 現在賃料が相場より低い
    // 1 = ほぼ相場並み
    // 0 = 現在賃料が相場より高い
    if (marketComparison === 2) {
      validityScore += 3;
      riskScore += 1;
      reasons.push("現在賃料が周辺相場より低い前提のため、増額請求を支える事情としては比較的強めです。");
    } else if (marketComparison === 1) {
      validityScore += 1;
      riskScore += 2;
      reasons.push("現在賃料がほぼ相場並みのため、増額の根拠は限定的で、説明の仕方によっては争いになりやすいです。");
    } else {
      validityScore -= 2;
      riskScore += 3;
      reasons.push("現在賃料が相場より高い前提のため、増額の合理性は弱く、紛争リスクは高めです。");
    }

    // 2. 前回改定からの経過
    if (yearsSinceRevision >= 8) {
      validityScore += 2;
      reasons.push("前回改定からかなり年数が経過しており、賃料見直しの事情として考慮されやすいです。");
    } else if (yearsSinceRevision >= 4) {
      validityScore += 1;
      reasons.push("前回改定から一定期間が経過しており、見直し事情として一定の説明は可能です。");
    } else if (yearsSinceRevision <= 1) {
      validityScore -= 1;
      riskScore += 2;
      reasons.push("前回改定から間もないため、再度の増額は受け入れられにくく、争いの火種になりやすいです。");
    } else {
      riskScore += 1;
    }

    // 3. 固定資産税や維持費の上昇
    if (costIncrease === 2) {
      validityScore += 2;
      reasons.push("固定資産税や維持費の明確な上昇は、増額を支える事情として一定の意味があります。");
    } else if (costIncrease === 1) {
      validityScore += 1;
      reasons.push("維持費上昇があるため、増額の補強事情にはなります。");
    } else {
      reasons.push("費用上昇の事情が弱い、または不明なため、増額根拠としてはやや弱めです。");
    }

    // 4. 築年数
    // 築古でも直ちに増額根拠になるわけではないが、
    // 改修・維持コストとの関係で補助事情にはなりうる。
    if (buildingAge >= 30) {
      validityScore += 1;
      reasons.push("築年数が相応に経過しており、維持管理コストの観点では補助事情になりえます。");
    } else if (buildingAge <= 5) {
      riskScore += 1;
      reasons.push("比較的新しい建物のため、築年数自体から増額必要性を説明する力は強くありません。");
    }

    // 5. 現在賃料の絶対額は参考程度
    // 極端に低額なら増額の納得感は出やすいが、主判断ではない
    if (currentRent > 0 && currentRent < 50000) {
      validityScore += 1;
      reasons.push("現在賃料が比較的低めの水準であれば、見直しの説明余地はやや高まります。");
    }

    const validityLevel = validityScoreToLevel(validityScore);
    const riskLevel = riskScoreToLevel(riskScore);

    let summary = "";
    if (validityLevel === "high" && riskLevel === "low") {
      summary = "増額の事情は比較的整っており、説明次第では受け入れられる余地があります。";
    } else if (validityLevel === "high" && riskLevel !== "low") {
      summary = "増額を支える事情はありますが、借主側との認識差が出やすく、交渉は慎重に進めるべきです。";
    } else if (validityLevel === "medium" && riskLevel === "high") {
      summary = "増額の説明材料はあるものの、争いに発展する可能性が高く、実務上は根拠資料の整備が重要です。";
    } else if (validityLevel === "low" && riskLevel === "high") {
      summary = "現状では増額の合理性は弱く、紛争化しやすい状態です。安易な通知は避けた方が無難です。";
    } else {
      summary = "事情は一長一短で、個別事情によって評価が分かれやすい状態です。";
    }

    const detail =
      [
        buildValidityComment(validityLevel),
        buildRiskComment(riskLevel),
        "",
        "【参考事情】",
        ...reasons.map((r) => `・${r}`),
        "",
        "※この診断は民法32条の考慮事情を参考にした簡易目安であり、法的判断を確定するものではありません。個別事情や証拠の有無によって結論は変わります。"
      ].join("\n");

    return {
      validityLevel,
      riskLevel,
      summary,
      detail
    };
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const result = diagnose(formData);

    setBadge(validityBadge, "妥当性", result.validityLevel);
    setBadge(riskBadge, "紛争リスク", result.riskLevel);
    resultSummary.textContent = result.summary;
    resultDetail.textContent = result.detail;

    resultEmpty.classList.add("hidden");
    resultBox.classList.remove("hidden");
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      resultBox.classList.add("hidden");
      resultEmpty.classList.remove("hidden");
      resultSummary.textContent = "";
      resultDetail.textContent = "";
      validityBadge.className = "badge";
      validityBadge.textContent = "妥当性";
      riskBadge.className = "badge";
      riskBadge.textContent = "紛争リスク";
    }, 0);
  });
});

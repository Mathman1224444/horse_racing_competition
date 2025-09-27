// Pure functions to evaluate bets based on finishing order and payout rules

function roundMoney(amount) {
  return Math.round(amount * 100) / 100;
}

function permutations(n, r) {
  if (r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) {
    result *= (n - i);
  }
  return result;
}

function evaluateWinPlaceShow(bet, finishingOrder, payoutRules) {
  const horseId = bet.selections[0];
  const pos = finishingOrder.indexOf(horseId) + 1;

  if (pos === 0) return { won: false, payout: 0, details: 'Horse did not finish' };

  if (bet.bet_type === 'win') {
    if (pos === 1) return { won: true, payout: roundMoney(bet.amount * (payoutRules.winMultiplier ?? 2.0)), details: 'Winner' };
    return { won: false, payout: 0, details: 'Lost' };
  }

  if (bet.bet_type === 'place') {
    if (pos === 1 || pos === 2) return { won: true, payout: roundMoney(bet.amount * (payoutRules.placeMultiplier ?? 1.5)), details: `Finished ${pos}` };
    return { won: false, payout: 0, details: 'Lost' };
  }

  if (bet.bet_type === 'show') {
    if (pos === 1 || pos === 2 || pos === 3) return { won: true, payout: roundMoney(bet.amount * (payoutRules.showMultiplier ?? 1.2)), details: `Finished ${pos}` };
    return { won: false, payout: 0, details: 'Lost' };
  }

  if (bet.bet_type === 'atb') {
    const portion = roundMoney(bet.amount / 3);
    const win = pos === 1 ? roundMoney(portion * (payoutRules.winMultiplier ?? 2.0)) : 0;
    const place = (pos === 1 || pos === 2) ? roundMoney(portion * (payoutRules.placeMultiplier ?? 1.5)) : 0;
    const show = (pos === 1 || pos === 2 || pos === 3) ? roundMoney(portion * (payoutRules.showMultiplier ?? 1.2)) : 0;
    const total = roundMoney(win + place + show);
    return { won: total > 0, payout: total, details: `ATB parts: win ${win}, place ${place}, show ${show}` };
  }

  return { won: false, payout: 0, details: 'Unsupported bet type' };
}


function evaluateExacta(bet, finishingOrder, payoutRules) {
const sel = bet.selections
if (bet.boxed) {
const chosen = sel
const combos = permutations(chosen.length, 2)
const actualTop2 = [finishingOrder[0], finishingOrder[1]]
const hit = chosen.includes(actualTop2[0]) && chosen.includes(actualTop2[1]) && actualTop2[0] !== actualTop2[1]
if (!hit) return { won: false, payout: 0, details: 'No permutation hit' }
const perPermutation = bet.perPerPermutation ?? bet.amount
return { won: true, payout: roundMoney(perPermutation * (payoutRules.exactaPayoutPerDollar ?? 40)), details: `Exacta box hit; combos ${combos}` }
} else {
const actual = [finishingOrder[0], finishingOrder[1]]
if (sel[0] === actual[0] && sel[1] === actual[1]) {
return { won: true, payout: roundMoney(bet.amount * (payoutRules.exactaPayoutPerDollar ?? 40)), details: 'Straight exacta hit' }
}
return { won: false, payout: 0, details: 'Missed exacta' }
}
}


function evaluateTrifecta(bet, finishingOrder, payoutRules) {
const sel = bet.selections
if (bet.boxed) {
const n = sel.length
const combos = permutations(n, 3)
const actualTop3 = [finishingOrder[0], finishingOrder[1], finishingOrder[2]]
const hit = sel.includes(actualTop3[0]) && sel.includes(actualTop3[1]) && sel.includes(actualTop3[2]) && new Set(actualTop3).size === 3
if (!hit) return { won: false, payout: 0, details: 'No permutation hit' }
const perPermutation = bet.perPerPermutation ?? bet.amount
return { won: true, payout: roundMoney(perPermutation * (payoutRules.trifectaPayoutPerDollar ?? 300)), details: `Trifecta box hit; combos ${combos}` }
} else {
const actual = [finishingOrder[0], finishingOrder[1], finishingOrder[2]]
if (sel[0] === actual[0] && sel[1] === actual[1] && sel[2] === actual[2]) {
return { won: true, payout: roundMoney(bet.amount * (payoutRules.trifectaPayoutPerDollar ?? 300)), details: 'Straight trifecta hit' }
}
return { won: false, payout: 0, details: 'Missed trifecta' }
}
}


export function evaluateBet(bet, finishingOrder, payoutRules) {
  if (["win","place","show","atb"].includes(bet.bet_type)) return evaluateWinPlaceShow(bet, finishingOrder, payoutRules);
  if (bet.bet_type === 'exacta') return evaluateExacta(bet, finishingOrder, payoutRules);
  if (bet.bet_type === 'trifecta') return evaluateTrifecta(bet, finishingOrder, payoutRules);
  return { won: false, payout: 0, details: 'Unknown bet type' };
}

export function calculateOdds(selections) {
  // Placeholder for odds calculation logic
  return 1.0;
}
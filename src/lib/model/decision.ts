export interface DecisionRule {
  marginOfSafety: number;
  bearMaxLoss: number;
  referencePrice: "offer" | "market";
}

export interface DecisionInput {
  basePerShare: number;
  bearPerShare: number;
  compsMid: number | null;
  price: number; // the reference price the rule compares with
}

export type Verdict = "BUY" | "NOT BUY" | "INCOMPLETE";

export interface Decision {
  verdict: Verdict;
  hurdle: number;
  dcfPasses: boolean;
  compsPasses: boolean | null;
  bearLoss: number;
  bearPasses: boolean;
  reasons: string[];
}

/**
 * Buy only if the base-case DCF and the comps midpoint both exceed the reference price by the margin of
 * safety, and the bear case loses less than the named limit. Without comps the verdict is INCOMPLETE
 * unless the DCF legs already fail (then NOT BUY).
 */
export function applyDecisionRule(r: DecisionRule, x: DecisionInput): Decision {
  const hurdle = x.price * (1 + r.marginOfSafety);
  const dcfPasses = x.basePerShare >= hurdle;
  const compsPasses = x.compsMid === null ? null : x.compsMid >= hurdle;
  // equity is floored at zero for a shareholder: the worst loss is 100 %
  const bearLoss = Math.min(1, Math.max(0, 1 - Math.max(0, x.bearPerShare) / x.price));
  const bearPasses = bearLoss < r.bearMaxLoss;
  const reasons: string[] = [];
  if (!dcfPasses) reasons.push("base-case DCF below hurdle");
  if (compsPasses === false) reasons.push("comps midpoint below hurdle");
  if (!bearPasses) reasons.push("bear-case loss above limit");
  if (compsPasses === null) reasons.push("comps not available");
  let verdict: Verdict;
  if (!dcfPasses || !bearPasses || compsPasses === false) verdict = "NOT BUY";
  else if (compsPasses === null) verdict = "INCOMPLETE";
  else verdict = "BUY";
  return { verdict, hurdle, dcfPasses, compsPasses, bearLoss, bearPasses, reasons };
}

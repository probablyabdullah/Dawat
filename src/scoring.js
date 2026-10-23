import { Utensils, Sparkles, Wallet } from 'lucide-react'

export const MAX_METRIC = 10
export const MAX_TOTAL = 30

// Each spot is rated out of 10 on these three metrics; the published score is their sum (out of 30).
export const METRICS = [
  { key: 'food_score', label: 'Food & taste', short: 'Food', Icon: Utensils },
  { key: 'ambience_score', label: 'Ambience & service', short: 'Ambience', Icon: Sparkles },
  { key: 'value_score', label: 'Value for money & quality', short: 'Value', Icon: Wallet },
]

// null for spots saved before the 3-metric system existed
export function totalScore(spot) {
  const scores = METRICS.map((m) => spot[m.key])
  return scores.every((s) => s != null) ? scores.reduce((a, b) => a + b, 0) : null
}

export function scoreTone(total) {
  if (total == null) return 'none'
  if (total >= 27) return 'high'
  if (total >= 21) return 'mid'
  return 'low'
}

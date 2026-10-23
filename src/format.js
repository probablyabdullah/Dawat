// Change these to switch the currency shown everywhere (prices are stored as plain whole numbers)
const LOCALE = 'en-IN'
const CURRENCY = 'INR'

const priceFormat = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
})

export function formatPrice(amount) {
  return amount == null ? '' : priceFormat.format(amount)
}

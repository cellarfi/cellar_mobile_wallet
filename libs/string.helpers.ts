export const formatValue = (value?: number) => {
  if (!value) return '$0.00'

  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  } else if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`
  } else if (value < 0.01 && value > 0) {
    // Show zeros and first two non-zero digits for small values, e.g. 0.00034 -> $0.00034
    const valueStr = value.toFixed(8) // up to 8 decimals for safety
    const match = valueStr.match(/^0\.0*(\d{1,2})/)
    const digits = match
      ? match[1]
      : valueStr.split('.')[1]?.slice(0, 2) || '00'
    return `0.${'0'.repeat(
      valueStr.split('.')[1]?.indexOf(digits) ?? 0
    )}${digits}`
  } else {
    return `${value.toFixed(2)}`
  }
}

export const formatPriceChange = (change?: number) => {
  if (!change) return '+0.0%'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

export const toTitleCase = (str: string) => {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'N/A'
  const formatted = value.toFixed(2)
  return value >= 0 ? `+${formatted}%` : `${formatted}%`
}

export const formatNumber = (value?: number) => {
  if (!value) return '0.00'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatAddress = (address: string) => {
  if (!address) return ''
  return address.length > 12
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address
}

// Copy wallet address handler
// const handleCopyWallet = async (address: string) => {
//   try {
//     await Clipboard.setStringAsync(address);
//     await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 1500);
//   } catch (e) {
//     // Optionally handle error
//   }
// };

// URL validation function
export const isValidUrl = (string: string) => {
  try {
    // Check for common URL patterns
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
    const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

    // Remove protocol if present for domain checking
    const withoutProtocol = string.replace(/^https?:\/\//, '')

    return urlRegex.test(string) || domainRegex.test(withoutProtocol)
  } catch (error) {
    return false
  }
}

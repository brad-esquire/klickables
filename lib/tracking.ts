export function trackingUrl(carrier: string, trackingNumber: string): string {
  const t = encodeURIComponent(trackingNumber)
  switch (carrier) {
    case 'UPS':
      return `https://www.ups.com/track?tracknum=${t}`
    case 'FedEx':
      return `https://www.fedex.com/apps/fedextrack/?tracknumbers=${t}`
    default: // USPS
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`
  }
}

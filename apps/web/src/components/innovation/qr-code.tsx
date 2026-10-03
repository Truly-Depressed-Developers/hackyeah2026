import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('')

  useEffect(() => {
    let active = true
    QRCode.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }).then((markup) => {
      if (active) setSvg(markup)
    })
    return () => {
      active = false
    }
  }, [value])

  return (
    <div
      role="img"
      aria-label={label}
      className="size-[8.25rem] shrink-0 rounded-[0.875rem] border border-input bg-white p-1.5 [&_svg]:size-full"
      // SVG markup generated locally by `qrcode` from our own URL.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

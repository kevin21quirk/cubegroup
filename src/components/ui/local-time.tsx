'use client'

import { useEffect, useState } from 'react'

interface LocalTimeProps {
  date: string | Date
  /** date-fns style format hint; we replicate the two used formats */
  fmt?: 'dd MMM yyyy HH:mm' | 'HH:mm:ss dd MMM' | 'dd MMM HH:mm' | 'dd MMM yyyy'
}

function toLocalString(date: Date, fmt: LocalTimeProps['fmt']): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const d = {
    dd:   pad(date.getDate()),
    MMM:  date.toLocaleString('en-GB', { month: 'short' }),
    yyyy: String(date.getFullYear()),
    HH:   pad(date.getHours()),
    mm:   pad(date.getMinutes()),
    ss:   pad(date.getSeconds()),
  }
  switch (fmt) {
    case 'HH:mm:ss dd MMM':   return `${d.HH}:${d.mm}:${d.ss} ${d.dd} ${d.MMM}`
    case 'dd MMM HH:mm':      return `${d.dd} ${d.MMM} ${d.HH}:${d.mm}`
    case 'dd MMM yyyy':        return `${d.dd} ${d.MMM} ${d.yyyy}`
    case 'dd MMM yyyy HH:mm':
    default:                   return `${d.dd} ${d.MMM} ${d.yyyy} ${d.HH}:${d.mm}`
  }
}

export function LocalTime({ date, fmt = 'dd MMM yyyy HH:mm' }: LocalTimeProps) {
  const [label, setLabel] = useState<string>('…')

  useEffect(() => {
    setLabel(toLocalString(new Date(date), fmt))
  }, [date, fmt])

  return <span suppressHydrationWarning>{label}</span>
}

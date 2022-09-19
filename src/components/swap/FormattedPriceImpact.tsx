import { useMediaQuery, useTheme } from '@mui/material'
import { Percent } from 'definixswap-sdk'
import React from 'react'
import { ONE_BIPS } from '../../constants'
import { warningSeverity } from '../../utils/prices'
import { ErrorText } from './styleds'

/**
 * Formatted version of price impact text with warning colors
 */
export default function FormattedPriceImpact({ priceImpact }: { priceImpact?: Percent }) {
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))

  return (
    <ErrorText
      fontSize="14px"
      fontWeight="600"
      severity={warningSeverity(priceImpact)}
      textAlign={mdUp ? 'right' : 'left'}
    >
      {priceImpact ? (priceImpact.lessThan(ONE_BIPS) ? '< 0.01%' : `${priceImpact.toFixed(2)}%`) : '-'}
    </ErrorText>
  )
}

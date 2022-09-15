import { Typography } from '@mui/material'
import { Price } from 'definixswap-sdk'
import React from 'react'

interface TradePriceProps {
  price?: Price
}

export default function TradePrice({ price }: TradePriceProps) {
  return (
    <div>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: { md: 'right' } }} fontWeight="500">{`1 ${
        price?.baseCurrency?.symbol
      } = ${price?.toSignificant(6) ?? '-'} ${price?.quoteCurrency?.symbol}`}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: { md: 'right' } }} fontWeight="500">{`1 ${
        price?.quoteCurrency?.symbol
      } = ${price?.invert()?.toSignificant(6) ?? '-'} ${price?.baseCurrency?.symbol}`}</Typography>
    </div>
  )
}

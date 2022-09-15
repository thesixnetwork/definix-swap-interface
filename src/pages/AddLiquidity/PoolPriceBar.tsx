import { Typography } from '@mui/material'
import { Currency, Percent, Price } from 'definixswap-sdk'
import React from 'react'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { ONE_BIPS } from '../../constants'
import { Field } from '../../state/mint/actions'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price
}) {
  return (
    <div>
      <SpaceBetweenFormat
        mb={1.5}
        title="Price Rate"
        valueElm={
          <div>
            <Typography variant="body2" color="text.secondary" align="right" fontWeight="500">{`1 ${
              currencies[Field.CURRENCY_A]?.symbol
            } = ${price?.toSignificant(6) ?? '-'} ${currencies[Field.CURRENCY_B]?.symbol}`}</Typography>
            <Typography variant="body2" color="text.secondary" align="right" fontWeight="500">{`1 ${
              currencies[Field.CURRENCY_B]?.symbol
            } = ${price?.invert()?.toSignificant(6) ?? '-'} ${currencies[Field.CURRENCY_A]?.symbol}`}</Typography>
          </div>
        }
        sx={{ alignItems: 'flex-start' }}
      />

      <SpaceBetweenFormat
        mb={1.5}
        title="Share of Pool"
        value={`${
          noLiquidity && price
            ? '100'
            : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'
        }
        %`}
        sx={{ alignItems: 'flex-start' }}
      />
    </div>
  )
}

export default PoolPriceBar

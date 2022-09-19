import { ErrorRounded } from '@mui/icons-material'
import { Button, Typography } from '@mui/material'
import { Currency, CurrencyAmount, Percent, Price } from 'definixswap-sdk'
import React from 'react'
import { Field } from 'state/mint/actions'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { PoolPriceBar } from './PoolPriceBar'

function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
  allowedSlippage,
  isPending,
}: {
  noLiquidity?: boolean
  price?: Price
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
  allowedSlippage: number
  isPending: boolean
}) {
  return (
    <div>
      <Typography fontWeight={500} color="text.secondary" mb={1.5}>
        Estimated Returns
      </Typography>

      <SpaceBetweenFormat
        title="Deposited"
        valueElm={
          <div>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: { md: 'right' } }} fontWeight="500">
              {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: { md: 'right' } }} fontWeight="500">
              {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
            </Typography>
          </div>
        }
        sx={{ alignItems: 'flex-start' }}
        mb={1.5}
      />

      <PoolPriceBar
        currencies={currencies}
        poolTokenPercentage={poolTokenPercentage}
        noLiquidity={noLiquidity}
        price={price}
      />

      {!noLiquidity && (
        <Typography variant="caption" color="text.disabled" display="flex" mt={2.5}>
          <ErrorRounded sx={{ fontSize: '0.875rem', color: 'text.disabled', mr: 1, mt: '2px' }} /> You are the first
          liquidity Output is estimated. If the price changes by more than 0.5% your transaction will revert.
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={onAdd}
        fullWidth
        size="large"
        // scale={ButtonScales.LG}
        // isLoading={isPending}
        style={{ marginTop: 32 }}
      >
        {noLiquidity ? 'Create Pool & Supply' : 'Add Liquidity'}
      </Button>
    </div>
  )
}

export default ConfirmAddModalBottom

import { Button } from '@mui/material'
import { Trade } from 'definixswap-sdk'
import React, { useMemo } from 'react'
import { computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'
import AdvancedSwapDetailsDropdown from './AdvancedSwapDetailsDropdown'
import { SwapCallbackError } from './styleds'

export default function SwapModalFooter({
  trade,
  onConfirm,
  allowedSlippage,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Trade
  allowedSlippage: number
  onConfirm: () => void
  swapErrorMessage: string | undefined
  disabledConfirm: boolean
}) {
  const { priceImpactWithoutFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  const severity = warningSeverity(priceImpactWithoutFee)

  return (
    <>
      <AdvancedSwapDetailsDropdown trade={trade} />

      <Button
        onClick={onConfirm}
        disabled={disabledConfirm}
        variant="contained"
        size="large"
        id="confirm-swap-or-send"
        fullWidth
        sx={{ mt: 1.5 }}
      >
        {severity > 2 ? 'Swap Anyway' : 'Confirm Swap'}
      </Button>

      {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
    </>
  )
}

import { Divider } from '@mui/material'
import { currencyEquals, Trade } from 'definixswap-sdk'
import React, { useMemo } from 'react'
import { Box } from 'uikit-dev'
import ModalV2 from 'uikitV2/components/ModalV2'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

/**
 * Returns true if the trade requires a confirmation of details before we can submit it
 * @param tradeA trade A
 * @param tradeB trade B
 */
function tradeMeaningfullyDiffers(tradeA: Trade, tradeB: Trade): boolean {
  return (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(tradeA.inputAmount.currency, tradeB.inputAmount.currency) ||
    !tradeA.inputAmount.equalTo(tradeB.inputAmount) ||
    !currencyEquals(tradeA.outputAmount.currency, tradeB.outputAmount.currency) ||
    !tradeA.outputAmount.equalTo(tradeB.outputAmount)
  )
}

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  txHash,
}: {
  trade: Trade | undefined
  originalTrade: Trade | undefined
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: number
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  return (
    <ModalV2 title="Confirm Swap" onDismiss={onDismiss} sx={{ width: '100%', maxWidth: '520px' }}>
      {!txHash && trade && (
        <>
          <SwapModalHeader
            trade={trade}
            allowedSlippage={allowedSlippage}
            recipient={recipient}
            showAcceptChanges={showAcceptChanges}
            onAcceptChanges={onAcceptChanges}
          />

          <Divider style={{ marginTop: 20, marginBottom: 24 }} />

          <SwapModalFooter
            onConfirm={onConfirm}
            trade={trade}
            disabledConfirm={showAcceptChanges}
            swapErrorMessage={swapErrorMessage}
            allowedSlippage={allowedSlippage}
          />
        </>
      )}
    </ModalV2>
  )
}

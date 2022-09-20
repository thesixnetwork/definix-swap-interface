import { Divider } from '@mui/material'
import { currencyEquals, Trade } from 'definixswap-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { Box, useMatchBreakpoints } from 'uikit-dev'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import { useSwapCallback } from 'hooks/useSwapCallback'
import { useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { ALLOWED_PRICE_IMPACT_HIGH, BLOCKED_PRICE_IMPACT_NON_EXPERT } from 'constants/index'
import { computeTradePriceBreakdown } from 'utils/prices'
import ModalV2 from 'uikitV2/components/ModalV2'
import { useToast } from 'hooks'
import { ModalBody } from '@fingerlabs/definixswap-uikit-v2'
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

// export default function ConfirmSwapModal({
//   trade,
//   originalTrade,
//   onAcceptChanges,
//   allowedSlippage,
//   onConfirm,
//   onDismiss,
//   recipient,
//   swapErrorMessage,
//   txHash,
// }: {
//   trade: Trade | undefined
//   originalTrade: Trade | undefined
//   txHash: string | undefined
//   recipient: string | null
//   allowedSlippage: number
//   onAcceptChanges: () => void
//   onConfirm: () => void
//   swapErrorMessage: string | undefined
//   onDismiss: () => void
// }) {

export default function ConfirmSwapModal({
  recipient,
  onDismiss = () => null,
  onDismissModal,
}: {
  recipient: string | null
  onDismiss?: () => void
  onDismissModal: () => void
}) {
  const { isXl } = useMatchBreakpoints()
  const isMobile = useMemo(() => !isXl, [isXl])
  const { v2Trade: trade } = useDerivedSwapInfo()
  const [originalTrade, setOriginalTrade] = useState(trade)
  const [isPending, setIsPending] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [errorMessage, setErrorMessage] = useState(undefined)
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const { toastSuccess, toastError } = useToast()
  const { callback: swapCallback } = useSwapCallback(trade, allowedSlippage, deadline, recipient)

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )
  const { priceImpactWithoutFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade])

  const onAcceptChanges = useCallback(() => {
    setOriginalTrade(trade)
  }, [trade])

  const handleSwap = useCallback(() => {
    if (
      priceImpactWithoutFee &&
      !priceImpactWithoutFee.lessThan(ALLOWED_PRICE_IMPACT_HIGH) &&
      priceImpactWithoutFee.lessThan(BLOCKED_PRICE_IMPACT_NON_EXPERT)
    ) {
      if (!window.confirm('This swap has a price impact of at least 5%')) {
        return
      }
    }
    if (!swapCallback) {
      return
    }
    setIsPending(true)
    setTxHash('')
    swapCallback()
      .then((hash) => {
        setTxHash(hash)
        toastSuccess('Swap Complete')
        onDismiss()
        onDismissModal()
      })
      .catch((error) => {
        setErrorMessage(error.message)
        toastError('Swap Failed')
        onDismiss()
        onDismissModal()
      })
  }, [priceImpactWithoutFee, swapCallback, toastSuccess, onDismiss, onDismissModal, toastError])

  return (
    <ModalV2 title="Confirm Swap" onDismiss={onDismiss} sx={{ width: '100%', maxWidth: '520px' }}>
      <ModalBody isBody>
        <Box width={isMobile ? '100%' : '472px'} height={isMobile ? '100vh' : '100%'}>
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
                onConfirm={handleSwap}
                trade={trade}
                disabledConfirm={showAcceptChanges}
                swapErrorMessage={errorMessage}
                allowedSlippage={allowedSlippage}
              />
            </>
          )}
        </Box>
      </ModalBody>
    </ModalV2>
  )
}

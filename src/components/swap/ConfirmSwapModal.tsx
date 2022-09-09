import { ModalBody } from '@fingerlabs/definixswap-uikit-v2'
import { Divider } from '@mui/material'
import { currencyEquals, Trade } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import React, { useCallback, useMemo } from 'react'
import { Box, Button, Modal, useMatchBreakpoints } from 'uikit-dev'
import swap from 'uikit-dev/animation/swap.json'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from '../TransactionConfirmationModal'
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
  isOpen,
  attemptingTxn,
  txHash,
}: {
  isOpen: boolean
  trade: Trade | undefined
  originalTrade: Trade | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: number
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: string | undefined
  onDismiss: () => void
}) {
  const { isXl } = useMatchBreakpoints()
  const isMobile = !isXl
  const { chainId } = useActiveWeb3React()

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const modalHeader = useCallback(() => {
    return trade ? (
      <SwapModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade])

  const modalHeaderWithoutAction = useCallback(() => {
    return trade ? <SwapModalHeader trade={trade} onlyCurrency /> : null
  }, [trade])

  const modalBottom = useCallback(() => {
    return trade ? (
      <SwapModalFooter
        onConfirm={onConfirm}
        trade={trade}
        disabledConfirm={showAcceptChanges}
        swapErrorMessage={swapErrorMessage}
        allowedSlippage={allowedSlippage}
      />
    ) : null
  }, [allowedSlippage, onConfirm, showAcceptChanges, swapErrorMessage, trade])

  const confirmContent = useCallback(
    () => (
      <ConfirmationModalContent
        mainTitle="Confirm Swap"
        title=""
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    ),
    [modalBottom, modalHeader]
  )

  const submittedContent = useCallback(
    () => (
      <TransactionSubmittedContent
        title="Swap Complete"
        date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
        chainId={chainId}
        hash={txHash}
        content={modalHeaderWithoutAction}
        button={
          <Button onClick={onDismiss} radii="card" fullWidth>
            Back to Swap
          </Button>
        }
      />
    ),
    [chainId, modalHeaderWithoutAction, onDismiss, txHash]
  )

  const errorContent = useCallback(
    () => (
      <TransactionErrorContent
        title="Swap Failed"
        date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
        chainId={chainId}
        hash={txHash}
        content={modalHeaderWithoutAction}
        button={
          <Button onClick={onDismiss} radii="card" fullWidth>
            Back to Swap
          </Button>
        }
      />
    ),
    [chainId, modalHeaderWithoutAction, onDismiss, txHash]
  )

  return (
    <Modal title="Confirm Swap" onDismiss={onDismiss}>
      <ModalBody isBody>
        <Box width={isMobile ? '100%' : '472px'} height={isMobile ? '100vh' : '100%'}>
          {!txHash && trade && (
            <>
              <SwapModalHeader
                trade={trade}
                // allowedSlippage={allowedSlippage}
                // recipient={recipient}
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
        </Box>
      </ModalBody>
    </Modal>
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      isPending={attemptingTxn}
      isSubmitted={!!txHash}
      isError={!!swapErrorMessage}
      confirmContent={confirmContent}
      pendingIcon={swap}
      submittedContent={submittedContent}
      errorContent={errorContent}
      onDismiss={onDismiss}
    />
  )
}

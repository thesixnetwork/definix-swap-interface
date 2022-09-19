import React, { useCallback, useState, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { textStyle } from 'uikitV2/text'
import { Button, Divider } from '@mui/material'
import ModalV2 from 'uikitV2/components/ModalV2'
import { Box, Flex, Text } from 'uikit-dev'
import Lp from 'components/Lp'
import Coin from 'uikitV2/components/Coin'
import { InjectedModalProps, NotiIcon, ModalBody, useMatchBreakpoints } from '@fingerlabs/definixswap-uikit-v2'
import { Currency, Percent, TokenAmount, CurrencyAmount, Pair, Token, ETHER } from 'definixswap-sdk'

// import { useToast } from 'state/toasts/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { Field } from 'state/burn/actions'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'

import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import { useActiveWeb3React } from 'hooks'
import { ROUTER_ADDRESS } from '../../constants'
import { useUserDeadline, useUserSlippageTolerance } from '../../state/user/hooks'

interface IProps extends InjectedModalProps {
  currencyA: Currency | undefined
  currencyB: Currency | undefined
  parsedAmounts: {
    LIQUIDITY_PERCENT: Percent
    LIQUIDITY?: TokenAmount
    CURRENCY_A?: CurrencyAmount
    CURRENCY_B?: CurrencyAmount
  }
  pair: Pair | null | undefined
  tokenA: Token | undefined
  tokenB: Token | undefined
  signatureData: { v: number; r: string; s: string; deadline: number } | null
  onDismissModal: () => void
  onUserInput: (field: Field, val: string) => void
  successTxCallback?: any
}

const StyledNotiIcon = styled(NotiIcon)`
  flex-shrink: 0;
`

export default function ConfirmRemoveModal({
  onDismiss,
  currencyA,
  currencyB,
  parsedAmounts,
  pair,
  tokenA,
  tokenB,
  signatureData,
  onDismissModal,
  onUserInput,
  successTxCallback,
}: IProps) {
  const addTransaction = useTransactionAdder()
  const { account, chainId, library } = useActiveWeb3React()
  const [approval] = useApproveCallback(
    parsedAmounts[Field.LIQUIDITY],
    ROUTER_ADDRESS[chainId || parseInt(process.env.REACT_APP_CHAIN_ID || '0')]
  )
  //   const { toastSuccess, toastError } = useToast()

  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const { isXl, isXxl } = useMatchBreakpoints()
  const isMobile = useMemo(() => !isXl && !isXxl, [isXl, isXxl])

  const onRemove = useCallback(async () => {
    if (!chainId || !library || !account) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const router = getRouterContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0],
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH
    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[]
    let args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadlineFromNow,
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadlineFromNow,
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          currencyBIsETH ? tokenA.address : tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          signatureData.v,
          signatureData.r,
          signatureData.s,
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }
    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName, index) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((e) => {
            console.error(`estimateGas failed`, index, methodName, args, e)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate,
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            type: 'removeLiquidity',
            data: {
              firstToken: currencyA?.symbol,
              firstTokenAmount: parsedAmounts[Field.CURRENCY_A]?.toSignificant(3),
              secondToken: currencyB?.symbol,
              secondTokenAmount: parsedAmounts[Field.CURRENCY_B]?.toSignificant(3),
            },
            summary: `Remove ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
              currencyA?.symbol
            } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencyB?.symbol}`,
          })

          setTxHash(response.hash)
        })
        .catch((e: Error) => {
          setAttemptingTxn(false)
          setErrorMsg(e.message)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(e)
        })
    }
  }, [
    account,
    addTransaction,
    allowedSlippage,
    approval,
    chainId,
    currencyA,
    currencyB,
    deadline,
    library,
    parsedAmounts,
    signatureData,
    tokenA,
    tokenB,
  ])

  useEffect(() => {
    if (txHash) {
      //   toastSuccess(
      //     t('{{Action}} Complete', {
      //       Action: t('actionRemove Liquidty'),
      //     }),
      //     <KlaytnScopeLink hash={txHash} />
      //   )
      if (successTxCallback) successTxCallback()
      if (onDismiss) onDismiss()
    }
  }, [txHash, onDismissModal, onDismiss, successTxCallback])

  useEffect(() => {
    if (errorMsg) {
      //   toastError(
      //     t('{{Action}} Failed', {
      //       Action: t('actionRemove Liquidty'),
      //     })
      //   )

      if (onDismiss) onDismiss()
    }
  }, [errorMsg, onDismissModal, onDismiss])

  useEffect(() => {
    return () => onUserInput(Field.LIQUIDITY_PERCENT, '0')
  }, [onUserInput])

  return (
    <ModalV2 title="Confirm Remove Liquidity" onDismiss={onDismiss}>
      <ModalBody isBody>
        <Box width={isMobile ? '100%' : '472px'} height={isMobile ? '100vh' : '100%'}>
          <Flex flexDirection="column" mb="20px" mt="16px">
            <Text style={textStyle.R_16M} color="#666">
              LP amount before removal
            </Text>
            <Flex justifyContent="space-between" alignItems="center" p="14px 0px" mb="20px">
              <Flex alignItems="center">
                {currencyA && currencyB && <Lp size={32} lpSymbols={[currencyA, currencyB]} />}
                <Text ml="10px" style={textStyle.R_16M} color="#222">
                  {currencyA?.symbol}-{currencyB?.symbol}
                </Text>
              </Flex>
              <Text style={textStyle.R_16R} color="#222">
                {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) || 0}
              </Text>
            </Flex>

            <Text style={textStyle.R_16M} color="#666">
              You will receive
            </Text>
            <Flex justifyContent="space-between" alignItems="center" p="14px 0px">
              <Flex alignItems="center">
                <Coin symbol={currencyA?.symbol} size={32} />
                <Text style={textStyle.R_16M} color="#222" ml="10px">
                  {currencyA?.symbol}
                </Text>
              </Flex>
              <Text style={textStyle.R_16R} color="#222">
                {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || 0}
              </Text>
            </Flex>

            <Flex justifyContent="space-between" alignItems="center" p="14px 0px">
              <Flex alignItems="center">
                <Coin symbol={currencyB?.symbol} size={32} />
                <Text style={textStyle.R_16M} color="#222" ml="10px">
                  {currencyB?.symbol}
                </Text>
              </Flex>
              <Text style={textStyle.R_16R} color="#222">
                {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || 0}
              </Text>
            </Flex>
          </Flex>
          <Divider style={{ marginBottom: 24, marginTop: 35 }} />
          <Flex flexDirection="column">
            <Flex>
              <Text style={textStyle.R_16M} color="#666">
                Estimated Returns
              </Text>
            </Flex>
            {pair && (
              <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mt="12px">
                <Text style={textStyle.R_14R} color="#999" mb={isMobile ? '4px' : '0px'}>
                  Price Rate
                </Text>
                <Flex flexDirection="column" alignItems={isMobile ? 'flex-start' : 'flex-end'}>
                  <Text style={textStyle.R_14M} color="#666">
                    1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                  </Text>
                  <Text style={textStyle.R_14M} color="#666">
                    1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                  </Text>
                </Flex>
              </Flex>
            )}
            <Flex alignItems="flex-start" mt="20px">
              <StyledNotiIcon />
              <Text ml="4px" style={textStyle.R_12R} color="#999">
                {`Output is estimated. If the price changes by more than ${
                  allowedSlippage / 100
                }% your transaction will revert.`}
              </Text>
            </Flex>
            <Button
              style={{ marginTop: 32 }}
              disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
              onClick={onRemove}
              variant="contained"
              color="primary"
              //   scale={ButtonScales.LG}
              //   isLoading={attemptingTxn}
            >
              Remove
            </Button>
          </Flex>
        </Box>
      </ModalBody>
    </ModalV2>
  )
}

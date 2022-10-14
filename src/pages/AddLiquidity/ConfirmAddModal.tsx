import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { InjectedModalProps, useMatchBreakpoints } from '@fingerlabs/definixswap-uikit-v2'
import { Divider } from '@mui/material'
import { Currency, CurrencyAmount, ETHER, Percent, Price, TokenAmount } from 'definixswap-sdk'
import { useActiveWeb3React, useToast } from 'hooks'
import React, { useEffect, useMemo, useState } from 'react'
import { useAddPopup } from 'state/application/hooks'
import { Field } from 'state/mint/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import ModalV2 from 'uikitV2/components/ModalV2'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import ConfirmAddModalBottom from './ConfirmAddModalBottom'
import ModalHeader from './ModalHeader'

interface Props extends InjectedModalProps {
  noLiquidity?: boolean
  currencies: {
    CURRENCY_A?: Currency
    CURRENCY_B?: Currency
  }
  liquidityMinted?: TokenAmount
  price?: Price
  parsedAmounts: {
    CURRENCY_A?: CurrencyAmount
    CURRENCY_B?: CurrencyAmount
  }
  poolTokenPercentage?: Percent
  onDismissModal: () => void
  currencyA: any
  currencyB: any
  onFieldAInput: (typedValue: string) => void
  onFieldBInput: (typedValue: string) => void
}

export default function ConfirmAddModal({
  noLiquidity,
  currencies,
  liquidityMinted,
  price,
  parsedAmounts,
  poolTokenPercentage,
  onDismiss = () => null,
  onDismissModal = () => null,
  currencyA,
  currencyB,
  onFieldAInput,
  onFieldBInput,
}: Props) {
  const { chainId, account, library } = useActiveWeb3React()
  //   const { isKlip, request } = useKlipContract()
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false)
  const [txHash, setTxHash] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()
  const addTransaction = useTransactionAdder()
  const addPopup = useAddPopup()
  // const { toastSuccess, toastError } = useToast()
  const { isXl, isXxl } = useMatchBreakpoints()
  const isMobile = useMemo(() => !isXl && !isXxl, [isXl, isXxl])

  //   const sendDefinixAnalytics = useCallback(() => {
  //     // if (tp.isConnected()) {
  //     //   const firstToken = currencies[Field.CURRENCY_A]
  //     //   const secondToken = currencies[Field.CURRENCY_B]
  //     //   const farm = farms.find(
  //     //     (x) =>
  //     //       x.pid !== 0 &&
  //     //       x.pid !== 1 &&
  //     //       ((x.tokenSymbol === firstToken?.symbol && x.quoteTokenSymbol === secondToken?.symbol) ||
  //     //         (x.tokenSymbol === secondToken?.symbol && x.quoteTokenSymbol === firstToken?.symbol))
  //     //   )
  //     //   if (farm && account) {
  //     //     tp.getDeviceId().then((res) => {
  //     //       sendAnalyticsData(farm.pid, account, res.device_id)
  //     //     })
  //     //   }
  //     // }
  //   }, [account, currencies])

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    const deadlineFromNow = Math.ceil(Date.now() / 1000) + deadline

    let estimate
    let method: (...args: any) => Promise<TransactionResponse>
    let args: Array<string | string[] | number>
    let value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadlineFromNow,
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadlineFromNow,
      ]
      value = null
    }

    setAttemptingTxn(true)
    // const aa = await estimate(...args, value ? { value } : {})
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            type: 'addLiquidity',
            data: {
              firstToken: currencies[Field.CURRENCY_A]?.symbol,
              firstTokenAmount: parsedAmounts[Field.CURRENCY_A]?.toSignificant(3),
              secondToken: currencies[Field.CURRENCY_B]?.symbol,
              secondTokenAmount: parsedAmounts[Field.CURRENCY_B]?.toSignificant(3),
            },
            // summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
            //   currencies[Field.CURRENCY_A]?.symbol
            // } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
            summary: `Add Liquidity Complete`,
          })

          setTxHash(response.hash)
        })
      )
      .catch((e) => {
        setAttemptingTxn(false)

        addPopup({ message: { message: 'Add Liquidity Failed', type: 'error' } })
        // we only care if the error is something _other_ than the user rejected the tx
        if (e?.code !== 4001) {
          console.error(e)
          setErrorMsg(e)
        }
      })
  }

  useEffect(() => {
    if (txHash) {
      // addPopup({ message: { message: 'Add Liquidity Complete', type: 'success' } })
      onFieldAInput('')
      onFieldBInput('')
      onDismiss()
    }
  }, [txHash, onDismissModal, onDismiss, onFieldAInput, onFieldBInput])

  useEffect(() => {
    if (errorMsg) {
      // addPopup({ message: { message: 'Add Liquidity Failed', type: 'error' } })
      onDismiss()
    }
  }, [errorMsg, onDismissModal, onDismiss])

  return (
    <ModalV2 title="Confirm Add Liquidity" onDismiss={onDismiss} sx={{ width: '100%', maxWidth: '520px' }}>
      <ModalHeader noLiquidity={noLiquidity} currencies={currencies} liquidityMinted={liquidityMinted} />
      <Divider style={{ marginBottom: 24, marginTop: 20 }} />
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        isPending={attemptingTxn}
        poolTokenPercentage={poolTokenPercentage}
        allowedSlippage={allowedSlippage}
      />
    </ModalV2>
  )
}

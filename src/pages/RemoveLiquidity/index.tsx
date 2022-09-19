import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import {
  ArrowChangeIcon,
  ChangeBottomIcon,
  ChangePlusIcon,
  CheckBIcon,
  useMatchBreakpoints,
} from '@fingerlabs/definixswap-uikit-v2'
import { Box, Button, Divider } from '@mui/material'
import { BorderCard } from 'components/Card'
import ConnectWalletButton from 'components/ConnectWalletButton'
import RemoveLpInputPanel from 'components/CurrencyInputPanel/RemoveLpInputPanel'
import Lp from 'components/Lp'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { Currency, currencyEquals, ETHER, Percent, WETH } from 'definixswap-sdk'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { RouteComponentProps } from 'react-router'
import { useTokenBalance } from 'state/wallet/hooks'
import { ThemeContext } from 'styled-components'
import { ArrowBackIcon, CardBody, Flex, Text, useModal } from 'uikit-dev'
import { LeftPanel, MaxWidthLeft } from 'uikit-dev/components/TwoPanelLayout'
import Card from 'uikitV2/components/Card'
import Coin from 'uikitV2/components/Coin'
import PageTitle from 'uikitV2/components/PageTitle'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import { textStyle } from 'uikitV2/text'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import { RowBetween, RowFixed } from '../../components/Row'
import { StyledInternalLink } from '../../components/Shared'
import Slider from '../../components/Slider'
import { Dots } from '../../components/swap/styleds'
import { ROUTER_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { usePairContract } from '../../hooks/useContract'
import { Field } from '../../state/burn/actions'
import { useBurnActionHandlers, useBurnState, useDerivedBurnInfo } from '../../state/burn/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useUserDeadline, useUserSlippageTolerance } from '../../state/user/hooks'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { ClickableText, Wrapper } from '../Pool/styleds'
import ConfirmRemoveModal from './ConfirmRemoveModal'

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { isXl, isXxl } = useMatchBreakpoints()
  const isMobile = useMemo(() => !isXl && !isXxl, [isXl, isXxl])
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    currencyA,
    currencyB,
    chainId,
  ])

  const theme = useContext(ThemeContext)

  // burn state
  const { independentField, typedValue } = useBurnState()
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal, loading, error
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm
  const [errorMsg, setErrorMsg] = useState<string>('')

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)

  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], ROUTER_ADDRESS)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair != null ? pair.liquidityToken : undefined)

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')
    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const deadlineForSignature: number = Math.ceil(Date.now() / 1000) + deadline

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]
    const domain = {
      name: 'Definix LPs',
      version: '1',
      chainId,
      verifyingContract: pair.liquidityToken.address,
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ]
    const message = {
      owner: account,
      spender: ROUTER_ADDRESS,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadlineForSignature,
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit,
      },
      domain,
      primaryType: 'Permit',
      message,
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then((signature) => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadlineForSignature,
        })
      })
      .catch((e) => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (e?.code !== 4001) {
          approveCallback()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, val: string) => {
      setSignatureData(null)
      return _onUserInput(field, val)
    },
    [_onUserInput]
  )

  const onLiquidityInput = useCallback((val: string): void => onUserInput(Field.LIQUIDITY, val), [onUserInput])
  const onCurrencyAInput = useCallback((val: string): void => onUserInput(Field.CURRENCY_A, val), [onUserInput])
  const onCurrencyBInput = useCallback((val: string): void => onUserInput(Field.CURRENCY_B, val), [onUserInput])

  // tx sending
  const addTransaction = useTransactionAdder()

  async function onRemove() {
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
  }

  const modalHeader = useCallback(() => {
    return (
      <div>
        <AutoColumn gap="24px">
          <AutoColumn gap="16px">
            <RowBetween align="flex-end">
              <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}</Text>
              <RowFixed mb="0 !important">
                <CurrencyLogo currency={currencyA} size="24px" />
                <Text fontSize="24px" fontWeight="500" style={{ marginLeft: '12px' }}>
                  {currencyA?.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowFixed>
              <Plus size="16" color={theme.colors.textSubtle} />
            </RowFixed>
            <RowBetween align="flex-end">
              <Text fontSize="24px">{parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}</Text>
              <RowFixed mb="0 !important">
                <CurrencyLogo currency={currencyB} size="24px" />
                <Text fontSize="24px" fontWeight="500" style={{ marginLeft: '12px' }}>
                  {currencyB?.symbol}
                </Text>
              </RowFixed>
            </RowBetween>
          </AutoColumn>

          <Text small color="textSubtle" textAlign="left" padding="12px 0 0 0" style={{ fontStyle: 'italic' }}>
            {`Output is estimated. If the price changes by more than ${
              allowedSlippage / 100
            }% your transaction will revert.`}
          </Text>
        </AutoColumn>
      </div>
    )
  }, [allowedSlippage, currencyA, currencyB, parsedAmounts, theme.colors.textSubtle])

  // const modalBottom = () => {
  //   return (
  //     <AutoColumn gap="16px">
  //       <RowBetween>
  //         <Text color="textSubtle">{`FLIP ${currencyA?.symbol}/${currencyB?.symbol}`} Burned</Text>
  //         <RowFixed>
  //           <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin />
  //           <Text>{parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}</Text>
  //         </RowFixed>
  //       </RowBetween>
  //       {pair && (
  //         <>
  //           <RowBetween>
  //             <Text color="textSubtle">Price</Text>
  //             <Text>
  //               1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
  //             </Text>
  //           </RowBetween>
  //           <RowBetween>
  //             <div />
  //             <Text>
  //               1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
  //             </Text>
  //           </RowBetween>
  //         </>
  //       )}
  //       <Button
  //         disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)}
  //         onClick={onRemove}
  //         fullWidth
  //         radii="card"
  //       >
  //         Confirm
  //       </Button>
  //     </AutoColumn>
  //   )
  // }

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const oneCurrencyIsETH = currencyA === ETHER || currencyB === ETHER
  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  )

  // const handleSelectCurrencyA = useCallback(
  //   (currency: Currency) => {
  //     if (currencyIdB && currencyId(currency) === currencyIdB) {
  //       history.push(`/liquidity/remove/${currencyId(currency)}/${currencyIdA}`)
  //     } else {
  //       history.push(`/liquidity/remove/${currencyId(currency)}/${currencyIdB}`)
  //     }
  //   },
  //   [currencyIdA, currencyIdB, history]
  // )
  // const handleSelectCurrencyB = useCallback(
  //   (currency: Currency) => {
  //     if (currencyIdA && currencyId(currency) === currencyIdA) {
  //       history.push(`/liquidity/remove/${currencyIdB}/${currencyId(currency)}`)
  //     } else {
  //       history.push(`/liquidity/remove/${currencyIdA}/${currencyId(currency)}`)
  //     }
  //   },
  //   [currencyIdA, currencyIdB, history]
  // )

  // const handleDismissConfirmation = useCallback(() => {
  //   setShowConfirm(false)
  //   setSignatureData(null) // important that we clear signature data to avoid bad sigs
  //   // if there was a tx hash, we want to clear the input
  //   if (txHash) {
  //     onUserInput(Field.LIQUIDITY_PERCENT, '0')
  //   }
  //   setTxHash('')
  //   setErrorMsg('')
  // }, [onUserInput, txHash])

  // const submittedContent = useCallback(
  //   () => (
  //     <TransactionSubmittedContent
  //       title="Remove Liquidity Complete"
  //       date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
  //       chainId={chainId}
  //       hash={txHash}
  //       content={modalHeader}
  //       button={
  //         <Button
  //           onClick={() => {
  //             console.log('Remove this Liquidity from Farm')
  //           }}
  //           radii="card"
  //           fullWidth
  //         >
  //           Remove this Liquidity from Farm
  //         </Button>
  //       }
  //     />
  //   ),
  //   [chainId, modalHeader, txHash]
  // )

  // const errorContent = useCallback(
  //   () => (
  //     <TransactionErrorContent
  //       title="Remove Liquidity Failed"
  //       date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
  //       chainId={chainId}
  //       hash={txHash}
  //       content={modalHeader}
  //       button={
  //         <Button
  //           onClick={() => {
  //             console.log('Remove Liquidity Again')
  //           }}
  //           radii="card"
  //           fullWidth
  //         >
  //           Remove Liquidity Again
  //         </Button>
  //       }
  //     />
  //   ),
  //   [chainId, modalHeader, txHash]
  // )

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )

  const handleDismissConfirmation = useCallback(() => {
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    onUserInput(Field.LIQUIDITY_PERCENT, '0')
  }, [onUserInput])

  const [onPresentConfirmRemoveModal] = useModal(
    <ConfirmRemoveModal
      currencyA={currencyA}
      currencyB={currencyB}
      parsedAmounts={parsedAmounts}
      pair={pair}
      tokenA={tokenA}
      tokenB={tokenB}
      signatureData={signatureData}
      onDismissModal={handleDismissConfirmation}
      onUserInput={onUserInput}
      successTxCallback={() => history.replace('/liquidity/list')}
    />
  )

  return (
    <SmallestLayout>
      <Flex flexDirection="column" width={isMobile ? '100%' : '629px'}>
        <Flex mb="20px" onClick={() => history.replace('/liquidity/list')} style={{ cursor: 'pointer' }}>
          <ArrowBackIcon />
          <Text
            ml="6px"
            style={isMobile ? textStyle.R_14M : textStyle.R_16M}
            color="#999"
            mt={isMobile ? '0px' : '-2px'}
          >
            Back
          </Text>
        </Flex>

        <PageTitle
          title="Liquidity"
          caption="Remove LP and take back tokens"
          link="https://sixnetwork.gitbook.io/definix/exchange/how-to-add-liquidity"
          linkLabel="Learn how to add Liquidity."
        />
      </Flex>

      {account && (
        <Card>
          <CardBody p={isMobile ? '20px' : '40px'}>
            <Flex flexDirection="column" mb="20px">
              <Flex justifyContent={isMobile ? 'flex-start' : 'flex-start'} alignItems="center" mb="20px">
                {currencyA && currencyB && <Lp size={isMobile ? 36 : 40} lpSymbols={[currencyA, currencyB]} />}
                <Flex
                  flexDirection={isMobile ? 'column' : 'row'}
                  justifyContent={isMobile ? 'flex-start' : 'space-between'}
                  flex="1 1 0"
                >
                  <Text style={isMobile ? textStyle.R_16M : textStyle.R_18M} color="#222">
                    {currencyA?.symbol}-{currencyB?.symbol}
                  </Text>
                  <Flex alignItems="center">
                    <Text style={textStyle.R_14R} color="#666" mr="5px">
                      Balance
                    </Text>
                    <Text style={textStyle.R_14B} color="#666">
                      {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>

              <Flex width="100%" flexDirection="column">
                <Flex justifyContent="space-between">
                  <Flex flexDirection="row" alignItems="baseline">
                    <Text fontSize="20px">{formattedAmounts[Field.LIQUIDITY_PERCENT]}</Text>
                    <Text ml="2px" color="#999" fontSize="16px">
                      %
                    </Text>
                  </Flex>

                  <Box
                    onClick={() => {
                      setShowDetailed(!showDetailed)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Text color="#999" style={{ ...textStyle.R_14R, textDecoration: 'underline' }}>
                      {showDetailed ? 'Simple' : 'Detail'}
                    </Text>
                  </Box>
                </Flex>

                <Slider
                  min={0}
                  max={100}
                  value={innerLiquidityPercentage}
                  onValueChanged={setInnerLiquidityPercentage}
                  valueLabel={String(innerLiquidityPercentage)}
                />
              </Flex>
            </Flex>

            {showDetailed && (
              <>
                <Flex flexDirection="column">
                  <RemoveLpInputPanel
                    value={formattedAmounts[Field.LIQUIDITY]}
                    onUserInput={onLiquidityInput}
                    onMax={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '100')
                    }}
                    onQuarter={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '25')
                    }}
                    onHalf={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '50')
                    }}
                    currencyA={currencyA}
                    currencyB={currencyB}
                  />

                  <Flex justifyContent="center">
                    <ChangeBottomIcon />
                  </Flex>

                  <RemoveLpInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onCurrencyAInput}
                    onMax={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '100')
                    }}
                    onQuarter={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '25')
                    }}
                    onHalf={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '50')
                    }}
                    currency={currencyA}
                  />

                  <Flex justifyContent="center">
                    <ChangePlusIcon />
                  </Flex>

                  <RemoveLpInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onCurrencyBInput}
                    onMax={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '100')
                    }}
                    onQuarter={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '25')
                    }}
                    onHalf={() => {
                      onUserInput(Field.LIQUIDITY_PERCENT, '50')
                    }}
                    currency={currencyB}
                  />
                </Flex>
              </>
            )}

            <Divider style={{ marginTop: isMobile ? 24 : 32, marginBottom: isMobile ? 24 : 32 }} />

            <Flex width="100%" flexDirection="column">
              <Flex justifyContent="space-between" alignItems="center" mb="14px">
                <Text style={textStyle.R_16M} color="#666">
                  You will receive
                </Text>

                {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                  <Flex alignItems="center">
                    {oneCurrencyIsETH ? (
                      <StyledInternalLink
                        to={`/liquidity/remove/${currencyA === ETHER ? WETH[chainId].address : currencyIdA}/${
                          currencyB === ETHER ? WETH[chainId].address : currencyIdB
                        }`}
                      >
                        <Flex alignItems="center">
                          <Text mr="4px" style={{ textDecoration: 'underline' }}>
                            Receive WBNB
                          </Text>
                          <ArrowChangeIcon />
                        </Flex>
                      </StyledInternalLink>
                    ) : oneCurrencyIsWETH ? (
                      <StyledInternalLink
                        to={`/liquidity/remove/${
                          currencyA && currencyEquals(currencyA, WETH[chainId]) ? 'ETH' : currencyIdA
                        }/${currencyB && currencyEquals(currencyB, WETH[chainId]) ? 'ETH' : currencyIdB}`}
                      >
                        <Flex alignItems="center">
                          <Text mr="4px" style={{ textDecoration: 'underline' }}>
                            Receive BNB
                          </Text>
                          <ArrowChangeIcon />
                        </Flex>
                      </StyledInternalLink>
                    ) : null}
                  </Flex>
                ) : null}
              </Flex>

              <Flex
                alignItems="center"
                justifyContent="space-between"
                mb={isMobile ? '10px' : '0'}
                p={isMobile ? '5px 0' : '14px 0'}
              >
                <Flex alignItems="center">
                  <Coin size={isMobile ? 30 : 32} symbol={currencyA?.symbol} />
                  <Text
                    style={isMobile ? textStyle.R_14M : textStyle.R_16M}
                    color="#222"
                    ml="10px"
                    id="remove-liquidity-tokena-symbol"
                  >
                    {currencyA?.symbol}
                  </Text>
                </Flex>
                <Text>{formattedAmounts[Field.CURRENCY_A] || '0'}</Text>
              </Flex>

              <Flex alignItems="center" justifyContent="space-between" p={isMobile ? '5px 0' : '14px 0'}>
                <Flex alignItems="center">
                  <Coin size={isMobile ? 30 : 32} symbol={currencyB?.symbol} />
                  <Text
                    style={isMobile ? textStyle.R_14M : textStyle.R_16M}
                    color="#222"
                    ml="10px"
                    id="remove-liquidity-tokenb-symbol"
                  >
                    {currencyB?.symbol}
                  </Text>
                </Flex>
                <Text>{formattedAmounts[Field.CURRENCY_B] || '0'}</Text>
              </Flex>
            </Flex>

            <Divider style={{ marginTop: isMobile ? 24 : 20, marginBottom: isMobile ? 24 : 32 }} />

            <Flex>
              {!account ? (
                <ConnectWalletButton />
              ) : (
                <Flex flexDirection="column" width="100%">
                  {approval !== ApprovalState.APPROVED && formattedAmounts[Field.LIQUIDITY_PERCENT] !== '0' && (
                    <Flex
                      flexDirection={isMobile ? 'column' : 'row'}
                      justifyContent="space-between"
                      mb={isMobile ? '32px' : '16px'}
                    >
                      <Flex alignItems="center" mb={isMobile ? '8px' : '0px'}>
                        <Box mr="12px">
                          {currencyA && currencyB && <Lp size={32} lpSymbols={[currencyA, currencyB]} />}
                        </Box>
                        <Text style={isMobile ? textStyle.R_16M : textStyle.R_18M} color="#999">
                          {currencyA?.symbol}-{currencyB?.symbol}
                        </Text>
                      </Flex>

                      <Button
                        style={{ ...textStyle.R_14B, width: isMobile ? '100%' : 186 }}
                        // onClick={onClickApproveButton}
                        // // scale={ButtonScales.LG}
                        // // xs={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                        disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                        // // isLoading={isApprovePending}
                        variant={
                          approval !== ApprovalState.NOT_APPROVED || signatureData !== null ? 'outlined' : 'contained'
                        }
                        color="secondary"
                        startIcon={
                          approval !== ApprovalState.NOT_APPROVED || signatureData !== null ? <CheckBIcon /> : undefined
                        }
                      >
                        Approve to LP
                      </Button>
                    </Flex>
                  )}

                  <Button
                    onClick={() => {
                      onPresentConfirmRemoveModal()
                    }}
                    disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                    // scale={ButtonScales.LG}
                    fullWidth
                    style={{ ...textStyle.R_16B }}
                    variant="contained"
                    color="primary"
                  >
                    Remove
                  </Button>
                </Flex>
              )}
            </Flex>

            {pair && (
              <Flex flexDirection="column" width="100%" mt="24px">
                <Text style={textStyle.R_16M} color="#666" mb="12px">
                  Estimated Returns
                </Text>
                <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between">
                  <Text mb={isMobile ? '4px' : '0px'} style={textStyle.R_14R} color="#999">
                    Price Rate
                  </Text>
                  <Flex flexDirection="column" alignItems="flex-end">
                    <Text style={textStyle.R_14M} color="#666">
                      1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                    </Text>
                    <Text style={textStyle.R_14M} color="#666">
                      1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            )}
          </CardBody>
        </Card>
      )}
    </SmallestLayout>
  )

  // return (
  // <SmallestLayout>
  //   <Flex flexDirection="column" width={isMobile ? '100%' : '629px'} mb="40px">
  //     <Flex mb="20px" onClick={() => history.replace('/liquidity/list')} style={{ cursor: 'pointer' }}>
  //       <ArrowBackIcon />
  //       <Text
  //         ml="6px"
  //         style={isMobile ? textStyle.R_14M : textStyle.R_16M}
  //         color="#999"
  //         mt={isMobile ? '0px' : '-2px'}
  //       >
  //         Back
  //       </Text>
  //     </Flex>

  //     <PageTitle
  //       title="Liquidity"
  //       caption="Remove LP and take back tokens"
  //       link="https://sixnetwork.gitbook.io/definix/exchange/how-to-add-liquidity"
  //       linkLabel="Learn how to add Liquidity."
  //     />
  //   </Flex>

  //   <Card>
  //     <CardBody p="40px !important">
  //       <AutoColumn>
  //         <RowBetween>
  //           <Text>Amount</Text>
  //           <ClickableText
  //             onClick={() => {
  //               setShowDetailed(!showDetailed)
  //             }}
  //           >
  //             {showDetailed ? 'Simple' : 'Detailed'}
  //           </ClickableText>
  //         </RowBetween>
  //         <Flex justifyContent="start">
  //           <Text fontSize="64px">{formattedAmounts[Field.LIQUIDITY_PERCENT]}%</Text>
  //         </Flex>
  //         {!showDetailed && (
  //           <>
  //             <Flex mb="8px">
  //               <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
  //             </Flex>
  //             <Flex justifyContent="space-around">
  //               <Button variant="tertiary" size="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>
  //                 25%
  //               </Button>
  //               <Button variant="tertiary" size="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>
  //                 50%
  //               </Button>
  //               <Button variant="tertiary" size="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>
  //                 75%
  //               </Button>
  //               <Button variant="tertiary" size="sm" onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
  //                 Max
  //               </Button>
  //             </Flex>
  //           </>
  //         )}
  //       </AutoColumn>

  //       {!showDetailed && (
  //         <>
  //           <ColumnCenter className="mb-4">
  //             <ArrowDown size="16" color={theme.colors.textSubtle} />
  //           </ColumnCenter>

  //           <BorderCard>
  //             <AutoColumn gap="10px">
  //               <RowBetween>
  //                 <Text fontSize="24px">{formattedAmounts[Field.CURRENCY_A] || '-'}</Text>
  //                 <RowFixed>
  //                   <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
  //                   <Text fontSize="24px" id="remove-liquidity-tokena-symbol">
  //                     {currencyA?.symbol}
  //                   </Text>
  //                 </RowFixed>
  //               </RowBetween>
  //               <RowBetween>
  //                 <Text fontSize="24px">{formattedAmounts[Field.CURRENCY_B] || '-'}</Text>
  //                 <RowFixed>
  //                   <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
  //                   <Text fontSize="24px" id="remove-liquidity-tokenb-symbol">
  //                     {currencyB?.symbol}
  //                   </Text>
  //                 </RowFixed>
  //               </RowBetween>
  //               {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
  //                 <RowBetween style={{ justifyContent: 'flex-end' }}>
  //                   {oneCurrencyIsETH ? (
  //                     <StyledInternalLink
  //                       to={`/liquidity/remove/${currencyA === ETHER ? WETH[chainId].address : currencyIdA}/${
  //                         currencyB === ETHER ? WETH[chainId].address : currencyIdB
  //                       }`}
  //                     >
  //                       Receive WBNB
  //                     </StyledInternalLink>
  //                   ) : oneCurrencyIsWETH ? (
  //                     <StyledInternalLink
  //                       to={`/liquidity/remove/${
  //                         currencyA && currencyEquals(currencyA, WETH[chainId]) ? 'ETH' : currencyIdA
  //                       }/${currencyB && currencyEquals(currencyB, WETH[chainId]) ? 'ETH' : currencyIdB}`}
  //                     >
  //                       Receive BNB
  //                     </StyledInternalLink>
  //                   ) : null}
  //                 </RowBetween>
  //               ) : null}
  //             </AutoColumn>
  //           </BorderCard>
  //         </>
  //       )}

  //       {showDetailed && (
  //         <>
  //           <CurrencyInputPanel
  //             value={formattedAmounts[Field.LIQUIDITY]}
  //             onUserInput={onLiquidityInput}
  //             onMax={() => {
  //               onUserInput(Field.LIQUIDITY_PERCENT, '100')
  //             }}
  //             onQuarter={() => {
  //               onUserInput(Field.LIQUIDITY_PERCENT, '25')
  //             }}
  //             onHalf={() => {
  //               onUserInput(Field.LIQUIDITY_PERCENT, '50')
  //             }}
  //             showMaxButton={!atMaxAmount}
  //             disableCurrencySelect
  //             currency={pair?.liquidityToken}
  //             pair={pair}
  //             id="liquidity-amount"
  //             className="mb-4"
  //           />

  //           <ColumnCenter className="mb-4">
  //             <ArrowDown size="16" color={theme.colors.textSubtle} />
  //           </ColumnCenter>

  //           <CurrencyInputPanel
  //             hideBalance
  //             value={formattedAmounts[Field.CURRENCY_A]}
  //             onUserInput={onCurrencyAInput}
  //             onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
  //             onHalf={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}
  //             onQuarter={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}
  //             showMaxButton={!atMaxAmount}
  //             currency={currencyA}
  //             label="Output"
  //             onCurrencySelect={handleSelectCurrencyA}
  //             id="remove-liquidity-tokena"
  //             className="mb-4"
  //           />

  //           <ColumnCenter className="mb-4">
  //             <Plus size="16" color={theme.colors.textSubtle} />
  //           </ColumnCenter>

  //           <CurrencyInputPanel
  //             hideBalance
  //             value={formattedAmounts[Field.CURRENCY_B]}
  //             onUserInput={onCurrencyBInput}
  //             onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
  //             showMaxButton={!atMaxAmount}
  //             currency={currencyB}
  //             label="Output"
  //             onCurrencySelect={handleSelectCurrencyB}
  //             id="remove-liquidity-tokenb"
  //           />
  //         </>
  //       )}

  //       {pair && (
  //         <div className="mt-4">
  //           <Flex justifyContent="space-between" mb="8px">
  //             Price:
  //             <div>
  //               1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
  //             </div>
  //           </Flex>
  //           <Flex justifyContent="space-between">
  //             <div />
  //             <div>
  //               1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
  //             </div>
  //           </Flex>
  //         </div>
  //       )}
  //     </CardBody>

  //     <div className="pa-6 bd-t">
  //       {!account ? (
  //         <ConnectWalletButton fullWidth />
  //       ) : (
  //         <RowBetween>
  //           <Button
  //             onClick={onAttemptToApprove}
  //             variant={approval === ApprovalState.APPROVED || signatureData !== null ? 'success' : 'primary'}
  //             disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
  //             mr="8px"
  //           >
  //             {approval === ApprovalState.PENDING ? (
  //               <Dots>Approving</Dots>
  //             ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
  //               'Approved'
  //             ) : (
  //               'Approve'
  //             )}
  //           </Button>
  //           <Button
  //             onClick={() => {
  //               setShowConfirm(true)
  //             }}
  //             disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
  //             variant={
  //               !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
  //                 ? 'danger'
  //                 : 'primary'
  //             }
  //           >
  //             {error || 'Remove'}
  //           </Button>
  //         </RowBetween>
  //       )}
  //     </div>

  //     {pair ? (
  //       <div className="pa-6 bd-t">
  //         <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
  //       </div>
  //     ) : null}
  //   </Card>
  // </SmallestLayout>
  //   ) : (
  //     <TransactionConfirmationModal
  //       isOpen={showConfirm}
  //       isPending={!!attemptingTxn}
  //       isSubmitted={!!txHash}
  //       isError={!!errorMsg}
  //       confirmContent={() => (
  //         <ConfirmationModalContent
  //           mainTitle="Confirm Liquidity"
  //           title="You will receive"
  //           topContent={modalHeader}
  //           bottomContent={modalBottom}
  //         />
  //       )}
  //       submittedContent={submittedContent}
  //       errorContent={errorContent}
  //       onDismiss={handleDismissConfirmation}
  //     />
  //   )}
  // </>
  // )
}

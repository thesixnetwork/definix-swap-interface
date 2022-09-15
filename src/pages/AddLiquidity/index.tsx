import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Box, Button, Chip, Divider, Tab, Tabs, Typography } from '@mui/material'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { MinimalPositionCard } from 'components/PositionCard'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { Dots } from 'components/swap/styleds'
import { PairState } from 'data/Reserves'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import numeral from 'numeral'
import React, { useCallback, useMemo, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { Flex, useMatchBreakpoints, useModal } from 'uikit-dev'
import Card from 'uikitV2/components/Card'
import Coin from 'uikitV2/components/Coin'
import CurrencySelect from 'uikitV2/components/CurrencySelect'
import { PlusBIcon } from 'uikitV2/components/Icon'
import { Input as NumericalInput } from 'uikitV2/components/NumericalInput'
import PageTitle from 'uikitV2/components/PageTitle'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'

import { ROUTER_ADDRESS } from '../../constants'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import ConfirmAddModal from './ConfirmAddModal'
import NoLiquidity from './NoLiquidity'
import { PoolPriceBar } from './PoolPriceBar'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const { isXl } = useMatchBreakpoints()
  const isMobile = !isXl

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(currencyA, WETH[chainId])) ||
        (currencyB && currencyEquals(currencyB, WETH[chainId])))
  )

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  const selectedCurrencyBalanceInput = useCurrencyBalance(
    account ?? undefined,
    currencies[Field.CURRENCY_A] ?? undefined
  )
  const selectedCurrencyBalanceOutput = useCurrencyBalance(
    account ?? undefined,
    currencies[Field.CURRENCY_B] ?? undefined
  )

  // modal, loading, error
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [errorMsg, setErrorMsg] = useState<string>('')

  // txn values
  const [deadline] = useUserDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

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
            summary: `Add ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(3)} ${
              currencies[Field.CURRENCY_A]?.symbol
            } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(3)} ${currencies[Field.CURRENCY_B]?.symbol}`,
          })

          setTxHash(response.hash)
        })
      )
      .catch((e) => {
        setAttemptingTxn(false)

        // we only care if the error is something _other_ than the user rejected the tx
        if (e?.code !== 4001) {
          console.error(e)
          setErrorMsg(e)
        }
      })
  }

  // const modalHeader = useCallback(() => {
  //   return (
  //     <div>
  //       {noLiquidity ? (
  //         <RowFixed mb="0 !important">
  //           <DoubleCurrencyLogo
  //             currency0={currencies[Field.CURRENCY_A]}
  //             currency1={currencies[Field.CURRENCY_B]}
  //             size={40}
  //           />
  //           <UIKitText fontSize="24px" ml="3" fontWeight="500">
  //             {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
  //           </UIKitText>
  //         </RowFixed>
  //       ) : (
  //         <AutoColumn gap="24px">
  //           <RowBetween align="center">
  //             <RowFixed mb="0 !important">
  //               <DoubleCurrencyLogo
  //                 currency0={currencies[Field.CURRENCY_A]}
  //                 currency1={currencies[Field.CURRENCY_B]}
  //                 size={40}
  //               />
  //               <UIKitText fontSize="24px" ml="3" fontWeight="500">
  //                 {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
  //               </UIKitText>
  //             </RowFixed>

  //             <UIKitText fontSize="24px" fontWeight="500">
  //               {liquidityMinted?.toSignificant(6)}
  //             </UIKitText>
  //           </RowBetween>

  //           <UIKitText>
  //             Output is estimated. If the price changes by more than
  //             <strong className="mx-1">{allowedSlippage / 100}%</strong>your transaction will revert.
  //           </UIKitText>
  //         </AutoColumn>
  //       )}
  //     </div>
  //   )
  // }, [allowedSlippage, currencies, liquidityMinted, noLiquidity])

  const handleCurrencyASelect = useCallback(
    (currA: Currency) => {
      const newCurrencyIdA = currencyId(currA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/liquidity/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/liquidity/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currB: Currency) => {
      const newCurrencyIdB = currencyId(currB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/liquidity/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/liquidity/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/liquidity/add/${currencyIdA || 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
    setErrorMsg('')
  }, [onFieldAInput, txHash])

  const tabNames = useMemo(
    () => [
      {
        id: 'add',
        name: 'Add',
      },
      {
        id: 'remove',
        name: 'Remove',
      },
    ],
    []
  )

  const changeTab = useCallback(
    (tab: string) => {
      if (tab === tabNames[0].id) {
        history.push('/liquidity/add')
      }
      if (tab === tabNames[1].id) {
        history.push('/liquidity/list')
      }
    },
    [history, tabNames]
  )

  const [onPresentSelectCurrencyInputModal] = useModal(
    <CurrencySearchModal
      isOpen
      onCurrencySelect={handleCurrencyASelect}
      selectedCurrency={currencies[Field.CURRENCY_A]}
      otherSelectedCurrency={currencies[Field.CURRENCY_A]}
    />,
    false
  )

  const [onPresentSelectCurrencyOutputModal] = useModal(
    <CurrencySearchModal
      isOpen
      onCurrencySelect={handleCurrencyBSelect}
      selectedCurrency={currencies[Field.CURRENCY_B]}
      otherSelectedCurrency={currencies[Field.CURRENCY_B]}
    />,
    false
  )

  const [onPresentConfirmAddModal] = useModal(
    <ConfirmAddModal
      noLiquidity={noLiquidity}
      currencies={currencies}
      liquidityMinted={liquidityMinted}
      price={price}
      parsedAmounts={parsedAmounts}
      poolTokenPercentage={poolTokenPercentage}
      currencyA={currencyA}
      currencyB={currencyB}
      onDismissModal={handleDismissConfirmation}
      onFieldAInput={onFieldAInput}
      onFieldBInput={onFieldBInput}
    />
  )

  return (
    <SmallestLayout>
      <PageTitle
        title="Liquidity"
        caption="Pair your tokens and deposit in a liquidity pool to get high interest profit."
        link="https://sixnetwork.gitbook.io/definix/exchange/how-to-add-liquidity"
        linkLabel="Learn how to add Liquidity."
      />

      <Card>
        <Tabs
          value={tabNames[0].id}
          onChange={(e, value) => {
            changeTab(value)
          }}
          textColor="secondary"
          indicatorColor="secondary"
          aria-label="secondary tabs example"
        >
          {tabNames.map(({ id, name }) => (
            <Tab label={name} value={id} style={{ padding: '20px 48px' }} color="#fff" />
          ))}
        </Tabs>

        {noLiquidity && <NoLiquidity />}

        <Box p={{ xs: 2.5, md: 5 }}>
          <div>
            <Box>
              <Box display="flex" alignItems="baseline" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Balance
                </Typography>
                <Typography fontSize={14} ml={1} color="text.secondary" style={{ fontWeight: 'bold' }}>
                  {!!currencies[Field.CURRENCY_A] && selectedCurrencyBalanceInput
                    ? selectedCurrencyBalanceInput?.toSignificant(6)
                    : '-'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <NumericalInput
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onFieldAInput}
                  fontSize="1.75rem"
                />
                <CurrencySelect currency={currencies[Field.CURRENCY_A]} onClick={onPresentSelectCurrencyInputModal} />
              </Box>

              {account && (
                <Box display="flex">
                  <Chip
                    label="25%"
                    size="small"
                    variant="outlined"
                    // onClick={handleQuarterInput}
                    onClick={() => {
                      onFieldAInput(
                        numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 4).format('0.00') ?? ''
                      )
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                  <Chip
                    label="50%"
                    size="small"
                    variant="outlined"
                    // onClick={handleHalfInput}
                    onClick={() => {
                      onFieldAInput(
                        numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 2).format('0.00') ?? ''
                      )
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                  <Chip
                    label="MAX"
                    size="small"
                    variant="outlined"
                    // onClick={handleMaxInput}
                    onClick={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                </Box>
              )}
            </Box>

            <Flex width="100%" justifyContent="center">
              <Box p="14px">
                <PlusBIcon />
              </Box>
            </Flex>

            <Box>
              <Box display="flex" alignItems="baseline" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Balance
                </Typography>
                <Typography fontSize={14} ml={1} color="text.secondary" style={{ fontWeight: 'bold' }}>
                  {!!currencies[Field.CURRENCY_B] && selectedCurrencyBalanceOutput
                    ? selectedCurrencyBalanceOutput?.toSignificant(6)
                    : ' -'}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <NumericalInput
                  value={formattedAmounts[Field.CURRENCY_B]}
                  onUserInput={onFieldBInput}
                  fontSize="1.75rem"
                />
                <CurrencySelect currency={currencies[Field.CURRENCY_B]} onClick={onPresentSelectCurrencyOutputModal} />
              </Box>
              {account && (
                <Box display="flex">
                  <Chip
                    label="25%"
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      onFieldBInput(
                        numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 4).format('0.00') ?? ''
                      )
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                  <Chip
                    label="50%"
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      onFieldBInput(
                        numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 2).format('0.00') ?? ''
                      )
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                  <Chip
                    label="MAX"
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    sx={{ mr: '6px', background: 'transparent' }}
                  />
                </Box>
              )}
            </Box>
          </div>

          <Divider variant="middle" style={{ margin: isMobile ? '24px 0' : '32px 0' }} />

          {!account ? (
            <ConnectWalletButton fullWidth />
          ) : (
            <>
              {(approvalA === ApprovalState.NOT_APPROVED ||
                approvalA === ApprovalState.PENDING ||
                approvalB === ApprovalState.NOT_APPROVED ||
                approvalB === ApprovalState.PENDING) &&
                isValid && (
                  <Box mb={2}>
                    {approvalA !== ApprovalState.APPROVED && (
                      <SpaceBetweenFormat
                        mb={{ xs: 3, md: 1 }}
                        titleElm={
                          <Coin
                            mb={{ xs: 1, md: 0 }}
                            size={32}
                            symbol={currencies[Field.CURRENCY_A]?.symbol}
                            name={currencies[Field.CURRENCY_A]?.symbol}
                            color="text.disabled"
                          />
                        }
                        valueElm={
                          <Button
                            onClick={approveACallback}
                            disabled={approvalA === ApprovalState.PENDING}
                            variant="contained"
                            color="secondary"
                            sx={{ width: { xs: '100%', md: '35%' } }}
                          >
                            {approvalA === ApprovalState.PENDING ? (
                              <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                            ) : (
                              `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                            )}
                          </Button>
                        }
                      />
                    )}
                    {approvalB !== ApprovalState.APPROVED && (
                      <SpaceBetweenFormat
                        titleElm={
                          <Coin
                            mb={{ xs: 1, md: 0 }}
                            size={32}
                            symbol={currencies[Field.CURRENCY_B]?.symbol}
                            name={currencies[Field.CURRENCY_B]?.symbol}
                            color="text.disabled"
                          />
                        }
                        valueElm={
                          <Button
                            onClick={approveACallback}
                            disabled={approvalA === ApprovalState.PENDING}
                            variant="contained"
                            color="secondary"
                            sx={{ width: { xs: '100%', md: '35%' } }}
                          >
                            {approvalA === ApprovalState.PENDING ? (
                              <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                            ) : (
                              `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                            )}
                          </Button>
                        }
                      />
                    )}
                  </Box>
                )}
              <Button
                onClick={onPresentConfirmAddModal}
                disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                variant="contained"
                size="large"
                color={
                  !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
                    ? 'error'
                    : 'primary'
                }
                fullWidth
              >
                {noLiquidity ? 'Create Pool & Supply' : 'Add Liquidity'}
              </Button>
            </>
          )}

          {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
            <Box mt="24px">
              <Typography fontWeight={500} color="text.secondary" mb={1.5}>
                {noLiquidity ? 'Initial Prices and Pool Share' : 'Estimated Returns'}
              </Typography>

              <PoolPriceBar
                currencies={currencies}
                poolTokenPercentage={poolTokenPercentage}
                noLiquidity={noLiquidity}
                price={price}
              />
            </Box>
          )}

          {/* <TransactionConfirmationModal
          isOpen={showConfirm}
          isPending={!!attemptingTxn}
          isSubmitted={!!txHash}
          isError={!!errorMsg}
          confirmContent={() => (
            <ConfirmationModalContent
              mainTitle="Confirm Liquidity"
              title={noLiquidity ? 'You are creating a pool' : 'You will receive'}
              topContent={modalHeader}
              bottomContent={modalBottom}
            />
          )}
          pendingIcon={liquidity}
          submittedContent={submittedContent}
          errorContent={errorContent}
          onDismiss={handleDismissConfirmation}
        /> */}
        </Box>
      </Card>

      {pair && !noLiquidity && pairState !== PairState.INVALID && (
        <Card sx={{ mt: 2 }}>
          <Box p={{ xs: 2.5, md: 5 }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </Box>
        </Card>
      )}
    </SmallestLayout>
  )
}

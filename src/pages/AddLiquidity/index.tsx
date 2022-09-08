import numeral from 'numeral'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { BorderCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import ConnectWalletButton from 'components/ConnectWalletButton'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
  TransactionSubmittedContent,
} from 'components/TransactionConfirmationModal'
import { PairState } from 'data/Reserves'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import React, { useCallback, useState, useMemo } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useIsExpertMode, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { AddIcon, Button, CardBody, Flex, Text, Text as UIKitText, useMatchBreakpoints, useModal } from 'uikit-dev'
import liquidity from 'uikit-dev/animation/liquidity.json'
import { LeftPanel, MaxWidthLeft } from 'uikit-dev/components/TwoPanelLayout'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from 'utils'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import Card from 'uikitV2/components/Card'
import { Box, Tab, Tabs, Typography, IconButton, Chip, Divider } from '@mui/material'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import PageTitle from 'uikitV2/components/PageTitle'
import CurrencySelect from 'uikitV2/components/CurrencySelect'
import { Input as NumericalInput } from 'uikitV2/components/NumericalInput'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { PlusBIcon } from 'uikitV2/components/Icon'

import { useCurrencyBalance } from '../../state/wallet/hooks'
import { ROUTER_ADDRESS } from '../../constants'
import AppBody from '../AppBody'
import { Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
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
  const expertMode = useIsExpertMode()

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

  const modalHeader = useCallback(() => {
    return (
      <div>
        {noLiquidity ? (
          <RowFixed mb="0 !important">
            <DoubleCurrencyLogo
              currency0={currencies[Field.CURRENCY_A]}
              currency1={currencies[Field.CURRENCY_B]}
              size={40}
            />
            <UIKitText fontSize="24px" ml="3" fontWeight="500">
              {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
            </UIKitText>
          </RowFixed>
        ) : (
          <AutoColumn gap="24px">
            <RowBetween align="center">
              <RowFixed mb="0 !important">
                <DoubleCurrencyLogo
                  currency0={currencies[Field.CURRENCY_A]}
                  currency1={currencies[Field.CURRENCY_B]}
                  size={40}
                />
                <UIKitText fontSize="24px" ml="3" fontWeight="500">
                  {`${currencies[Field.CURRENCY_A]?.symbol}/${currencies[Field.CURRENCY_B]?.symbol}`}
                </UIKitText>
              </RowFixed>

              <UIKitText fontSize="24px" fontWeight="500">
                {liquidityMinted?.toSignificant(6)}
              </UIKitText>
            </RowBetween>

            <UIKitText>
              Output is estimated. If the price changes by more than
              <strong className="mx-1">{allowedSlippage / 100}%</strong>your transaction will revert.
            </UIKitText>
          </AutoColumn>
        )}
      </div>
    )
  }, [allowedSlippage, currencies, liquidityMinted, noLiquidity])

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const handleCurrencyASelect = useCallback(
    (currA: Currency) => {
      const newCurrencyIdA = currencyId(currA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
      } else {
        history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, history, currencyIdA]
  )
  const handleCurrencyBSelect = useCallback(
    (currB: Currency) => {
      const newCurrencyIdB = currencyId(currB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA || 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB]
  )

  const submittedContent = useCallback(
    () => (
      <TransactionSubmittedContent
        title="Add Liquidity Complete"
        date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
        chainId={chainId}
        hash={txHash}
        content={modalHeader}
        button={
          <Button
            onClick={() => {
              console.log('Add this Liquidity to Farm')
            }}
            radii="card"
            fullWidth
          >
            Add this Liquidity to Farm
          </Button>
        }
      />
    ),
    [chainId, modalHeader, txHash]
  )

  const errorContent = useCallback(
    () => (
      <TransactionErrorContent
        title="Add Liquidity Failed"
        date={`${new Date().toDateString()}, ${new Date().toTimeString().split(' ')[0]}`}
        chainId={chainId}
        hash={txHash}
        content={modalHeader}
        button={
          <Button
            onClick={() => {
              console.log('Add Liquidity Again')
            }}
            radii="card"
            fullWidth
          >
            Add Liquidity Again
          </Button>
        }
      />
    ),
    [chainId, modalHeader, txHash]
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
  const [currentTab, setCurrentTab] = useState(tabNames[0].id)

  const changeTab = useCallback(
    (tab: string) => {
      if (tab === tabNames[0].id) {
        history.push('/add')
      }
      if (tab === tabNames[1].id) {
        history.push('/list')
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

  return (
    <>
      {!showConfirm ? (
        <SmallestLayout>
          <PageTitle
            title="Liquidity"
            caption="Pair your tokens and deposit in a liquidity pool to get high interest profit."
            link="https://sixnetwork.gitbook.io/definix/exchange/how-to-add-liquidity"
            linkLabel="Learn how to add Liquidity."
          />
          <Card>
            <Box>
              <Tabs
                value={currentTab}
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
            </Box>
            <Wrapper>
              <CardBody p="40px !important">
                <div>
                  <Box>
                    <Box display="flex" alignItems="baseline" mb={2.5}>
                      <Typography variant="body2" color="text.secondary">
                        Balance
                      </Typography>
                      <Typography fontSize={14} ml={1} color="text.secondary" style={{ fontWeight: 'bold' }}>
                        {!!currencies[Field.CURRENCY_A] && selectedCurrencyBalanceInput
                          ? selectedCurrencyBalanceInput?.toSignificant(6)
                          : ' -'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <NumericalInput
                        value={formattedAmounts[Field.CURRENCY_A]}
                        onUserInput={onFieldAInput}
                        fontSize="1.75rem"
                      />
                      <CurrencySelect
                        currency={currencies[Field.CURRENCY_A]}
                        onClick={onPresentSelectCurrencyInputModal}
                      />
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
                              numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 4).format('0.00') ??
                                ''
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
                              numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 2).format('0.00') ??
                                ''
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
                    <Box display="flex" alignItems="baseline" mb={2.5}>
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
                      <CurrencySelect
                        currency={currencies[Field.CURRENCY_B]}
                        onClick={onPresentSelectCurrencyOutputModal}
                      />
                    </Box>
                    {account && (
                      <Box display="flex">
                        <Chip
                          label="25%"
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            onFieldBInput(
                              numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 4).format('0.00') ??
                                ''
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
                              numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 2).format('0.00') ??
                                ''
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

                {/* <div>
                    {noLiquidity && (
                      <BorderCard className="mb-4">
                        <AutoColumn gap="12px">
                          <Text>You are the first liquidity provider.</Text>
                          <Text>The ratio of tokens you add will set the price of this pool.</Text>
                          <Text>Once you are happy with the rate click supply to review.</Text>
                        </AutoColumn>
                      </BorderCard>
                    )}

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onQuarter={() => {
                        onFieldAInput(
                          numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 4).format('0.00') ?? ''
                        )
                      }}
                      onHalf={() => {
                        onFieldAInput(
                          numeral(parseFloat(maxAmounts[Field.CURRENCY_A]?.toExact() || '') / 2).format('0.00') ?? ''
                        )
                      }}
                      onCurrencySelect={handleCurrencyASelect}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A]}
                      id="add-liquidity-input-tokena"
                      showCommonBases={false}
                      className="mb-4"
                    />

                    <ColumnCenter>
                      <AddIcon color="textSubtle" />
                    </ColumnCenter>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onCurrencySelect={handleCurrencyBSelect}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      onQuarter={() => {
                        onFieldBInput(
                          numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 4).format('0.00') ?? ''
                        )
                      }}
                      onHalf={() => {
                        onFieldBInput(
                          numeral(parseFloat(maxAmounts[Field.CURRENCY_B]?.toExact() || '') / 2).format('0.00') ?? ''
                        )
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      currency={currencies[Field.CURRENCY_B]}
                      id="add-liquidity-input-tokenb"
                      showCommonBases={false}
                    />
                  </div> */}

                <Divider variant="middle" style={{ margin: isMobile ? '24px 0' : '32px 0' }} />

                {!account ? (
                  <ConnectWalletButton fullWidth />
                ) : (
                  <AutoColumn gap="md">
                    {(approvalA === ApprovalState.NOT_APPROVED ||
                      approvalA === ApprovalState.PENDING ||
                      approvalB === ApprovalState.NOT_APPROVED ||
                      approvalB === ApprovalState.PENDING) &&
                      isValid && (
                        <RowBetween>
                          {approvalA !== ApprovalState.APPROVED && (
                            <Button
                              onClick={approveACallback}
                              disabled={approvalA === ApprovalState.PENDING}
                              style={{ width: approvalB !== ApprovalState.APPROVED ? '48%' : '100%' }}
                              radii="card"
                            >
                              {approvalA === ApprovalState.PENDING ? (
                                <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                              ) : (
                                `Approve ${currencies[Field.CURRENCY_A]?.symbol}`
                              )}
                            </Button>
                          )}
                          {approvalB !== ApprovalState.APPROVED && (
                            <Button
                              onClick={approveBCallback}
                              disabled={approvalB === ApprovalState.PENDING}
                              style={{ width: approvalA !== ApprovalState.APPROVED ? '48%' : '100%' }}
                              radii="card"
                            >
                              {approvalB === ApprovalState.PENDING ? (
                                <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                              ) : (
                                `Approve ${currencies[Field.CURRENCY_B]?.symbol}`
                              )}
                            </Button>
                          )}
                        </RowBetween>
                      )}
                    <Button
                      onClick={() => {
                        if (expertMode) {
                          onAdd()
                        } else {
                          setShowConfirm(true)
                        }
                      }}
                      disabled={
                        !isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED
                      }
                      variant={
                        !isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]
                          ? 'danger'
                          : 'primary'
                      }
                      fullWidth
                      radii="card"
                    >
                      {noLiquidity ? 'Create Pool & Supply' : 'Add Liquidity'}
                    </Button>
                  </AutoColumn>
                )}

                <Box mt="24px">
                  {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
                    <Box>
                      <Text fontSize="16px" fontWeight={500} className="mb-1">
                        {noLiquidity ? 'Initial Prices and Pool Share' : 'Estimated Returns'}
                      </Text>
                      <PoolPriceBar
                        currencies={currencies}
                        poolTokenPercentage={poolTokenPercentage}
                        noLiquidity={noLiquidity}
                        price={price}
                      />
                    </Box>
                  )}
                </Box>

                {pair && !noLiquidity && pairState !== PairState.INVALID ? (
                  <div className="pa-6 bd-t">
                    <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
                  </div>
                ) : null}
              </CardBody>
            </Wrapper>
          </Card>
        </SmallestLayout>
      ) : (
        <TransactionConfirmationModal
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
        />
      )}
    </>
  )
}

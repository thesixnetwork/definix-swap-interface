import { ChangeIcon, Noti, NotiType } from '@fingerlabs/definixswap-uikit-v2'
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded'
import { Box, Button, Chip, Divider, IconButton, Typography } from '@mui/material'
import AddressInputPanel from 'components/AddressInputPanel'
import { GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import ConnectWalletButton from 'components/ConnectWalletButton'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { LinkStyledButton } from 'components/Shared'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal from 'components/swap/ConfirmSwapModal'
import { ArrowWrapper, BottomGrouping, SwapCallbackError } from 'components/swap/styleds'
import TradePrice from 'components/swap/TradePrice'
import SyrupWarningModal from 'components/SyrupWarningModal'
import TokenWarningModal from 'components/TokenWarningModal'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { CurrencyAmount, JSBI, Token, Trade } from 'definixswap-sdk'
import { useActiveWeb3React, useToast } from 'hooks'
import { useAllTokens, useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import numeral from 'numeral'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { useAddPopup } from 'state/application/hooks'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { isTransactionRecent, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { useExpertModeManager, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components'
import { Flex, Link, Text, useMatchBreakpoints, useModal } from 'uikit-dev'
import { Overlay } from 'uikit-dev/components/Overlay'
import Card from 'uikitV2/components/Card'
import Coin from 'uikitV2/components/Coin'
import CurrencySelect from 'uikitV2/components/CurrencySelect'
import { Input as NumericalInput } from 'uikitV2/components/NumericalInput'
import PageTitle from 'uikitV2/components/PageTitle'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import UserBlockV2 from 'uikitV2/components/UserBlockV2'
import { textStyle } from 'uikitV2/text'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/prices'
import { TranslateString } from 'utils/translateTextHelpers'
import { BUSD_ADDRESS, FINIX_ADDRESS, SIX_ADDRESS, USDT_ADDRESS, WBNB_ADDRESS } from '../../constants'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import Flip from '../../uikit-dev/components/Flip'

const TimerWrapper = ({ isPhrase2, date, children }) => {
  return isPhrase2 ? (
    children
  ) : (
    <>
      <div>
        <br />
        <Flip date={date} />
        <br />
        <br />
        <br />
      </div>
      <div
        tabIndex={0}
        role="button"
        style={{ opacity: 0.4, pointerEvents: 'none' }}
        onClick={(e) => {
          e.preventDefault()
        }}
        onKeyDown={(e) => {
          e.preventDefault()
        }}
      >
        {children}
      </div>
    </>
  )
}

const newTransactionsFirst = (a: TransactionDetails, b: TransactionDetails) => b.addedTime - a.addedTime

const TutorailsLink = styled(Link)`
  text-decoration-line: underline;
`

export default function Swap({
  match: {
    params: { currencyIdA, currencyIdB },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const loadedUrlParams = useDefaultsFromURLSearch()
  const { isXl } = useMatchBreakpoints()
  const isMobileOrTablet = !isXl

  const allTransactions = useAllTransactions()
  const allTokens = useAllTokens()

  // Logic taken from Web3Status/index.tsx line 175
  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs
      .filter(isTransactionRecent)
      .filter((t) => t.type === 'swap')
      .sort(newTransactionsFirst)
  }, [allTransactions])

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [isShowRightPanel, setIsShowRightPanel] = useState(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const [isApprovePending, setIsApprovePending] = useState<boolean>(false)

  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmSyrupWarning = useCallback(() => {
    setIsSyrup(false)
    setSyrupTransactionType('')
  }, [])

  const [isPhrase2, setIsPhrase2] = useState(false)
  const phrase2TimeStamp = process.env.REACT_APP_PHRASE_2_TIMESTAMP
    ? parseInt(process.env.REACT_APP_PHRASE_2_TIMESTAMP || '', 10) || new Date().getTime()
    : new Date().getTime()
  const currentTime = new Date().getTime()
  useEffect(() => {
    if (currentTime < phrase2TimeStamp) {
      setTimeout(() => {
        setIsPhrase2(true)
      }, phrase2TimeStamp - currentTime)
    } else {
      setIsPhrase2(true)
    }
  }, [currentTime, phrase2TimeStamp])

  const { account, chainId = '' } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo()
  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = v2Trade

  const parsedAmounts = showWrap
    ? {
        [Field.INPUT]: parsedAmount,
        [Field.OUTPUT]: parsedAmount,
      }
    : {
        [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
        [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
      }

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT
  const selectedCurrencyBalanceInput = useCurrencyBalance(account ?? undefined, currencies[Field.INPUT] ?? undefined)
  const selectedCurrencyBalanceOutput = useCurrencyBalance(account ?? undefined, currencies[Field.OUTPUT] ?? undefined)

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: showWrap
      ? parsedAmounts[independentField]?.toExact() ?? ''
      : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const route = trade?.route
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )
  const noRoute = !route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(chainId, trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    deadline,
    recipient
  )

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  // const handleSwap = useCallback(() => {
  //   if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
  //     return
  //   }
  //   if (!swapCallback) {
  //     return
  //   }
  //   setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: undefined, txHash: undefined }))
  //   swapCallback()
  //     .then((hash) => {
  //       setSwapState((prevState) => ({
  //         ...prevState,
  //         attemptingTxn: false,
  //         swapErrorMessage: undefined,
  //         txHash: hash,
  //       }))
  //     })
  //     .catch((error) => {
  //       setSwapState((prevState) => ({
  //         ...prevState,
  //         attemptingTxn: false,
  //         swapErrorMessage: error.message,
  //         txHash: undefined,
  //       }))
  //     })
  // }, [priceImpactWithoutFee, swapCallback, setSwapState])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)
  // const isPriceImpactCaution = useMemo(() => priceImpactWithoutFee?.lessThan(LIMITED_PRICE_IMPACT), [
  //   priceImpactWithoutFee,
  // ])

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const initSwapData = useCallback(() => {
    onUserInput(Field.INPUT, '')
    onUserInput(Field.OUTPUT, '')
  }, [onUserInput])

  const handleConfirmDismiss = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showConfirm: false }))
    initSwapData()
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, txHash, initSwapData, setSwapState])

  const handleAcceptChanges = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, tradeToConfirm: trade }))
  }, [trade])

  // This will check to see if the user has selected Syrup to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForSyrup = useCallback(
    (selected: string, purchaseType: string) => {
      if (selected === 'syrup') {
        setIsSyrup(true)
        setSyrupTransactionType(purchaseType)
      }
    },
    [setIsSyrup, setSyrupTransactionType]
  )

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      if (inputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(inputCurrency.symbol.toLowerCase(), 'Selling')
      }
    },
    [onCurrencySelection, setApprovalSubmitted, checkForSyrup]
  )

  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, onUserInput])

  const handleQuarterInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, numeral(parseFloat(maxAmountInput.toExact()) / 4).format('0.00'))
    }
  }, [maxAmountInput, onUserInput])

  const handleHalfInput = useCallback(() => {
    if (maxAmountInput) {
      onUserInput(Field.INPUT, numeral(parseFloat(maxAmountInput.toExact()) / 2).format('0.00'))
    }
  }, [maxAmountInput, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      if (outputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(outputCurrency.symbol.toLowerCase(), 'Buying')
      }
    },
    [onCurrencySelection, checkForSyrup]
  )

  const [onPresentSelectCurrencyInputModal] = useModal(
    <CurrencySearchModal
      isOpen
      onCurrencySelect={handleInputSelect}
      selectedCurrency={currencies[Field.INPUT]}
      otherSelectedCurrency={currencies[Field.OUTPUT]}
    />,
    false
  )

  const [onPresentSelectCurrencyOutputModal] = useModal(
    <CurrencySearchModal
      isOpen
      onCurrencySelect={handleOutputSelect}
      selectedCurrency={currencies[Field.OUTPUT]}
      otherSelectedCurrency={currencies[Field.INPUT]}
    />,
    false
  )

  const [onPresentConfirmModal] = useModal(
    <ConfirmSwapModal recipient={recipient} onDismissModal={handleConfirmDismiss} />,
    false
  )

  const onClickApproveBtn = useCallback(async () => {
    setIsApprovePending(true)
    await approveCallback()
    setIsApprovePending(false)
  }, [approveCallback, setIsApprovePending])

  const onClickSwapButton = useCallback(() => {
    onPresentConfirmModal()
    // addPopup({ message: { message: 'test', type: 'success' } }, '12345')
  }, [onPresentConfirmModal])

  const renderNoti = useCallback(() => {
    if (priceImpactSeverity > 3) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          Price Impact Too High
        </Noti>
      )
    }
    if (priceImpactSeverity > 2) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          This swap has a price impact of at least 5%
        </Noti>
      )
    }

    return null
  }, [priceImpactSeverity])

  useEffect(() => {
    if (isMobileOrTablet) {
      setIsShowRightPanel(false)
    }
  }, [isMobileOrTablet])

  useEffect(() => {
    return () => {
      setIsShowRightPanel(false)
    }
  }, [])

  return (
    <SmallestLayout>
      <PageTitle
        title="Swap"
        caption="Swap it for any token you want easily and conveniently."
        link="https://sixnetwork.gitbook.io/definix/exchange/how-to-swap-token"
        linkLabel="Learn how to Swap"
        sx={{ mb: 1 }}
      />

      <Card>
        <Box p={{ xs: 2.5, md: 5 }} display="flex" flexDirection="column">
          <Box>
            <Box display="flex" alignItems="baseline" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Balance
              </Typography>
              <Typography fontSize={14} ml={1} color="text.secondary" style={{ fontWeight: 'bold' }}>
                {!!currencies[Field.INPUT] && selectedCurrencyBalanceInput
                  ? selectedCurrencyBalanceInput?.toSignificant(6)
                  : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <NumericalInput value={formattedAmounts[Field.INPUT]} onUserInput={handleTypeInput} fontSize="1.75rem" />
              <CurrencySelect currency={currencies[Field.INPUT]} onClick={onPresentSelectCurrencyInputModal} />
            </Box>

            {account && (
              <Box display="flex">
                <Chip
                  label="25%"
                  size="small"
                  variant="outlined"
                  onClick={handleQuarterInput}
                  sx={{ mr: '6px', background: 'transparent' }}
                />
                <Chip
                  label="50%"
                  size="small"
                  variant="outlined"
                  onClick={handleHalfInput}
                  sx={{ mr: '6px', background: 'transparent' }}
                />
                <Chip
                  label="MAX"
                  size="small"
                  variant="outlined"
                  onClick={handleMaxInput}
                  sx={{ mr: '6px', background: 'transparent' }}
                />
              </Box>
            )}
          </Box>

          <Flex justifyContent="center">
            <IconButton
              onClick={() => {
                setApprovalSubmitted(false)
                onSwitchTokens()
              }}
            >
              <ChangeIcon />
            </IconButton>
          </Flex>

          <Box>
            <Box display="flex" alignItems="baseline" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Balance
              </Typography>
              <Typography fontSize={14} ml={1} color="text.secondary" style={{ fontWeight: 'bold' }}>
                {!!currencies[Field.OUTPUT] && selectedCurrencyBalanceOutput
                  ? selectedCurrencyBalanceOutput?.toSignificant(6)
                  : '-'}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <NumericalInput
                value={formattedAmounts[Field.OUTPUT]}
                onUserInput={handleTypeOutput}
                fontSize="1.75rem"
              />
              <CurrencySelect currency={currencies[Field.OUTPUT]} onClick={onPresentSelectCurrencyOutputModal} />
            </Box>
          </Box>

          <SpaceBetweenFormat mb={1} mt={3} title="Slippage Tolerance" value={`${allowedSlippage / 100}%`} />

          <Divider style={{ margin: isMobileOrTablet ? '24px 0px' : '32px 0px' }} />

          <Flex>
            {!account && <ConnectWalletButton fullWidth />}
            {account && (
              <>
                {showWrap && (
                  <Button
                    // width="100%"
                    // scale={ButtonScales.LG}
                    variant="contained"
                    disabled={Boolean(wrapInputError)}
                    onClick={onWrap}
                    fullWidth
                    // isLoading={wrapLoading}
                  >
                    {wrapType === WrapType.WRAP && 'Wrap'}
                    {wrapType === WrapType.UNWRAP && 'Unwrap'}
                  </Button>
                )}
                {!showWrap && (
                  <>
                    {!route && userHasSpecifiedInputOutput && (
                      <Button
                        // width="100%"
                        fullWidth
                        onClick={onClickSwapButton}
                        id="swap-button"
                        variant="contained"
                        size="large"
                        disabled={!isValid || !!swapCallbackError}
                        color={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'error' : 'primary'}
                        // isLoading={Boolean(!route && userHasSpecifiedInputOutput)}
                      >
                        Swap
                      </Button>
                    )}
                    {(route || !userHasSpecifiedInputOutput) && (
                      <Flex flexDirection="column" width="100%">
                        {showApproveFlow && (
                          <Flex
                            width="100%"
                            flexDirection={isMobileOrTablet ? 'column' : 'row'}
                            justifyContent="space-between"
                            alignItems={isMobileOrTablet ? 'flex-start' : 'center'}
                            mb="20px"
                          >
                            <Flex alignItems="center">
                              <Coin symbol={currencies[Field.INPUT]?.symbol} size={32} />
                              <Text ml="12px" style={textStyle.R_16M} color="#999">
                                {`${currencies[Field.INPUT]?.symbol}`}
                              </Text>
                            </Flex>

                            <Button
                              // scale={ButtonScales.MD}
                              onClick={onClickApproveBtn}
                              disabled={approval !== ApprovalState.NOT_APPROVED}
                              // isLoading={isApprovePending}
                              variant="contained"
                              color="secondary"
                              style={{
                                width: isMobileOrTablet ? '100%' : '186px',
                                marginTop: isMobileOrTablet ? '8px' : '0px',
                              }}
                            >
                              {`Approve ${currencies[Field.INPUT]?.symbol}`}
                            </Button>
                          </Flex>
                        )}
                        <Flex flexDirection="column" flex="1 1 0">
                          <Button
                            // width="100%"
                            // scale={ButtonScales.LG}
                            fullWidth
                            onClick={onClickSwapButton}
                            id="swap-button"
                            variant="contained"
                            size="large"
                            // disabled={!isValid || !!swapCallbackError || showApproveFlow || priceImpactSeverity > 3}
                          >
                            Swap
                          </Button>
                          {renderNoti()}
                        </Flex>
                      </Flex>
                    )}
                  </>
                )}
              </>
            )}
          </Flex>

          {trade && (
            <Box mt={3}>
              <Typography fontWeight={500} color="text.secondary" mb={1.5}>
                Estimated Returns
              </Typography>

              <AdvancedSwapDetailsDropdown trade={trade} showRoute />
            </Box>
          )}
        </Box>
      </Card>
    </SmallestLayout>
  )
}

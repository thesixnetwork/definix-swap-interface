import { Trade, TradeType } from 'definixswap-sdk'
import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Coin from 'uikitV2/components/Coin'
import { textStyle } from 'uikitV2/text'
import { Button } from '@mui/material'
import { ChangeBottomIcon, Noti, NotiType } from '@fingerlabs/definixswap-uikit-v2'
import { ErrorIcon, Text, Flex, Box } from 'uikit-dev'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown, warningSeverity } from '../../utils/prices'

const BalanceText = styled(Text)<{ isAcceptChange: boolean }>`
  ${textStyle.R_16R}
  color: ${({ isAcceptChange }) => (isAcceptChange ? '#ff5532' : '#222')};
`

const WrapIcon = styled(Flex)`
  margin-top: -30px;
  transform: translateY(20px);
  justify-content: center;
`

const WrapPriceUpdate = styled(Flex)`
  margin-top: 20px;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  border: solid 1px rgba(224,224,224,0.5);
  background-color: rgba(224, 224, 224, 0.1);
}
`

const PriceInfoText = styled(Text)`
  span {
    font-weight: 600;
  }
`

const SwapTokenInfo = ({
  isInput,
  trade,
  showAcceptChanges,
}: // priceImpactSeverity,
{
  isInput: boolean
  trade: Trade
  showAcceptChanges?: boolean
  // priceImpactSeverity?: 0 | 1 | 2 | 3 | 4
}) => {
  return (
    <Flex justifyContent="space-between" alignItems="center" height="60px">
      <Flex alignItems="center">
        <Box mr="12px" mt="2px">
          {isInput && <Coin size={32} symbol={trade.inputAmount.currency?.symbol} />}
          {!isInput && <Coin size={32} symbol={trade.outputAmount.currency?.symbol} />}
        </Box>
        <Text style={textStyle.R_16M}>
          {isInput && trade.inputAmount.currency.symbol}
          {!isInput && trade.outputAmount.currency.symbol}
        </Text>
      </Flex>
      {isInput && (
        <BalanceText isAcceptChange={(showAcceptChanges && trade.tradeType === TradeType.EXACT_OUTPUT) || false}>
          {trade.inputAmount.toSignificant(6)}
        </BalanceText>
      )}
      {!isInput && (
        <BalanceText
          // isAcceptChange={priceImpactSeverity > 2}
          isAcceptChange={showAcceptChanges || false}
        >
          {trade.outputAmount.toSignificant(6)}
        </BalanceText>
      )}
    </Flex>
  )
}

export default function SwapModalHeader({
  trade,
  allowedSlippage = 0,
  recipient = null,
  showAcceptChanges = false,
  onlyCurrency = false,
  onAcceptChanges,
}: {
  trade: any
  allowedSlippage?: number
  recipient?: string | null
  showAcceptChanges?: boolean
  onlyCurrency?: boolean
  onAcceptChanges?: () => void
}) {
  const slippageAdjustedAmounts = useMemo(() => computeSlippageAdjustedAmounts(trade, allowedSlippage), [
    trade,
    allowedSlippage,
  ])
  const { priceImpactWithoutFee } = useMemo(() => computeTradePriceBreakdown(trade), [trade])
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  const theme = useContext(ThemeContext)

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <SwapTokenInfo isInput trade={trade} showAcceptChanges={showAcceptChanges} />
        <WrapIcon>
          <ChangeBottomIcon />
        </WrapIcon>
        <SwapTokenInfo
          isInput={false}
          trade={trade}
          showAcceptChanges={showAcceptChanges}
          // priceImpactSeverity={priceImpactSeverity}
        />
      </Flex>

      {!onlyCurrency && showAcceptChanges && (
        <WrapPriceUpdate>
          <Noti type={NotiType.ALERT}>Price update</Noti>
          <Button
            variant="contained"
            style={{ padding: '7px 20px', minWidth: 107, whiteSpace: 'pre' }}
            onClick={onAcceptChanges}
          >
            Accept
          </Button>
        </WrapPriceUpdate>
      )}
    </Flex>
  )

  // return (
  //   <AutoColumn gap="24px">
  //     <AutoColumn gap="16px">
  //       <RowBetween align="flex-end">
  //         <RowFixed mb="0 !important">
  //           <CurrencyLogo currency={trade.inputAmount.currency} size="24px" style={{ marginRight: '12px' }} />
  //           <Text
  //             fontSize="24px"
  //             fontWeight="500"
  //             color={showAcceptChanges && trade.tradeType === TradeType.EXACT_OUTPUT ? theme.colors.primary : 'text'}
  //           >
  //             {trade.inputAmount.toSignificant(6)}
  //           </Text>
  //         </RowFixed>
  //         <RowFixed mb="0 !important">
  //           <Text fontSize="24px" fontWeight="500">
  //             {trade.inputAmount.currency.symbol}
  //           </Text>
  //         </RowFixed>
  //       </RowBetween>

  //       <RowFixed mb="0 !important">
  //         <ArrowDown size="16" color={theme.colors.textSubtle} style={{ marginLeft: '4px', minWidth: '16px' }} />
  //       </RowFixed>

  //       <RowBetween align="flex-end">
  //         <RowFixed mb="0 !important">
  //           <CurrencyLogo currency={trade.outputAmount.currency} size="24px" style={{ marginRight: '12px' }} />
  //           <Text fontSize="24px" fontWeight="500" color={priceImpactSeverity > 2 ? theme.colors.failure : 'text'}>
  //             {trade.outputAmount.toSignificant(6)}
  //           </Text>
  //         </RowFixed>
  //         <RowFixed mb="0 !important">
  //           <Text fontSize="24px" fontWeight="500">
  //             {trade.outputAmount.currency.symbol}
  //           </Text>
  //         </RowFixed>
  //       </RowBetween>
  //     </AutoColumn>

  //     {!onlyCurrency && (
  //       <>
  //         {showAcceptChanges ? (
  //           <RowBetween>
  //             <div className="flex align-center">
  //               <ErrorIcon className="mr-2" />
  //               <Text>Price Updated</Text>
  //             </div>
  //             <Button onClick={onAcceptChanges} size="sm" className="flex-shrink">
  //               Accept Price
  //             </Button>
  //           </RowBetween>
  //         ) : null}

  //         {trade.tradeType === TradeType.EXACT_INPUT ? (
  //           <PriceInfoText>
  //             {`Output is estimated. You will receive at least `}
  //             <span>
  //               {slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(6)} {trade.outputAmount.currency.symbol}
  //             </span>
  //             {' or the transaction will revert.'}
  //           </PriceInfoText>
  //         ) : (
  //           <PriceInfoText>
  //             {`Input is estimated. You will sell at most `}
  //             <span>
  //               {slippageAdjustedAmounts[Field.INPUT]?.toSignificant(6)} {trade.inputAmount.currency.symbol}
  //             </span>
  //             {' or the transaction will revert.'}
  //           </PriceInfoText>
  //         )}

  //         {recipient !== null ? (
  //           <Text>
  //             Output will be sent to{' '}
  //             <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
  //           </Text>
  //         ) : null}
  //       </>
  //     )}
  //   </AutoColumn>
  // )
}

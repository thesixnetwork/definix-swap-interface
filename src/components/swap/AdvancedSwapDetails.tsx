import { Trade, TradeType } from 'definixswap-sdk'
import React from 'react'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'
import TradePrice from './TradePrice'

export interface AdvancedSwapDetailsProps {
  trade?: Trade
  showRoute?: boolean
}

export function AdvancedSwapDetails({ trade, showRoute = false }: AdvancedSwapDetailsProps) {
  const [allowedSlippage] = useUserSlippageTolerance()
  const enableRoute = showRoute && Boolean(trade && trade.route.path.length > 2)
  const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
  const isExactIn = trade?.tradeType === TradeType.EXACT_INPUT
  const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

  return trade ? (
    <div>
      {Boolean(trade) && (
        <SpaceBetweenFormat
          mb={1.5}
          title="Price Rate"
          valueElm={<TradePrice price={trade?.executionPrice} />}
          sx={{ alignItems: 'flex-start' }}
        />
      )}

      <SpaceBetweenFormat
        mb={1.5}
        title={isExactIn ? 'Minimum received' : 'Maximum sold'}
        value={
          isExactIn
            ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(4)} ${trade.outputAmount.currency.symbol}` ?? '-'
            : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(4)} ${trade.inputAmount.currency.symbol}` ?? '-'
        }
        tooltip="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed."
      />

      <SpaceBetweenFormat
        mb={1.5}
        title="Price Impact"
        valueElm={<FormattedPriceImpact priceImpact={priceImpactWithoutFee} />}
        tooltip="The difference between the market price and estimated price due to trade size."
      />

      <SpaceBetweenFormat
        mb={1.5}
        title="Liquidity Provider Fee"
        value={realizedLPFee ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.symbol}` : '-'}
        tooltip="For each trade a 0.2% fee is paid. 0.15% goes to liquidity providers and 0.05% goes to the Definix Swap treasury"
      />

      {enableRoute && (
        <SpaceBetweenFormat
          title="Routing"
          valueElm={<SwapRoute trade={trade} />}
          tooltip="Routing through these tokens resulted in the best price for your trade."
        />
      )}
    </div>
  ) : (
    <></>
  )
}

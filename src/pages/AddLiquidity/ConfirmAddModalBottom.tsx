import React, { useMemo } from 'react'
import { Currency, CurrencyAmount, Fraction, Percent } from 'definixswap-sdk'
import styled from 'styled-components'
import { Flex, Text, NotiIcon } from '@fingerlabs/definixswap-uikit-v2'
import { Field } from 'state/mint/actions'
import { useMatchBreakpoints } from 'uikit-dev'
import { textStyle } from 'uikitV2/text'
import { mediaQueries } from 'uikitV2/base'
import { Button } from '@mui/material'

const TitleText = styled(Text)`
  ${textStyle.R_16M}
  margin-bottom: 12px;
  ${mediaQueries.mobileSwap} {
    ${textStyle.R_16M}
  }
`

const StyledNotiIcon = styled(NotiIcon)`
  flex-shrink: 0;
`

function ConfirmAddModalBottom({
  noLiquidity,
  price,
  currencies,
  parsedAmounts,
  poolTokenPercentage,
  onAdd,
  allowedSlippage,
  isPending,
}: {
  noLiquidity?: boolean
  price?: Fraction
  currencies: { [field in Field]?: Currency }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  poolTokenPercentage?: Percent
  onAdd: () => void
  allowedSlippage: number
  isPending: boolean
}) {
  const { isXl } = useMatchBreakpoints()
  const isMobile = !isXl

  return (
    <Flex flexDirection="column">
      <Flex flexDirection="column">
        <TitleText color="#666" mb="12px">
          Estimated Returns
        </TitleText>

        <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mb="8px">
          <Text style={textStyle.R_14R} color="#999" mb={isMobile ? '4px' : '0px'}>
            Deposited
          </Text>

          <Flex flexDirection="column" alignItems={isMobile ? 'flex-start' : 'flex-end'}>
            <Text style={textStyle.R_14M} color="#666">
              {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} {currencies[Field.CURRENCY_A]?.symbol}
            </Text>
            <Text style={textStyle.R_14M} color="#666">
              {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} {currencies[Field.CURRENCY_B]?.symbol}
            </Text>
          </Flex>
        </Flex>

        <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mb="8px">
          <Text style={textStyle.R_14R} color="#999" mb={isMobile ? '4px' : '0px'}>
            Price Rate
          </Text>
          <Flex flexDirection="column" alignItems={isMobile ? 'flex-start' : 'flex-end'}>
            <Text style={textStyle.R_14M} color="#666">
              {`1 ${currencies[Field.CURRENCY_A]?.symbol} = ${price?.toSignificant(4)} ${
                currencies[Field.CURRENCY_B]?.symbol
              }`}
            </Text>
            <Text style={textStyle.R_14M} color="#666">
              {`1 ${currencies[Field.CURRENCY_B]?.symbol} = ${price?.invert().toSignificant(4)} ${
                currencies[Field.CURRENCY_A]?.symbol
              }`}
            </Text>
          </Flex>
        </Flex>

        <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between">
          <Text style={textStyle.R_14R} color="#999" mb={isMobile ? '4px' : '0px'}>
            Share of Pool
          </Text>
          <Text style={textStyle.R_14M} color="#666">
            {noLiquidity ? '100' : poolTokenPercentage?.toSignificant(4)}%
          </Text>
        </Flex>
      </Flex>

      {!noLiquidity && (
        <Flex alignItems="flex-start" mt="20px">
          <StyledNotiIcon />
          <Text mt="-1px" ml="4px" style={{ ...textStyle.R_12R, whiteSpace: 'pre-line' }} color="#999">
            Output is estimated. If the price changes by more than 0.5% your transaction will revert.
          </Text>
        </Flex>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={onAdd}
        fullWidth
        // scale={ButtonScales.LG}
        // isLoading={isPending}
        style={{ marginTop: 32 }}
      >
        {noLiquidity ? 'Create Pool & Supply' : 'Add Liquidity'}
      </Button>
    </Flex>
  )
}

export default ConfirmAddModalBottom

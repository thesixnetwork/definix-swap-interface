import React from 'react'
import { Currency, Percent, Price } from 'definixswap-sdk'
import { Flex, Text, useMatchBreakpoints } from 'uikit-dev'
import { textStyle } from 'uikitV2/text'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { ONE_BIPS } from '../../constants'
import { Field } from '../../state/mint/actions'

export function PoolPriceBar({
  currencies,
  noLiquidity,
  poolTokenPercentage,
  price,
}: {
  currencies: { [field in Field]?: Currency }
  noLiquidity?: boolean
  poolTokenPercentage?: Percent
  price?: Price
}) {
  const { isXl } = useMatchBreakpoints()
  const isMobile = !isXl

  return (
    <Flex flexDirection="column">
      <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" mb="8px">
        <Flex mb={isMobile ? '4px' : '0px'}>
          <Text style={textStyle.R_14R} color="#999">
            Price Rate
          </Text>
        </Flex>
        <Flex flexDirection="column">
          <Text style={textStyle.R_14M} color="#666" textAlign={isMobile ? 'left' : 'right'}>
            1 {currencies[Field.CURRENCY_A]?.symbol} = {price?.toSignificant(6) ?? '-'}{' '}
            {currencies[Field.CURRENCY_B]?.symbol}
          </Text>
          <Text style={textStyle.R_14M} color="#666" textAlign={isMobile ? 'left' : 'right'}>
            1 {currencies[Field.CURRENCY_B]?.symbol} = {price?.invert()?.toSignificant(6) ?? '-'}{' '}
            {currencies[Field.CURRENCY_A]?.symbol}
          </Text>
        </Flex>
      </Flex>

      <Flex flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between">
        <Text mb={isMobile ? '4px' : '0px'} style={textStyle.R_14R} color="#999">
          Share of Pool
        </Text>
        <Text style={textStyle.R_14M} color="#666">
          {noLiquidity && price
            ? '100'
            : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
          %
        </Text>
      </Flex>
    </Flex>
  )

  return (
    <AutoColumn gap="md">
      <AutoRow justify="space-around" gap="4px">
        <AutoColumn justify="center">
          <Text fontWeight="bold">{price?.toSignificant(6) ?? '-'}</Text>
          <Text fontSize="14px" color="textSubtle" pt={1}>
            {currencies[Field.CURRENCY_B]?.symbol} per {currencies[Field.CURRENCY_A]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight="bold">{price?.invert()?.toSignificant(6) ?? '-'}</Text>
          <Text fontSize="14px" color="textSubtle" pt={1}>
            {currencies[Field.CURRENCY_A]?.symbol} per {currencies[Field.CURRENCY_B]?.symbol}
          </Text>
        </AutoColumn>
        <AutoColumn justify="center">
          <Text fontWeight="bold" color="success">
            {noLiquidity && price
              ? '100'
              : (poolTokenPercentage?.lessThan(ONE_BIPS) ? '<0.01' : poolTokenPercentage?.toFixed(2)) ?? '0'}
            %
          </Text>
          <Text fontSize="14px" color="textSubtle" pt={1}>
            Share of Pool
          </Text>
        </AutoColumn>
      </AutoRow>
    </AutoColumn>
  )
}

export default PoolPriceBar

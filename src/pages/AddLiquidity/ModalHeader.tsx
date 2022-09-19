import React from 'react'
import { Field } from 'state/mint/actions'
import { Currency, TokenAmount } from 'definixswap-sdk'
import { Box, Flex, Text } from 'uikit-dev'
import { textStyle } from 'uikitV2/text'
import Lp from 'components/Lp'

interface IProps {
  noLiquidity?: boolean
  currencies: {
    CURRENCY_A?: any
    CURRENCY_B?: any
  }
  liquidityMinted?: TokenAmount
}

const ModalHeader: React.FC<IProps> = ({ noLiquidity, currencies, liquidityMinted }) => {
  return (
    <Flex flexDirection="column">
      {!noLiquidity ? (
        <Flex justifyContent="space-between" alignItems="center" width="100%" p="14px 0px">
          <Flex alignItems="center">
            <Box mr="10px">
              <Lp size={32} lpSymbols={[currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]]} />
            </Box>
            <Text style={textStyle.R_16M} color="#222">
              {`${currencies[Field.CURRENCY_A]?.symbol}-${currencies[Field.CURRENCY_B]?.symbol}`}
            </Text>
          </Flex>
          <Text style={textStyle.R_16R} color="#222">
            {liquidityMinted?.toSignificant(6)}
          </Text>
        </Flex>
      ) : (
        <Flex flexDirection="column">
          <Text style={textStyle.R_16M} color="#666">
            You are creating a pool
          </Text>
          <Flex justifyContent="space-between" alignItems="center" width="100%" p="14px 0px">
            <Flex alignItems="center">
              <Box mr="10px">
                <Lp size={32} lpSymbols={[currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]]} />
              </Box>
              <Text style={textStyle.R_16M} color="#222">
                {`${currencies[Field.CURRENCY_A]?.symbol}-${currencies[Field.CURRENCY_B]?.symbol}`}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  )
}

export default React.memo(ModalHeader)

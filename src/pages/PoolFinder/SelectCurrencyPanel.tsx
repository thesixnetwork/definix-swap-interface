// import { Coin, ColorStyles, Flex, useModal, Text, Box, ArrowBottomGIcon } from '@fingerlabs/definixswap-uikit-v2'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import React from 'react'
import { Box, Flex, Text, useModal } from 'uikit-dev'
import Coin from 'uikitV2/components/Coin'
import { ArrowBottomGIcon } from 'uikitV2/components/Icon'
import { textStyle } from 'uikitV2/text'

const SelectCurrencyPanel = React.memo(({ currency, onCurrencySelect, handleSearchDismiss }: any) => {
  const [onPresentCurrencySearchModal] = useModal(
    <CurrencySearchModal
      onCurrencySelect={onCurrencySelect}
      onDismiss={handleSearchDismiss}
      selectedCurrency={currency}
    />,
    false
  )

  return (
    <Flex
      position="relative"
      height="48px"
      borderRadius="8px"
      border="1px solid"
      borderColor="#e0e0e0"
      onClick={onPresentCurrencySearchModal}
      justifyContent="center"
      alignItems="center"
      style={{ cursor: 'pointer' }}
    >
      {currency ? (
        <>
          <Flex>
            <Coin symbol={currency.symbol} size={32} />
            <Text ml="10px" color="#222" style={{ ...textStyle.R_16M, alignSelf: 'center' }}>
              {currency.symbol}
            </Text>
          </Flex>
        </>
      ) : (
        <Text style={textStyle.R_14M} color="#999">
          Select a token
        </Text>
      )}
      <Box position="absolute" right="20px">
        <ArrowBottomGIcon />
      </Box>
    </Flex>
  )
})

export default SelectCurrencyPanel

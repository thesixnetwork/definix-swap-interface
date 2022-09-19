import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import BigNumber from 'bignumber.js'
import { Noti, NotiType, useMatchBreakpoints } from '@fingerlabs/definixswap-uikit-v2'
import { escapeRegExp } from 'utils'
import styled from 'styled-components'
import { Currency } from 'definixswap-sdk'
import { textStyle, textStyleToCss } from 'uikitV2/text'
import { Box, Flex, Text } from 'uikit-dev'
import Lp from 'components/Lp'
import Coin from 'uikitV2/components/Coin'
import AnountButton from 'uikit-dev/components/AnountButton'
import { Chip } from '@mui/material'

const Input = styled.input`
  width: 100%;
  border: none;
  outline: none;
  color: #222;
  ${textStyleToCss.R_14M}
`

interface IProps {
  value: string
  currency?: Currency | null
  currencyA?: any
  currencyB?: any
  onMax?: () => void
  onQuarter?: () => void
  onHalf?: () => void
  onUserInput: (value: string) => void
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`)
const RemoveLpInputPanel: React.FC<IProps> = ({
  onMax,
  onHalf,
  onQuarter,
  onUserInput,
  value,
  currency,
  currencyA,
  currencyB,
}) => {
  const { isXl, isXxl } = useMatchBreakpoints()
  const isMobile = useMemo(() => !isXl && !isXxl, [isXl, isXxl])
  const { t } = useTranslation()
  const enforcer = useCallback(
    (nextUserInput: string) => {
      if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
        onUserInput(nextUserInput)
      }
    },
    [onUserInput]
  )

  const onChangeInput = useCallback(
    (event) => {
      enforcer(event.target.value.replace(/,/g, '.'))
    },
    [enforcer]
  )

  const decimals = useMemo(() => 18, [])
  const overDp = useMemo(() => new BigNumber(value).decimalPlaces() > decimals, [value, decimals])

  const renderNoti = useCallback(() => {
    if (overDp) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          {t('The value entered is out of the valid range')}
        </Noti>
      )
    }
    return null
  }, [t, overDp])

  return (
    <Flex flexDirection="column">
      <Flex alignItems="center" mb={isMobile ? '8px' : '12px'}>
        {currencyA && currencyB && (
          <>
            <Box mr={isMobile ? '12px' : '10px'}>
              <Lp lpSymbols={[currencyA, currencyB]} size={32} />
            </Box>
            <Text style={textStyle.R_16M} color="#666">
              {currencyA?.symbol}-{currencyB?.symbol}
            </Text>
          </>
        )}
        {currency && (
          <>
            <Box mr={isMobile ? '12px' : '10px'}>
              <Coin size={32} symbol={currency?.symbol} />
            </Box>
            <Text style={textStyle.R_16M} color="#666">
              {currency?.symbol}
            </Text>
          </>
        )}
      </Flex>
      <Flex
        width="100%"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'flex-end' : 'center'}
        borderRadius="8px"
        border="solid 1px #e0e0e0"
        p="14px 12px 14px 16px"
      >
        <Input placeholder="0.0" value={value} onChange={onChangeInput} />
        <Flex flexWrap={isMobile ? 'wrap' : 'nowrap'} mt={isMobile ? '2px' : '0px'}>
          <Chip
            label="25%"
            size="small"
            variant="outlined"
            onClick={onQuarter}
            sx={{ mr: '6px', background: 'transparent' }}
          />
          <Chip
            label="50%"
            size="small"
            variant="outlined"
            onClick={onHalf}
            sx={{ mr: '6px', background: 'transparent' }}
          />
          <Chip
            label="MAX"
            size="small"
            variant="outlined"
            onClick={onMax}
            sx={{ mr: '6px', background: 'transparent' }}
          />
        </Flex>
      </Flex>
      {renderNoti()}
    </Flex>
  )
}

export default React.memo(RemoveLpInputPanel)

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Currency, Pair } from 'definixswap-sdk'
import BigNumber from 'bignumber.js'
import styled from 'styled-components'
import { Text, Flex, Box, SmallDownIcon, Noti, NotiType } from '@fingerlabs/definixswap-uikit-v2'
import { Input as NumericalInput } from 'uikitV2/components/NumericalInput'
import { useActiveWeb3React } from 'hooks'
import { mediaQueries } from 'uikitV2/base'
import { useModal } from 'uikit-dev'
import AnountButton from 'uikit-dev/components/AnountButton'
import Lp from 'components/Lp'
import Coin from 'uikitV2/components/Coin'
import { textStyle } from 'uikitV2/text'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'
import { useCurrencyBalance } from '../../state/wallet/hooks'

interface CurrencyInputPanelProps {
  isMobile: boolean
  value: string
  currency?: Currency
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  id: string
  onMax?: () => void
  onQuarter?: () => void
  onHalf?: () => void
  onUserInput: (value: string) => void
  onCurrencySelect: (currency: Currency) => void
  isInsufficientBalance?: boolean
  maxTokenAmount?: string
}

const CurrencySelect = styled.button<{ selected: boolean }>`
  padding: 0;
  align-items: center;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  height: 100px;

  ${mediaQueries.mobile} {
    height: 90px;
  }
`

const CurrencyInputPanel = ({
  isMobile,
  value,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  otherCurrency,
  id,
  onMax,
  onQuarter,
  onHalf,
  onUserInput,
  onCurrencySelect,
  isInsufficientBalance,
  maxTokenAmount,
}: CurrencyInputPanelProps) => {
  // const { account } = useWallet()
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const [isMaxKlayNoti, setIsMaxKlayNoti] = useState<boolean>(false)
  const [balance, setBalance] = useState<string>('')

  const [onPresentCurrencySearchModal] = useModal(
    <CurrencySearchModal
      onCurrencySelect={onCurrencySelect}
      selectedCurrency={currency}
      otherSelectedCurrency={otherCurrency}
    />,
    false
  )

  const decimals = useMemo(() => 18, [])
  const overDp = useMemo(() => new BigNumber(value).decimalPlaces() > decimals, [value, decimals])

  const renderNoti = useCallback(() => {
    if (overDp) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          The value entered is out of the valid range
        </Noti>
      )
    }
    if (isInsufficientBalance) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          Insufficient balance
        </Noti>
      )
    }
    if (isMaxKlayNoti) {
      return (
        <Noti type={NotiType.ALERT} mt="12px">
          Full payment of KLAY
        </Noti>
      )
    }
    return null
  }, [isInsufficientBalance, isMaxKlayNoti, overDp])

  useEffect(() => {
    if (!hideBalance && !!currency && selectedCurrencyBalance) {
      setBalance(selectedCurrencyBalance?.toFixed(5))
      return
    }
    setBalance('-')
  }, [hideBalance, currency, selectedCurrencyBalance])

  useEffect(() => {
    if (currency?.symbol === 'KLAY') {
      if (Number(value) >= Number(balance)) {
        setIsMaxKlayNoti(true)
        return
      }
    }
    setIsMaxKlayNoti(false)
  }, [value, balance, maxTokenAmount, currency?.symbol])

  return (
    <>
      <Box id={id} mb="12px">
        <Flex justifyContent="space-between">
          {!hideInput && (
            <Flex flexDirection="row" flex="1 1 0" pr="20px">
              <Flex flexDirection="column" flex="1" position="relative">
                <Flex mb="4px">
                  <Text style={textStyle.R_14R} color="#666" mr="4px">
                    Balance
                  </Text>
                  <Text style={textStyle.R_14B} color="#666">
                    {balance}
                  </Text>
                </Flex>
                <NumericalInput value={value} onUserInput={(val) => onUserInput(val)} />
                {account && currency && onQuarter && onHalf && onMax && (
                  <>
                    <Flex mt="8px">
                      <AnountButton title="25%" onClick={onQuarter} />
                      <AnountButton title="50%" onClick={onHalf} />
                      <AnountButton title="MAX" onClick={onMax} />
                    </Flex>
                    {renderNoti()}
                  </>
                )}
              </Flex>
            </Flex>
          )}

          <CurrencySelect
            selected={!!currency}
            className="open-currency-select-button"
            onClick={() => {
              if (!disableCurrencySelect) {
                onPresentCurrencySearchModal()
              }
            }}
          >
            <Flex>
              <Flex alignItems="center" height={isMobile ? '32px' : '40px'} mr="6px">
                <Flex>{!disableCurrencySelect && <SmallDownIcon />}</Flex>
              </Flex>
              <Flex flexDirection="column" alignItems="center">
                <Flex mb="5px">
                  {pair && <Lp lpSymbols={[pair.token0, pair.token1]} size={16} />}
                  {!pair && currency && <Coin symbol={currency?.symbol} size={isMobile ? 32 : 40} />}
                  {!pair && !currency && <Coin symbol="UNSELECT" size={isMobile ? 32 : 40} />}
                </Flex>
                {pair && (
                  <Text style={isMobile ? textStyle.R_12B : textStyle.R_14B} color="#222">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </Text>
                )}
                {!pair && (
                  <Text style={textStyle.R_14B} color="#222">
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? `${currency.symbol.slice(0, 4)}...${currency.symbol.slice(
                          currency.symbol.length - 5,
                          currency.symbol.length
                        )}`
                      : currency?.symbol) || (
                      <Text style={textStyle.R_14B} color="#222">
                        Token
                      </Text>
                    )}
                  </Text>
                )}
              </Flex>
            </Flex>
          </CurrencySelect>
        </Flex>
      </Box>
    </>
  )
}

export default CurrencyInputPanel

import { BorderCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { FindPoolTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { StyledInternalLink } from 'components/Shared'
import { Dots } from 'components/swap/styleds'
import TranslatedText from 'components/TranslatedText'
import { PairState, usePair } from 'data/Reserves'
import { Currency, ETHER, JSBI, TokenAmount } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import React, { useCallback, useEffect, useState } from 'react'
import { usePairAdder } from 'state/user/hooks'
import { useTokenBalance } from 'state/wallet/hooks'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import PageTitle from 'uikitV2/components/PageTitle'
import Card from 'uikitV2/components/Card'
import { Button as ButtonMUI } from '@mui/material'
import { Noti } from '@fingerlabs/definixswap-uikit-v2'
import { ArrowBackIcon, AddIcon, Button, CardBody, ChevronDownIcon, Text, Flex, useMatchBreakpoints } from 'uikit-dev'
import { currencyId } from 'utils/currencyId'
import { ChangePlusIcon } from 'uikitV2/components/Icon'
import { useHistory } from 'react-router-dom'
import { textStyle } from 'uikitV2/text'
import SelectCurrencyPanel from './SelectCurrencyPanel'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

export default function PoolFinder() {
  const { isXl } = useMatchBreakpoints()
  const isMobile = !isXl
  const history = useHistory()
  const { account } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(ETHER)
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  const [pairState, pair] = usePair(currency0 ?? undefined, currency1 ?? undefined)
  const addPair = usePairAdder()

  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
    )

  const position: TokenAmount | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.raw, JSBI.BigInt(0)))
  // const { toastSuccess } = useToast()

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  const handleCurrency0 = useCallback(
    (currency: Currency) => {
      if (currency === currency1) {
        setCurrency1(currency0)
        setCurrency0(currency1)
        return
      }
      setCurrency0(currency)
    },
    [currency1, currency0]
  )

  const handleCurrency1 = useCallback(
    (currency: Currency) => {
      if (currency === currency0) {
        setCurrency0(currency1)
        setCurrency1(currency0)
        return
      }
      setCurrency1(currency)
    },
    [currency0, currency1]
  )

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const onClickCreatePoolButton = useCallback(() => {
    if (pair) {
      addPair(pair)
      // toastSuccess('Import Complete')
      history.replace(`/add`)
    }
  }, [pair, addPair, history])

  const onClickAddLiquidityButton = useCallback(
    (currencyId0, currencyId1) => {
      history.replace(`/add/${currencyId0}/${currencyId1}`)
    },
    [history]
  )

  useEffect(() => {
    if (!account) {
      history.push('/add')
    }
  }, [account, history])

  return (
    <SmallestLayout>
      <Flex flexDirection="column" width={isMobile ? '100%' : '629px'} mb="40px">
        <Flex mb="20px" onClick={() => history.replace('/add')} style={{ cursor: 'pointer' }}>
          <ArrowBackIcon color="#999" />
          <Text
            ml="6px"
            style={isMobile ? textStyle.R_14M : textStyle.R_16M}
            color="#999"
            mt={isMobile ? '0px' : '-2px'}
          >
            Back
          </Text>
        </Flex>
        <PageTitle
          title="Import Pool"
          caption="Use this tool to find pairs that don’t automatically appear in the interface."
        />
      </Flex>

      <Card>
        <CardBody p="40px !important">
          <SelectCurrencyPanel currency={currency0} onCurrencySelect={handleCurrency0} />

          <Flex justifyContent="center" m="12px 0">
            <ChangePlusIcon />
          </Flex>

          <SelectCurrencyPanel currency={currency1} onCurrencySelect={handleCurrency1} />

          {(!currency0 || !currency1) && (
            <Noti type="guide" mt="12px">
              Select a token to find your liquidity.
            </Noti>
          )}

          {currency0 && currency1 && (
            <>
              {pairState === PairState.EXISTS && (
                <>
                  {hasPosition && pair && (
                    <Flex mt="40px" flexDirection="column">
                      <MinimalPositionCard pair={pair} />
                      <Button
                        mt="40px"
                        // scale={ButtonScales.LG}
                        onClick={onClickCreatePoolButton}
                      >
                        Import
                      </Button>
                    </Flex>
                  )}
                  {(!hasPosition || !pair) && (
                    <Flex mt="40px" justifyContent="space-between" alignItems="center">
                      <Text style={textStyle.R_14R} color="#666">
                        {true ? 'You don’t have liquidity in this pool yet.' : ''}
                      </Text>
                      <ButtonMUI
                        variant="contained"
                        color="secondary"
                        style={{ width: 186 }}
                        // scale={ButtonScales.MD}
                        onClick={() => onClickAddLiquidityButton(currencyId(currency0), currencyId(currency1))}
                      >
                        Add Liquidity
                      </ButtonMUI>
                    </Flex>
                  )}
                </>
              )}
              {pairState === PairState.NOT_EXISTS && (
                <>
                  <Flex mt="40px" flexDirection="column">
                    {pair && (
                      <>
                        <MinimalPositionCard pair={pair} />
                        <Button
                          // mt={pair ? '40px' : '0px'}
                          // width="100%"
                          // scale={ButtonScales.LG}
                          onClick={onClickCreatePoolButton}
                        >
                          Import
                        </Button>
                      </>
                    )}
                    {!pair && (
                      <Flex justifyContent="space-between" alignItems="center">
                        <Text style={textStyle.R_14R} color="#666">
                          {true ? 'You don’t have liquidity in this pool yet.' : ''}
                        </Text>
                        <ButtonMUI
                          variant="contained"
                          color="secondary"
                          style={{ width: 186 }}
                          // scale={ButtonScales.MD}
                          onClick={() => onClickAddLiquidityButton(currencyId(currency0), currencyId(currency1))}
                        >
                          Add Liquidity
                        </ButtonMUI>
                      </Flex>
                    )}
                  </Flex>
                </>
              )}
            </>
          )}

          {/* {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <Text textAlign="center">Pool Found!</Text>
            </ColumnCenter>
          )}

          {currency0 && currency1 ? (
            pairState === PairState.EXISTS ? (
              hasPosition && pair ? (
                <MinimalPositionCard pair={pair} />
              ) : (
                <BorderCard padding="32px">
                  <AutoColumn gap="sm" justify="center">
                    <Text color="textSubtle" textAlign="center" fontSize="16px" className="mb-1">
                      You don’t have liquidity in this pool yet.
                    </Text>

                    <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <TranslatedText translationId={100}>Add Liquidity</TranslatedText>
                    </StyledInternalLink>
                  </AutoColumn>
                </BorderCard>
              )
            ) : validPairNoLiquidity ? (
              <BorderCard padding="32px">
                <AutoColumn gap="sm" justify="center">
                  <Text color="textSubtle" textAlign="center" fontSize="16px" className="mb-1">
                    No pool found.
                  </Text>
                  <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                    Create pool.
                  </StyledInternalLink>
                </AutoColumn>
              </BorderCard>
            ) : pairState === PairState.INVALID ? (
              <BorderCard padding="32px">
                <Text color="textSubtle" textAlign="center" fontSize="16px">
                  <TranslatedText translationId={136}>Invalid pair.</TranslatedText>
                </Text>
              </BorderCard>
            ) : pairState === PairState.LOADING ? (
              <BorderCard padding="32px">
                <AutoColumn gap="sm" justify="center">
                  <Text color="textSubtle" textAlign="center" fontSize="16px">
                    <Dots>Loading</Dots>
                  </Text>
                </AutoColumn>
              </BorderCard>
            ) : null
          ) : (
            <BorderCard padding="32px">
              <Text textAlign="center" color="textSubtle" fontSize="16px">
                {!account ? 'Connect to a wallet to find pools' : 'Select a token to find your liquidity.'}
              </Text>
            </BorderCard>
          )}

          <CurrencySearchModal
            isOpen={showSearch}
            onCurrencySelect={handleCurrencySelect}
            onDismiss={handleSearchDismiss}
            showCommonBases
            selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
          /> */}
        </CardBody>
      </Card>
    </SmallestLayout>
  )
}

import { Box, styled, Typography } from '@mui/material'
import { JSBI, Pair, Percent } from 'definixswap-sdk'
import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { Link } from 'react-router-dom'
import { Button, Text } from 'uikit-dev'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import { HoverCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

const Dot = styled('div')`
  background: ${({ theme }) => theme.palette.text.disabled};
  border-radius: 50%;
  width: 3px;
  height: 3px;
  margin-right: 6px;
`

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

interface PositionCardProps {
  pair: Pair
  // eslint-disable-next-line react/no-unused-prop-types
  showUnwrapped?: boolean
}

export function MinimalPositionCard({ pair, showUnwrapped = false }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && (
        <div>
          <Typography fontWeight={500} color="text.secondary" mb={1.5}>
            Balance LP
          </Typography>

          <Box display="flex">
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />

            <Box flexGrow={1} ml={1.5} mt="2px">
              <SpaceBetweenFormat
                noWrap
                mb={1}
                titleElm={
                  <Typography variant="body2">
                    {currency0.symbol}-{currency1.symbol}
                  </Typography>
                }
                value={userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
              />

              <SpaceBetweenFormat
                noWrap
                titleElm={
                  <div className="flex align-center">
                    <Dot />
                    <Typography variant="body2" color="text.disabled">
                      {currency0.symbol}
                    </Typography>
                  </div>
                }
                value={token0Deposited?.toSignificant(6) || '-'}
                mb={1}
              />
              <SpaceBetweenFormat
                noWrap
                titleElm={
                  <div className="flex align-center">
                    <Dot />
                    <Typography variant="body2" color="text.disabled">
                      {currency1.symbol}
                    </Typography>
                  </div>
                }
                value={token1Deposited?.toSignificant(6) || '-'}
              />
            </Box>
          </Box>
        </div>
      )}
    </>
  )
}

export default function FullPositionCard({ pair }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = unwrappedToken(pair.token0)
  const currency1 = unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance && !!totalPoolTokens && JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? new Percent(userPoolBalance.raw, totalPoolTokens.raw)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.raw, userPoolBalance.raw)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow onClick={() => setShowMore(!showMore)} style={{ cursor: 'pointer' }}>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin size={20} />
            <Text bold fontSize="16px !important">
              {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}/${currency1.symbol}`}
            </Text>
          </RowFixed>
          <RowFixed>
            {showMore ? <ChevronUp size="20" className="ml-2" /> : <ChevronDown size="20" className="ml-2" />}
          </RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <RowFixed>
                <Text>Pooled {currency0.symbol}:</Text>
              </RowFixed>
              {token0Deposited ? (
                <RowFixed>
                  <Text ml="6px">{token0Deposited?.toSignificant(6)}</Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency0} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <FixedHeightRow>
              <RowFixed>
                <Text>Pooled {currency1.symbol}:</Text>
              </RowFixed>
              {token1Deposited ? (
                <RowFixed>
                  <Text ml="6px">{token1Deposited?.toSignificant(6)}</Text>
                  <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={currency1} />
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Your pool tokens:</Text>
              <Text>{userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}</Text>
            </FixedHeightRow>
            <FixedHeightRow>
              <Text>Your pool share:</Text>
              <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(2)}%` : '-'}</Text>
            </FixedHeightRow>

            <RowBetween marginTop="10px">
              <Button
                as={Link}
                to={`/liquidity/add/${currencyId(currency0)}/${currencyId(currency1)}`}
                style={{ width: '48%' }}
              >
                Add
              </Button>
              <Button
                as={Link}
                style={{ width: '48%' }}
                to={`/liquidity/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
              >
                Remove
              </Button>
            </RowBetween>
          </AutoColumn>
        )}
      </AutoColumn>
    </HoverCard>
  )
}

import { Box, Button, Chip, styled, Typography, useMediaQuery, useTheme } from '@mui/material'
import { JSBI, Pair, Percent } from 'definixswap-sdk'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import SpaceBetweenFormat from 'uikitV2/components/SpaceBetweenFormat'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/wrappedCurrency'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween } from '../Row'
import { Dots } from '../swap/styleds'

const Dot = styled('div')`
  background: ${({ theme }) => theme.palette.text.disabled};
  border-radius: 50%;
  width: 3px;
  height: 3px;
  margin-right: 6px;
`

const CustomChip = styled(Chip)`
  background: ${({ theme }) => theme.palette.info.main};
  color: white;
  font-weight: normal;
  font-size: 0.75rem;
  width: 58px;
  height: 22px;
  min-height: initial;
  margin-right: 6px;
  padding: 2px 0px;
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
  const theme = useTheme()
  const mdUp = useMediaQuery(theme.breakpoints.up('md'))

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
    <Box
      py={{ xs: 3, md: 2 }}
      display="flex"
      alignItems={{ md: 'center' }}
      flexDirection={{ xs: 'column', md: 'row' }}
      sx={{ '&:not(:last-of-type)': { borderBottom: '1px solid #e0e0e0' } }}
    >
      <Box className="flex align-center" pr={{ md: 2.5 }} mb={{ xs: 2.5, md: 0 }}>
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin size={32} />

        <div>
          {mdUp && (
            <Typography variant="caption" className="d-block" color="text.disabled" mb={0.75}>
              LP
            </Typography>
          )}
          <Typography fontWeight={500} mb={0.5}>
            {!currency0 || !currency1 ? <Dots>Loading</Dots> : `${currency0.symbol}-${currency1.symbol}`}
          </Typography>
          <Typography variant="body2" fontWeight={500} color="text.secondary" width="130px">
            {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
          </Typography>
        </div>
      </Box>

      <Box pr={{ md: 2.5 }} mb={{ xs: 3, md: 0 }} mr="auto">
        <Typography variant="caption" className="d-block" color="text.disabled" mb={0.5}>
          Pooled
        </Typography>

        <div className="flex mb-1">
          <CustomChip label={currency0.symbol} size="small" />
          <Typography fontWeight={500} width="140px">
            {token0Deposited ? token0Deposited?.toSignificant(6) : '-'}
          </Typography>
        </div>

        <div className="flex">
          <CustomChip label={currency1.symbol} size="small" />
          <Typography fontWeight={500} width="140px">
            {token1Deposited ? token1Deposited?.toSignificant(6) : '-'}
          </Typography>
        </div>
      </Box>

      {/* <div>
        <Text>Your pool share:</Text>
        <Text>{poolTokenPercentage ? `${poolTokenPercentage.toFixed(2)}%` : '-'}</Text>
      </div> */}

      <div>
        <Button
          variant="outlined"
          component={Link}
          sx={{
            color: theme.palette.text.secondary,
            borderColor: '#e0e0e0',
            width: { xs: '100%', md: '100px' },
            height: { xs: '48px', md: '40px' },
          }}
          to={`/liquidity/remove/${currencyId(currency0)}/${currencyId(currency1)}`}
        >
          Select
        </Button>
      </div>
    </Box>
  )
}

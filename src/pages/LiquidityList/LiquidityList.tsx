import { ImgEmptyStateLiquidity, ImgEmptyStateWallet } from '@fingerlabs/definixswap-uikit-v2'
import { Box, Link as MuiLink, Typography } from '@mui/material'
import ConnectWalletButton from 'components/ConnectWalletButton'
import FullPositionCard from 'components/PositionCard'
import { usePairs } from 'data/Reserves'
import { Pair } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'

const LiquidityList: React.FC = () => {
  const { account } = useActiveWeb3React()
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ])

  const [v2PairsBalances] = useTokenBalancesWithLoadingIndicator(account ?? undefined, liquidityTokens)
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )
  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const allV2PairsWithLiquidity = useMemo(
    () => v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair)),
    [v2Pairs]
  )

  return (
    <>
      {!account && (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={5}>
          <Box mb={3}>
            <ImgEmptyStateWallet />
          </Box>
          <Typography mb={7.5} color="text.secondary" align="center" fontWeight={500}>
            Connect to a wallet to view your liquidity.
          </Typography>
          <ConnectWalletButton fullWidth />
        </Box>
      )}
      {account && allV2PairsWithLiquidity.length > 0 && (
        <Box px={{ xs: 2.5, md: 5 }} py={{ md: 3 }}>
          {allV2PairsWithLiquidity?.map((v2Pair, i) => (
            <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
          ))}
        </Box>
      )}
      {account && allV2PairsWithLiquidity.length <= 0 && (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" p={5} pb={0}>
          <Box mb={3}>
            <ImgEmptyStateLiquidity />
          </Box>
          <Typography mb={3} color="text.secondary" align="center" fontWeight={500}>
            No liquidity found.
          </Typography>
        </Box>
      )}
      {account && (
        <Box display="flex" justifyContent="center" flexWrap="wrap" p={5} pt={0}>
          <Typography variant="caption" color="text.disabled">
            {true && "Don't see a pool you joined?"}
          </Typography>
          <MuiLink to="/liquidity/find" component={Link} variant="caption" ml={1} fontWeight={500}>
            Find other LP tokens
          </MuiLink>
        </Box>
      )}
    </>
  )
}

export default React.memo(LiquidityList)

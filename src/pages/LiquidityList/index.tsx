import { Box, Tabs, Tab } from '@mui/material'
import FullPositionCard from 'components/PositionCard'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Question from 'components/QuestionHelper'
import { StyledInternalLink } from 'components/Shared'
import { Dots } from 'components/swap/styleds'
import TranslatedText from 'components/TranslatedText'
import { bsc, injected, walletconnect } from 'connectors'
import { usePairs } from 'data/Reserves'
import { Pair } from 'definixswap-sdk'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { isTransactionRecent, useAllTransactions } from 'state/transactions/hooks'
import { TransactionDetails } from 'state/transactions/reducer'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import styled from 'styled-components'
import { Flex, Button, CardBody, ConnectorId, Heading, Text, useMatchBreakpoints } from 'uikit-dev'
import { Overlay } from 'uikit-dev/components/Overlay'
import UserBlock from 'uikit-dev/widgets/Menu/UserBlock'
import Card from 'uikitV2/components/Card'
import { ImgEmptyStateLiquidity, ImgEmptyStateWallet } from 'uikitV2/components/Icon'
import PageTitle from 'uikitV2/components/PageTitle'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import { TranslateString } from 'utils/translateTextHelpers'
import { textStyle } from 'uikitV2/text'
import Flip from '../../uikit-dev/components/Flip'
import { Wrapper } from './styleds'

const newTransactionsFirst = (a: TransactionDetails, b: TransactionDetails) => b.addedTime - a.addedTime

const TutorailsLink = styled(Link)`
  text-decoration-line: underline;
  font-size: 14px;
  font-weight: bold;
  color: #1587c9;
`

export default function LiquidityList() {
  const { account, chainId, activate, deactivate } = useActiveWeb3React()
  const [isShowRightPanel, setIsShowRightPanel] = useState(false)
  const { isXl } = useMatchBreakpoints()
  const isMobileOrTablet = !isXl
  const history = useHistory()

  const allTransactions = useAllTransactions()
  const allTokens = useAllTokens()

  // Logic taken from Web3Status/index.tsx line 175
  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs
      .filter(isTransactionRecent)
      .filter((t) => t.type === 'addLiquidity' || t.type === 'removeLiquidity')
      .sort(newTransactionsFirst)
  }, [allTransactions])

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  const [isPhrase2, setIsPhrase2] = useState(false)
  const phrase2TimeStamp = process.env.REACT_APP_PHRASE_2_TIMESTAMP
    ? parseInt(process.env.REACT_APP_PHRASE_2_TIMESTAMP || '', 10) || new Date().getTime()
    : new Date().getTime()
  const currentTime = new Date().getTime()
  useEffect(() => {
    if (currentTime < phrase2TimeStamp) {
      setTimeout(() => {
        setIsPhrase2(true)
      }, phrase2TimeStamp - currentTime)
    } else {
      setIsPhrase2(true)
    }
  }, [currentTime, phrase2TimeStamp])

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  useEffect(() => {
    if (isMobileOrTablet) {
      setIsShowRightPanel(false)
    }
  }, [isMobileOrTablet])

  useEffect(() => {
    return () => {
      setIsShowRightPanel(false)
    }
  }, [])

  const tabNames = useMemo(
    () => [
      {
        id: 'add',
        name: 'Add',
      },
      {
        id: 'remove',
        name: 'Remove',
      },
    ],
    []
  )
  const [currentTab, setCurrentTab] = useState(tabNames[1].id)

  const changeTab = useCallback(
    (tab: string) => {
      if (tab === tabNames[0].id) {
        history.push('/add')
      }
      if (tab === tabNames[1].id) {
        history.push('/list')
      }
    },
    [history, tabNames]
  )

  return (
    <SmallestLayout>
      <PageTitle
        title="Liquidity"
        caption="Pair your tokens and deposit in a liquidity pool to get high interest profit."
        link="https://sixnetwork.gitbook.io/definix/exchange/how-to-add-liquidity"
        linkLabel="Learn how to add Liquidity."
      />
      <Card>
        <Box>
          <Tabs
            value={currentTab}
            onChange={(e, value) => {
              changeTab(value)
            }}
            textColor="secondary"
            indicatorColor="secondary"
            aria-label="secondary tabs example"
          >
            {tabNames.map(({ id, name }) => (
              <Tab label={name} value={id} style={{ padding: '20px 48px' }} />
            ))}
          </Tabs>
        </Box>

        <Wrapper>
          <CardBody p="40px !important">
            <div className="pa-6">
              {!account ? (
                <Flex flexDirection="column" justifyContent="center" alignItems="center" p="40px">
                  <Box mb="24px">
                    <ImgEmptyStateWallet />
                  </Box>
                  <Text mb="60px" style={textStyle.R_16M} color="#666" textAlign="center">
                    Connect to a wallet to view your liquidity
                  </Text>
                  <ConnectWalletButton fullWidth />
                </Flex>
              ) : // <div className="py-6 flex flex-column align-center">
              //   {isMobileOrTablet && (
              //     <UserBlock
              //       account={account as string}
              //       login={(connectorId: ConnectorId) => {
              //         if (connectorId === 'walletconnect') {
              //           return activate(walletconnect)
              //         }

              //         if (connectorId === 'bsc') {
              //           return activate(bsc)
              //         }

              //         return activate(injected)
              //       }}
              //       logout={deactivate}
              //     />
              //   )}

              //   <Text color="textSubtle" textAlign="center" fontSize="16px" className="mt-2">
              //     Connect to a wallet to view your liquidity.
              //   </Text>
              // </div>
              v2IsLoading ? (
                <div className="pa-6">
                  <Text color="textSubtle" textAlign="center" fontSize="16px">
                    <Dots>Loading</Dots>
                  </Text>
                </div>
              ) : allV2PairsWithLiquidity?.length > 0 ? (
                <Box p={isMobileOrTablet ? '0px 20px' : '24px 40px'}>
                  {allV2PairsWithLiquidity?.map((v2Pair, i) => (
                    <FullPositionCard
                      key={v2Pair.liquidityToken.address}
                      pair={v2Pair}
                      // isLastCard={allV2PairsWithLiquidity.length - 1 === i}
                    />
                  ))}
                </Box>
              ) : (
                <Flex
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  p={isMobileOrTablet ? '50px 0px 28px 0px' : '60px 60px 48px 60px'}
                >
                  <Box mb="24px">
                    <ImgEmptyStateLiquidity />
                  </Box>
                  <Text style={textStyle.R_16M} color="#666">
                    No liquidity found
                  </Text>
                </Flex>
              )}

              {account && (
                <Flex
                  justifyContent="center"
                  p={isMobileOrTablet ? '0px 22px 24px 22px' : '0px 0px 40px 0px'}
                  flexWrap="wrap"
                >
                  <Text style={textStyle.R_12R} color="#999">
                    {true ? "Don't see a pool you joined?" : ''}
                  </Text>
                  <Box onClick={() => history.push('/find')}>
                    <Text
                      ml="12px"
                      style={{ ...textStyle.R_12M, textDecoration: 'underline', cursor: 'pointer' }}
                      color="#ff5532"
                    >
                      Find other LP tokens
                    </Text>
                  </Box>
                </Flex>
              )}
            </div>
          </CardBody>
        </Wrapper>
      </Card>
    </SmallestLayout>
  )
}

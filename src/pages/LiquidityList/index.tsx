import { Tab, Tabs } from '@mui/material'
import React, { useCallback, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import Card from 'uikitV2/components/Card'
import PageTitle from 'uikitV2/components/PageTitle'
import SmallestLayout from 'uikitV2/components/SmallestLayout'
import LiquidityList from './LiquidityList'

export default function Liquidity() {
  const history = useHistory()

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

  const changeTab = useCallback(
    (tab: string) => {
      if (tab === tabNames[0].id) {
        history.push('/liquidity/add')
      }
      if (tab === tabNames[1].id) {
        history.push('/liquidity/list')
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
        <Tabs
          value={tabNames[1].id}
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

        <LiquidityList />
      </Card>
    </SmallestLayout>
  )
}

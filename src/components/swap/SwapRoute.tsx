import { KeyboardDoubleArrowRightRounded } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { Trade } from 'definixswap-sdk'
import React, { Fragment, memo } from 'react'
import CurrencyLogo from '../CurrencyLogo'

export default memo(function SwapRoute({ trade }: { trade: Trade }) {
  return (
    <div className="flex align-center flex-wrap">
      {trade.route.path.map((token, i, path) => {
        const isLastItem: boolean = i === path.length - 1
        return (
          // eslint-disable-next-line react/no-array-index-key
          <Fragment key={i}>
            <div className="flex align-center">
              <CurrencyLogo currency={token} size="22px" />
              <Typography variant="body2" fontWeight="bold" color="text.secondary" ml={0.75}>
                {token.symbol}
              </Typography>
            </div>
            {isLastItem ? null : (
              <KeyboardDoubleArrowRightRounded sx={{ fontSize: '1rem', color: 'text.secondary', mx: 1 }} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
})

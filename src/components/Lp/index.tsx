import zIndex from '@mui/material/styles/zIndex'
import { Currency } from 'definixswap-sdk'
import React from 'react'
import styled from 'styled-components'
import CurrencyLogo from '../CurrencyLogo'

const Wrapper = styled.div<{ margin: boolean; sizeraw: number }>`
  position: relative;
  display: flex;
  flex-direction: row;
  margin-right: ${({ sizeraw, margin }) => margin && `${(sizeraw / 3 + 8).toString()}px`};
`

interface LpProps {
  size: number
  lpSymbols: Currency[]
  margin?: boolean
}

export default function Lp({ lpSymbols = [], size = 16, margin = false }: LpProps) {
  return (
    <Wrapper sizeraw={size} margin={margin}>
      {lpSymbols.map((currency, index) => (
        <CurrencyLogo
          {...{
            size: `${size}px`,
            currency,
            style: { marginLeft: index === 0 ? 0 : -8, zIndex: lpSymbols.length - index },
          }}
        />
      ))}
    </Wrapper>
  )
}

import { PriorityHighRounded } from '@mui/icons-material'
import ArrowDropDownRoundedIcon from '@mui/icons-material/ArrowDropDownRounded'
import { Box, styled, Typography } from '@mui/material'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import TranslatedText from 'components/TranslatedText'
import { Currency, Pair } from 'definixswap-sdk'
import React from 'react'

const CurrencySelectStyle = styled('button')`
  padding: 0;
  align-items: center;
  background-color: transparent;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  display: flex;
  align-items: center;
  width: fit-content;
`

const EmptyLogo = () => {
  return (
    <Box
      sx={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.disabled',

        svg: {
          fontSize: '1rem',
        },
      }}
    >
      <PriorityHighRounded />
    </Box>
  )
}

interface CurrencySelectProps {
  currency?: Currency | null
  disabled?: boolean
  pair?: Pair | null
  onClick: () => void
}

const CurrencySelect = ({ pair = null, currency, disabled = false, onClick }: CurrencySelectProps) => {
  return (
    <CurrencySelectStyle onClick={onClick}>
      {!disabled && <ArrowDropDownRoundedIcon sx={{ mr: 0.5, color: 'text.disabled' }} />}

      <Box display="flex" flexDirection="column" alignItems="center">
        <Box mb={0.5}>
          {pair ? (
            <DoubleCurrencyLogo currency0={pair?.token0} currency1={pair?.token1} size={40} />
          ) : currency ? (
            <CurrencyLogo currency={currency} size="40px" />
          ) : (
            <EmptyLogo />
          )}
        </Box>

        {pair ? (
          <Typography variant="body2" fontWeight="bold">
            {pair?.token0.symbol}:{pair?.token1.symbol}
          </Typography>
        ) : (
          <Typography variant="body2" fontWeight="bold">
            {(currency && currency.symbol && currency.symbol.length > 20
              ? `${currency.symbol.slice(0, 4)}...${currency.symbol.slice(
                  currency.symbol.length - 5,
                  currency.symbol.length
                )}`
              : currency?.symbol) || <TranslatedText translationId={82}>Token</TranslatedText>}
          </Typography>
        )}
      </Box>
    </CurrencySelectStyle>
  )
}

export default CurrencySelect

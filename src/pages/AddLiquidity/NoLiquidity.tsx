import { ErrorRounded } from '@mui/icons-material'
import { Box, Typography } from '@mui/material'
import React from 'react'

const NoLiquidity = () => {
  return (
    <Box sx={{ background: 'rgba(224, 224, 224, 0.2)', p: '20px 28px' }}>
      <Typography color="text.secondary" fontWeight={500} mb={1} display="flex" alignItems="center">
        <ErrorRounded sx={{ fontSize: '0.875rem', color: 'text.disabled', mr: 1 }} /> You are the first liquidity
        provider.
      </Typography>

      <Typography variant="body2" color="text.disabled">
        The ratio of tokens you add will set the price of this pool. Once you are happy with the rate click supply to
        review.
      </Typography>
    </Box>
  )
}

export default React.memo(NoLiquidity)

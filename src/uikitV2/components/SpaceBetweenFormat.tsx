import { HelpOutlineRounded } from '@mui/icons-material'
import { Box, BoxProps, Tooltip, Typography } from '@mui/material'
import React from 'react'

interface Type {
  title?: string
  value?: string
  titleElm?: any
  valueElm?: any
  tooltip?: string
}

const SpaceBetweenFormat = ({ title, value, titleElm, valueElm, tooltip, ...props }: BoxProps & Type) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" {...props}>
      {titleElm || (
        <Typography variant="body2" color="text.disabled" className="flex align-center">
          {title}
          {tooltip && (
            <Tooltip title={tooltip}>
              <HelpOutlineRounded className="ml-1" sx={{ width: '16px', height: '16px' }} />
            </Tooltip>
          )}
        </Typography>
      )}
      {valueElm || (
        <Typography variant="body2" color="text.secondary" fontWeight="bold">
          {value}
        </Typography>
      )}
    </Box>
  )
}

export default SpaceBetweenFormat

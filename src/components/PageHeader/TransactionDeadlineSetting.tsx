import { HelpOutlineRounded } from '@mui/icons-material'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import { Box, InputAdornment, OutlinedInput, Tooltip, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useUserDeadline } from 'state/user/hooks'

const TransactionDeadlineSetting = () => {
  const [deadline, setDeadline] = useUserDeadline()
  const [value, setValue] = useState(deadline / 60) // deadline in minutes
  const [error, setError] = useState<string | null>(null)

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = evt.target
    setValue(parseInt(inputValue, 10))
  }

  // Updates local storage if value is valid
  useEffect(() => {
    try {
      const rawValue = value * 60
      if (!Number.isNaN(rawValue) && rawValue > 0) {
        setDeadline(rawValue)
        setError(null)
      } else {
        setError('Enter a valid deadline')
      }
    } catch {
      setError('Enter a valid deadline')
    }
  }, [value, setError, setDeadline])

  return (
    <Box>
      <Typography color="text.secondary" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }} mb={2}>
        Transaction Deadline
        <Tooltip title="Your transaction will revert if it is pending for more than this long.">
          <HelpOutlineRounded className="ml-1" sx={{ width: '16px', height: '16px' }} />
        </Tooltip>
      </Typography>

      <OutlinedInput
        type="number"
        inputProps={{ step: 1, min: 1 }}
        size="small"
        placeholder="5%"
        value={value}
        onChange={handleChange}
        endAdornment={
          <InputAdornment position="end">
            <Typography fontWeight={500} color="text.secondary">
              Minutes
            </Typography>
          </InputAdornment>
        }
        sx={{ width: '184px' }}
      />

      {error && (
        <Typography variant="body2" color="error" mt="8px" sx={{ display: 'flex', alignItems: 'center', mt: '12px' }}>
          <ErrorRoundedIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
          {error}
        </Typography>
      )}
    </Box>
  )
}

export default TransactionDeadlineSetting

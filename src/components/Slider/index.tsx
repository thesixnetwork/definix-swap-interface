import { Box } from '@mui/material'
import React, { ChangeEvent, useCallback, useMemo, InputHTMLAttributes } from 'react'
import styled from 'styled-components'

// const StyledRangeInput = styled.input<{ size: number }>`
//   -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
//   width: 100%; /* Specific width is required for Firefox. */
//   background: transparent; /* Otherwise white in Chrome */
//   cursor: pointer;

//   &:focus {
//     outline: none;
//   }

//   &::-moz-focus-outer {
//     border: 0;
//   }

//   &::-webkit-slider-thumb {
//     -webkit-appearance: none;
//     height: ${({ size }) => size}px;
//     width: ${({ size }) => size}px;
//     background-color: #565a69;
//     border-radius: 100%;
//     border: none;
//     transform: translateY(-50%);
//     color: ${({ theme }) => theme.colors.invertedContrast};

//     &:hover,
//     &:focus {
//       box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
//         0px 24px 32px rgba(0, 0, 0, 0.04);
//     }
//   }

//   &::-moz-range-thumb {
//     height: ${({ size }) => size}px;
//     width: ${({ size }) => size}px;
//     background-color: #565a69;
//     border-radius: 100%;
//     border: none;
//     color: ${({ theme }) => theme.colors.invertedContrast};

//     &:hover,
//     &:focus {
//       box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
//         0px 24px 32px rgba(0, 0, 0, 0.04);
//     }
//   }

//   &::-ms-thumb {
//     height: ${({ size }) => size}px;
//     width: ${({ size }) => size}px;
//     background-color: #565a69;
//     border-radius: 100%;
//     color: ${({ theme }) => theme.colors.invertedContrast};

//     &:hover,
//     &:focus {
//       box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.1), 0px 4px 8px rgba(0, 0, 0, 0.08), 0px 16px 24px rgba(0, 0, 0, 0.06),
//         0px 24px 32px rgba(0, 0, 0, 0.04);
//     }
//   }

//   &::-webkit-slider-runnable-track {
//     background: linear-gradient(
//       90deg,
//       ${({ theme }) => theme.colors.primaryDark},
//       ${({ theme }) => theme.colors.tertiary}
//     );
//     height: 2px;
//   }

//   &::-moz-range-track {
//     background: linear-gradient(
//       90deg,
//       ${({ theme }) => theme.colors.primaryDark},
//       ${({ theme }) => theme.colors.tertiary}
//     );
//     height: 2px;
//   }

//   &::-ms-track {
//     width: 100%;
//     border-color: transparent;
//     color: transparent;

//     background: ${({ theme }) => theme.colors.primaryDark};
//     height: 2px;
//   }
//   &::-ms-fill-lower {
//     background: ${({ theme }) => theme.colors.primaryDark};
//   }
//   &::-ms-fill-upper {
//     background: ${({ theme }) => theme.colors.tertiary};
//   }
// `

interface SliderProps {
  min: number
  max: number
  value: number
  onValueChanged: (newValue: number) => void
  valueLabel?: string
}

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  isCurrentValueMaxValue: boolean
}

const StyledInput = styled.input<StyledInputProps>`
  -webkit-appearance: none; /* Hides the slider so that custom slider can be made */
  width: 100%; /* Specific width is required for Firefox. */
  background: transparent; /* Otherwise white in Chrome */

  height: 33px;
  position: relative;
  cursor: pointer;
  box-shadow: unset;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border: 5px solid #ff6828;
    background-color: #fff;
    border-radius: 50%;
    cursor: pointer;
    transform: translate(-2px, 1px);
    box-shadow: unset;
  }
  &::-moz-range-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border: 5px solid #ff6828;
    background-color: #fff;
    border-radius: 50%;
    cursor: pointer;
    transform: translate(-2px, 1px);
    box-shadow: unset;
  }
  &::-ms-thumb {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    border: 5px solid #ff6828;
    background-color: #fff;
    border-radius: 50%;
    cursor: pointer;
    transform: translate(-2px, 1px);
    box-shadow: unset;
  }
`

const BarBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 5px;
  top: 18px;
  border-radius: 2.5px;
  background-color: #e0e0e0;
`

const BarProgress = styled.div<{ progress: number; isCurrentValueMaxValue: boolean }>`
  position: absolute;
  width: ${({ progress, isCurrentValueMaxValue }) => (isCurrentValueMaxValue ? 'calc(100% - 16px)' : `${progress}%`)};
  height: 5px;
  top: 18px;
  background-color: #ff6828;
  border-radius: 2.5px;
`

const Slider: React.FC<SliderProps> = ({ min, max, value, onValueChanged, ...props }) => {
  const handleChange = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      if (onValueChanged) {
        onValueChanged(parseInt(target.value, 10))
      }
    },
    [onValueChanged]
  )
  const progressPercentage = useMemo(() => (value / max) * 100, [value, max])
  const isCurrentValueMaxValue = useMemo(() => value === max, [value, max])

  return (
    <Box position="relative" height="48px" {...props}>
      <Box position="absolute" width="100%">
        <BarBackground />
        <BarProgress isCurrentValueMaxValue={isCurrentValueMaxValue} progress={progressPercentage} />
        <StyledInput
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleChange}
          isCurrentValueMaxValue={isCurrentValueMaxValue}
        />
      </Box>
    </Box>
  )
}

export default Slider

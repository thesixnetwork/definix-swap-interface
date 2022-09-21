import React, { ReactNode, useContext } from 'react'
import { Alert, Flex, IconButton, Text } from 'uikit-dev'
import styled, { ThemeContext } from 'styled-components'
import { BlockIcon, CheckmarkCircleIcon, CloseIcon, ErrorIcon, InfoIcon } from 'uikitV2/components/Svg'

const getThemeColor = (type: string) => {
  switch (type) {
    case 'error':
      return '#ff5532'
    case 'warning':
      return 'rgb(252,189,27)'
    case 'success':
      return 'rgb(2,161,161)'
    case 'info':
    default:
      return 'rgb(180,169,168)'
  }
}

const getIcon = (type: string) => {
  switch (type) {
    case 'error':
      return BlockIcon
    case 'waring':
      return ErrorIcon
    case 'success':
      return CheckmarkCircleIcon
    case 'info':
    default:
      return InfoIcon
  }
}

const withHandlerSpacing = 32 + 12 + 8 // button size + inner spacing + handler position
const Details = styled.div<{ hasHandler?: boolean }>`
  flex: 1;
  padding-left: 12px;
  padding-right: ${({ hasHandler }) => (hasHandler ? `${withHandlerSpacing}px` : '12px')};
`

const CloseHandler = styled.div`
  border-radius: 0 ${({ theme }) => theme.radii.default} ${({ theme }) => theme.radii.default} 0;
  right: 8px;
  position: absolute;
  top: 8px;
`

export default function MessagePopup({
  message,
  type,
  onClick,
  children,
}: {
  message: string
  type: string
  children?: ReactNode
  onClick?: () => void
}) {
  const Icon = getIcon(type)
  return (
    <Flex flexDirection="row" justifyContent="center">
      <Icon color={getThemeColor(type)} width="24px" />
      <Details>
        <Text bold>{message}</Text>
        {typeof children === 'string' ? <Text as="p">{children}</Text> : children}
      </Details>
    </Flex>
  )
}

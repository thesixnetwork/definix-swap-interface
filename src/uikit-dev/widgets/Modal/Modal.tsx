import { CloseIcon } from '@fingerlabs/definixswap-uikit-v2'
import React from 'react'
import styled from 'styled-components'
import { Text } from 'uikit-dev/components/Text'
import { spacing } from 'uikitV2/base'
import Flex from '../../components/Box/Flex'
import { Button, IconButton } from '../../components/Button'
import Heading from '../../components/Heading/Heading'
import { ArrowBackIcon } from '../../components/Svg'
import colorStroke from '../../images/Color-stroke.png'
import { InjectedProps } from './types'

interface Props extends InjectedProps {
  title: string
  hideCloseButton?: boolean
  onBack?: () => void
  bodyPadding?: string
  isRainbow?: boolean
  classHeader?: string
  maxWidth?: string
  className?: string
}

const StyledModal = styled.div<{ isRainbow: boolean }>`
  flex-direction: column;
  background: #ffffff;
  border-radius: ${spacing.S_16}px;
  width: 100%;
  z-index: 100;
  overflow-y: auto;
  align-self: center;
  max-height: 100%;

  // background: ${({ theme }) => theme.modal.background};
  // box-shadow: 0px 20px 36px -8px rgba(14, 14, 44, 0.1), 0px 1px 1px rgba(0, 0, 0, 0.05);
  // border-radius: ${({ theme }) => theme.radii.default};
  // width: 100%;
  // z-index: ${({ theme }) => theme.zIndices.modal};
  // overflow-y: auto;

  ${({ theme }) => theme.mediaQueries.xs} {
    width: auto;
    min-width: 300px;
  }

  position: relative;
  padding-bottom: ${({ isRainbow }) => (isRainbow ? '4px' : '0')};

  .color-stroke {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translate(-50%);
    height: 4px;
    width: 100%;
  }
`

const ModalHeader = styled.div<{ className?: string }>`
  display: flex;
  align-items: center;
  align-items: center;
  padding: 8px 8px 8px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const ModalTitle = styled(Flex)`
  align-items: center;
  flex: 1;
`

const Modal: React.FC<Props> = ({
  title,
  onDismiss,
  onBack,
  children,
  hideCloseButton = false,
  bodyPadding = '24px',
  isRainbow = false,
  classHeader = '',
  maxWidth = '',
  className = '',
}) => (
  <StyledModal isRainbow={isRainbow} style={{ maxWidth }} className={className}>
    <ModalHeader className={classHeader}>
      <ModalTitle>
        {onBack && (
          <Button variant="text" onClick={onBack} ml="-12px" padding="0 12px" startIcon={<ArrowBackIcon />}>
            <Text fontSize="14px" color="textSubtle">
              Back
            </Text>
          </Button>
        )}
        <Heading>{title}</Heading>
      </ModalTitle>

      {!hideCloseButton && (
        <IconButton variant="text" onClick={onDismiss} aria-label="Close the dialog">
          <CloseIcon />
        </IconButton>
      )}
    </ModalHeader>

    <Flex flexDirection="column" p={bodyPadding}>
      {children}
    </Flex>

    {isRainbow && <img className="color-stroke" alt="" src={colorStroke} />}
  </StyledModal>
)

export default Modal

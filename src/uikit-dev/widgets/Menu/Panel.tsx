import React from 'react'
import styled from 'styled-components'
import { Login } from '../WalletModal/types'
import { SIDEBAR_WIDTH_FULL } from './config'
import PanelBody from './PanelBody'
import PanelFooter from './PanelFooter'
import { PanelProps, PushedProps } from './types'

interface Props extends PanelProps, PushedProps {
  showMenu: boolean
  isMobile: boolean
  account?: string
  login: Login
  logout: () => void
}

const StyledPanel = styled.div<{ isPushed: boolean; showMenu: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-shrink: 0;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 22;

  width: ${({ isPushed }) => (isPushed ? `${SIDEBAR_WIDTH_FULL}px` : 0)};
  height: 100%;
  transition: padding-top 0.2s, width 0.2s;
  overflow: ${({ isPushed }) => (isPushed ? 'initial' : 'hidden')};
  transform: translate3d(0, 0, 0);
  background: ${({ theme }) => theme.colors.backgroundSideMenu};

  ${({ theme }) => theme.mediaQueries.md} {
    position: sticky;
    height: initial;
    width: ${SIDEBAR_WIDTH_FULL}px;
    background: transparent;
    z-index: 11;
  }
`

const Panel: React.FC<Props> = (props) => {
  const { isPushed, showMenu } = props

  return (
    <StyledPanel isPushed={isPushed} showMenu={showMenu}>
      <PanelBody {...props} />
      <PanelFooter {...props} />
    </StyledPanel>
  )
}

export default Panel

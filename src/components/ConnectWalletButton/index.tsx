import { Button } from '@mui/material'
import { useWeb3React } from '@web3-react/core'
import { injected, walletconnect } from 'connectors'
import useI18n from 'hooks/useI18n'
import React from 'react'
import { ConnectorId, useWalletModal } from 'uikit-dev'

const UnlockButton = (props) => {
  const TranslateString = useI18n()
  const { account, activate, deactivate } = useWeb3React()

  const handleLogin = (connectorId: ConnectorId) => {
    if (connectorId === 'walletconnect') {
      return activate(walletconnect)
    }
    return activate(injected)
  }

  const { onPresentConnectModal } = useWalletModal(handleLogin, deactivate, account as string)

  return (
    <Button variant="contained" size="large" onClick={onPresentConnectModal} {...props}>
      {TranslateString(292, 'Connect Wallet')}
    </Button>
  )
}

export default UnlockButton

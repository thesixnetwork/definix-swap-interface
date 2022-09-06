import SlippageToleranceSettings from 'components/PageHeader/SlippageToleranceSetting'
import TransactionDeadlineSetting from 'components/PageHeader/TransactionDeadlineSetting'
import React from 'react'
import ModalV2 from 'uikitV2/components/ModalV2'

type SettingsModalProps = {
  onDismiss?: () => void
}

const SettingsModal = ({ onDismiss }: SettingsModalProps) => {
  return (
    <ModalV2 title="Settings" onDismiss={onDismiss}>
      <SlippageToleranceSettings />
      <TransactionDeadlineSetting />
    </ModalV2>
  )
}

SettingsModal.defaultProps = {
  onDismiss: () => null,
}

export default SettingsModal

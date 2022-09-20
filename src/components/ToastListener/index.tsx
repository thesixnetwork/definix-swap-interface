import React from 'react'
import { useSelector } from 'react-redux'
import { ToastContainer, Toast } from 'uikit-dev'
// import { useToast } from 'state/hooks'
import { useToast } from 'hooks'
import { AppState } from 'state'

const ToastListener = () => {
  const toasts: Toast[] = useSelector((state: AppState) => state.toasts.data)
  const { remove } = useToast()

  const handleRemove = (id: string) => remove(id)

  return <ToastContainer toasts={toasts} onRemove={handleRemove} />
}

export default ToastListener

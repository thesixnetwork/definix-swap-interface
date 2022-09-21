import { createAction } from '@reduxjs/toolkit'
import { TokenList } from '@uniswap/token-lists'
import { ReactNode } from 'react'

export type PopupContent =
  | {
      txn: {
        hash: string
        success: boolean
        summary?: string
      }
    }
  | {
      listUpdate: {
        listUrl: string
        oldList: TokenList
        newList: TokenList
        auto: boolean
      }
    }
  | {
      message: {
        message: string
        type: string
        children?: ReactNode
        onClick?: () => void
      }
    }

export const updateBlockNumber = createAction<{ chainId: number; blockNumber: number }>('app/updateBlockNumber')
export const toggleWalletModal = createAction<void>('app/toggleWalletModal')
export const toggleSettingsMenu = createAction<void>('app/toggleSettingsMenu')
export const addPopup = createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>(
  'app/addPopup'
)
export const removePopup = createAction<{ key: string }>('app/removePopup')

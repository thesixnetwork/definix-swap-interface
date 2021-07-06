import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Trade, TokenAmount, CurrencyAmount, ETHER } from 'definixswap-sdk'
import { KlipConnector } from "@kanthakran/klip-connr"
import { KlipModalContext } from "klaytn-use-wallet"
import { useCallback, useMemo, useContext } from 'react'
import { useCaverJsReact } from 'caverjs-react-core'
import { ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useTransactionAdder, useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { calculateGasMargin } from '../utils'
import { useTokenContract } from './useContract'
import { useActiveWeb3React } from './index'
import * as klipProvider from './KlipProvider'
import { getApproveAbi } from './HookHelper'


export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount,
  spender?: string,

): [ApprovalState, () => Promise<void>] {
  const { account } = useActiveWeb3React()
  const { setShowModal } = useContext(KlipModalContext())
  console.log("account approve : ", account)
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  const { connector } = useCaverJsReact()
  // const { setShowModal } = useContext(KlipModalContext())
  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === ETHER) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()

  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false

    if (isKlipConnector(connector)) {
      const abi = JSON.stringify(getApproveAbi())
      const input = JSON.stringify([spender, '115792089237316195423570985008687907853269984665640564039457584007913129639935'])
      setShowModal(true)
      klipProvider.genQRcodeContactInteract(tokenContract.address, abi, input,"0")
      await klipProvider.checkResponse()
      setShowModal(false)
      
    } else {
      const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
        // general fallback for tokens who restrict approval amounts
        useExact = true
        return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString())
      })

      // eslint-disable-next-line consistent-return
      return tokenContract
        .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
          gasLimit: calculateGasMargin(estimatedGas),
        })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Approve ${amountToApprove.currency.symbol}`,
            approval: { tokenAddress: token.address, spender },
          })
        })
        .catch((error: Error) => {
          console.error('Failed to approve token', error)
          throw error
        })
    }
  }, [approvalState, token, tokenContract, amountToApprove, addTransaction, spender, connector, setShowModal])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage]
  )
  return useApproveCallback(amountToApprove, ROUTER_ADDRESS)
}

const isKlipConnector = (connector) => connector instanceof KlipConnector
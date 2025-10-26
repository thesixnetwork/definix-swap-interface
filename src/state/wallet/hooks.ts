import { Currency, CurrencyAmount, ETHER, JSBI, Token, TokenAmount } from 'definixswap-sdk'
import { useEffect, useMemo, useRef, useState } from 'react'
import { isAddress } from '../../utils'
import { useAllTokens } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { Contract, providers } from 'ethers'

const RPC_URL = 'https://bsc-dataseed.binance.org'
const provider: providers.JsonRpcBatchProvider = new providers.JsonRpcBatchProvider(
  RPC_URL,
  { name: 'bsc', chainId: 56 }
)

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)']

export function useETHBalances(
  uncheckedAddresses?: (string | undefined)[]
): { [address: string]: CurrencyAmount | undefined } {
  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .map(isAddress)
            .filter((a): a is string => a !== false)
            .sort()
        : [],
    [uncheckedAddresses]
  )

  const addrKey = useMemo(
    () => (addresses.length ? addresses.join("|") : ""),
    [addresses]
  )

  const [map, setMap] = useState<{ [address: string]: CurrencyAmount | undefined }>({})

  useMemo(() => {
    if (!addresses.length) {
      setMap({})
      return
    }

    let cancelled = false

    const fetchBalances = async () => {
      const rows = await Promise.all(
        addresses.map(async (addr) => {
          const v = await provider.getBalance(addr)
          return [addr, CurrencyAmount.ether(JSBI.BigInt(v.toString()))] as const
        })
      )

      if (!cancelled) {
        setMap(Object.fromEntries(rows) as { [address: string]: CurrencyAmount })
      }
    }

    fetchBalances().catch(() => {})

    return () => {
      cancelled = true
    }
  }, [addrKey, provider])

  return map
}



export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[]
): [{ [tokenAddress: string]: TokenAmount | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
    [tokens]
  )
  const tokenKey = useMemo(
    () => (validatedTokens.length ? validatedTokens.map(t => t.address.toLowerCase()).sort().join(',') : ''),
    [validatedTokens]
  )

  const [balances, setBalances] = useState<{ [tokenAddress: string]: TokenAmount | undefined }>({})
  const [loading, setLoading] = useState<boolean>(false)

  const reqIdRef = useRef(0)

  useEffect(() => {
    const key = `${address ?? ''}::${tokenKey}`

    reqIdRef.current += 1
    const myId = reqIdRef.current

    if (!address || validatedTokens.length === 0) {
      setBalances({})
      setLoading(false)
      return
    }

    setLoading(true)

    ;(async () => {
      const results = await Promise.all(
        validatedTokens.map(async (t) => {
          const c = new Contract(t.address, ERC20_ABI, provider)
          const v = await c.balanceOf(address)
          return [t.address, new TokenAmount(t, JSBI.BigInt(v.toString()))] as const
        })
      )

      if (reqIdRef.current === myId) {
        const next: { [tokenAddress: string]: TokenAmount | undefined } = {}
        for (const [addr, val] of results) next[addr] = val
        setBalances(next)
        setLoading(true) 
      }
    })()
      .catch(() => {
      })
      .finally(() => {
        if (reqIdRef.current === myId) {
          setLoading(false)
        }
      })

  }, [address, tokenKey])

  return [balances, loading]
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[]
): { [tokenAddress: string]: TokenAmount | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

export function useTokenBalance(account?: string, token?: Token): TokenAmount | undefined {
  const tokenBalances = useTokenBalances(account, [token])
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined)[]
): (CurrencyAmount | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((c): c is Token => c instanceof Token) ?? [],
    [currencies]
  )
  const tokenBalances = useTokenBalances(account, tokens)
  const containsETH: boolean = useMemo(
    () => currencies?.some(c => c === ETHER) ?? false,
    [currencies]
  )
  const ethBalance = useETHBalances(containsETH ? [account] : [])

  return useMemo(
    () =>
      currencies?.map(currency => {
        if (!account || !currency) return undefined
        if (currency instanceof Token) return tokenBalances[currency.address]
        if (currency === ETHER) return ethBalance[account]
        return undefined
      }) ?? [],
    [account, currencies, ethBalance, tokenBalances]
  )
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount | undefined {
  return useCurrencyBalances(account, [currency])[0]
}

export function useAllTokenBalances(): { [tokenAddress: string]: TokenAmount | undefined } {
  const { account } = useActiveWeb3React()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalances(account ?? undefined, allTokensArray)
  return balances ?? {}
}

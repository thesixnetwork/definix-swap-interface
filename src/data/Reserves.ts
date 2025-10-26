import { TokenAmount, Pair, Currency } from 'definixswap-sdk'
import { useEffect, useMemo, useState } from 'react'
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import { Contract } from '@ethersproject/contracts'
import { useActiveWeb3React } from '../hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const { chainId, library } = useActiveWeb3React()

  const tokens = useMemo(
    () =>
      currencies.map(([currencyA, currencyB]) => [
        wrappedCurrency(currencyA, chainId),
        wrappedCurrency(currencyB, chainId)
      ]),
    [chainId, currencies]
  )

  const pairAddresses = useMemo(
    () =>
      tokens.map(([tokenA, tokenB]) =>
        tokenA && tokenB && !tokenA.equals(tokenB) ? Pair.getAddress(tokenA, tokenB) : undefined
      ),
    [tokens]
  )

  const [data, setData] = useState<[PairState, Pair | null][]>(() =>
    tokens.map(([tokenA, tokenB]) => {
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
      return [PairState.LOADING, null]
    })
  )

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!library) {
        setData(
          tokens.map(([tokenA, tokenB]) => {
            if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
            return [PairState.LOADING, null]
          })
        )
        return
      }
      const rows = await Promise.all(
        pairAddresses.map(async (addr, i) => {
          const tokenA = tokens[i][0]
          const tokenB = tokens[i][1]
          if (!tokenA || !tokenB || tokenA.equals(tokenB) || !addr) return [PairState.INVALID, null] as [PairState, Pair | null]
          try {
            const c = new Contract(addr, IUniswapV2PairABI, library)
            const r = await c.getReserves()
            const reserve0 = r.reserve0 ?? r._reserve0 ?? r[0]
            const reserve1 = r.reserve1 ?? r._reserve1 ?? r[1]
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]
            return [
              PairState.EXISTS,
              new Pair(new TokenAmount(token0, reserve0.toString()), new TokenAmount(token1, reserve1.toString()))
            ] as [PairState, Pair | null]
          } catch {
            return [PairState.NOT_EXISTS, null] as [PairState, Pair | null]
          }
        })
      )
      if (!cancelled) setData(rows)
    }
    setData(
      tokens.map(([tokenA, tokenB]) => {
        if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null]
        return [PairState.LOADING, null]
      })
    )
    run()
    return () => {
      cancelled = true
    }
  }, [library, pairAddresses, tokens])

  return data
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  return usePairs([[tokenA, tokenB]])[0]
}


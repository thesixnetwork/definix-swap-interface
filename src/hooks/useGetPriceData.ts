import { useEffect, useState } from 'react'
import { Contract, providers } from 'ethers'
import { Pair, Token } from 'definixswap-sdk'

const RPC_URL = process.env.REACT_APP_NETWORK_URL
const provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(RPC_URL, {
  name: 'bsc',
  chainId: parseInt(process.env.REACT_APP_CHAIN_ID!),
})

const CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID!)

// สร้าง Token object ที่ definixswap-sdk ต้องการ
const FINIX = new Token(CHAIN_ID, process.env.REACT_APP_FINIX_ADDRESS_MAINNET!, 18, 'FINIX')
const BUSD = new Token(CHAIN_ID, process.env.REACT_APP_BUSD_ADDRESS_MAINNET!, 18, 'BUSD')
const USDT = new Token(CHAIN_ID, process.env.REACT_APP_USDT_ADDRESS_MAINNET!, 18, 'USDT')

// uniswapv2 pair ABI
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
]

type ApiResponse = {
  prices: {
    Finix: string
  }
  update_at: string
}

const useGetPriceData = () => {
  const [data, setData] = useState<ApiResponse | null>(null)

  useEffect(() => {
    const fetchPriceFromPair = async (tokenA: Token, tokenB: Token): Promise<number | undefined> => {
      try {

        const pairAddress = Pair.getAddress(tokenA, tokenB)

        const pair = new Contract(pairAddress, PAIR_ABI, provider)
        const [token0, token1] = await Promise.all([pair.token0(), pair.token1()])

        const { reserve0, reserve1 } = await pair.getReserves()

        if (
          !reserve0 ||
          !reserve1 ||
          reserve0.toString() === '0' ||
          reserve1.toString() === '0'
        ) {
          console.warn('[FINIX price] no liquidity in this pair')
          return undefined
        }

        let price: number | undefined

        if (token0.toLowerCase() === FINIX.address.toLowerCase()) {
          price = Number(reserve1) / Number(reserve0)
        } else if (token1.toLowerCase() === FINIX.address.toLowerCase()) {
          price = Number(reserve0) / Number(reserve1)
        } else {
          console.warn('[FINIX price] FINIX not found in this pair tokens')
          price = undefined
        }

        return price
      } catch (err) {
        console.error('[FINIX price] fetchPriceFromPair error', tokenA.symbol, tokenB.symbol, err)
        return undefined
      }
    }

    const fetchAll = async () => {

      const [busdPrice, usdtPrice] = await Promise.all([
        fetchPriceFromPair(FINIX, BUSD),
        fetchPriceFromPair(FINIX, USDT),
      ])


      const validPrices = [busdPrice, usdtPrice].filter(
        (p) => typeof p === 'number' && !isNaN(p)
      ) as number[]

      const avgPrice =
        validPrices.length > 0
          ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
          : undefined


      if (typeof avgPrice === 'number' && !isNaN(avgPrice)) {
        const payload: ApiResponse = {
          prices: { Finix: avgPrice.toString() },
          update_at: new Date().toISOString(),
        }
        setData(payload)
      } else {
        console.warn('[FINIX price] no valid price found, set data = null')
        setData(null)
      }
    }

    fetchAll()
  }, [])

  return data
}

export default useGetPriceData


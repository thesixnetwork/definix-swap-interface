import { Config, JSBI, Pair, Percent, Token, WETH } from 'definixswap-sdk'
import sdkconfig from '../sdkConfig'

Config.configure(sdkconfig)

const intMainnetId = parseInt(process.env.REACT_APP_MAINNET_ID || '')
const intTestnetId = parseInt(process.env.REACT_APP_TESTNET_ID || '')

export const ChainId = {
  MAINNET: intMainnetId,
  TESTNET: intTestnetId
}

export const ROUTER_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_ROUTER_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_ROUTER_ADDRESS_TESTNET || ''
}

export const DEPARAM_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_DEPARAM_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_DEPARAM_ADDRESS_TESTNET || ''
}

export const MULTICALL_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_MULTICALL_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_MULTICALL_ADDRESS_TESTNET || ''
}

export const SIX_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_SIX_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_SIX_ADDRESS_TESTNET || ''
}

export const FINIX_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_FINIX_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_FINIX_ADDRESS_TESTNET || ''
}

export const BUSD_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_BUSD_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_BUSD_ADDRESS_TESTNET || ''
}

export const USDT_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_USDT_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_USDT_ADDRESS_TESTNET || ''
}

export const WBNB_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_WBNB_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_WBNB_ADDRESS_TESTNET || ''
}

export const BTCB_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_BTCB_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_BTCB_ADDRESS_TESTNET || ''
}

export const ETH_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_ETH_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_ETH_ADDRESS_TESTNET || ''
}

export const XRP_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_XRP_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_XRP_ADDRESS_TESTNET || ''
}

export const ADA_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_ADA_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_ADA_ADDRESS_TESTNET || ''
}

export const VELO_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_VELO_ADDRESS_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_VELO_ADDRESS_TESTNET || ''
}

export const FINIX_SIX_LP = {
  [intMainnetId]: process.env.REACT_APP_FINIX_SIX_LP_MAINNET || '',
  [intTestnetId]: process.env.REACT_APP_FINIX_SIX_LP_TESTNET || ''
}

export const allTokens = {
  SIX: SIX_ADDRESS,
  FINIX: FINIX_ADDRESS,
  BUSD: BUSD_ADDRESS,
  USDT: USDT_ADDRESS,
  WBNB: WBNB_ADDRESS,
  BTCB: BTCB_ADDRESS,
  ETH: ETH_ADDRESS,
  XRP: XRP_ADDRESS,
  ADA: ADA_ADDRESS,
}

export const getLpAddress = (firstAddress: string, secondAddress: string, chainId: number) => {
  return Pair.getAddress(
    new Token(chainId, firstAddress, 18, 'DUMMY', 'DUMMY'),
    new Token(chainId, secondAddress, 18, 'DUMMY', 'DUMMY'),
  )
}

export const getLpNetwork = (firstToken, secondToken) => {
  return {
    [intMainnetId]: getLpAddress(firstToken[intMainnetId], secondToken[intMainnetId], intMainnetId),
    [intTestnetId]: getLpAddress(firstToken[intTestnetId], secondToken[intTestnetId], intTestnetId),
  }
}

export const HERODOTUS_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_HERODOTUS_MAINNET || '', // ==================
  [intTestnetId]: process.env.REACT_APP_HERODOTUS_TESTNET || ''
}

export const PANCAKE_MASTER_CHEF_ADDRESS = {
  [intMainnetId]: process.env.REACT_APP_PANCAKE_MASTER_CHEF_MAINNET || '', // ==================
  [intTestnetId]: process.env.REACT_APP_PANCAKE_MASTER_CHEF_TESTNET || ''
}

// export const DAI = new Token(intMainnetId, '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', 18, 'DAI', 'Dai Stablecoin')
// export const BUSD = new Token(intMainnetId, '0xe9e7cea3dedca5984780bafc599bd69add087d56', 18, 'BUSD', 'Binance USD')
// export const USDT = new Token(intMainnetId, '0x55d398326f99059ff775485246999027b3197955', 18, 'USDT', 'Tether USD')
// export const UST = new Token(
//   intMainnetId,
//   '0x23396cf899ca06c4472205fc903bdb4de249d6fc',
//   18,
//   'UST',
//   'Wrapped UST Token'
// )

const WETH_ONLY = {
  [intMainnetId]: [WETH(intMainnetId)],
  [intTestnetId]: [WETH(intTestnetId)]
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST = {
  ...WETH_ONLY,
  [intTestnetId]: [
    ...WETH_ONLY[intTestnetId],
    new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
    new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token'),
    new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD Token'),
    new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token'),
    new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB'),
    new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token'),
    new Token(intTestnetId, ETH_ADDRESS[intTestnetId], 18, 'ETH', 'ETH Token'),
    new Token(intTestnetId, XRP_ADDRESS[intTestnetId], 18, 'XRP', 'XRP Token'),
    new Token(intTestnetId, ADA_ADDRESS[intTestnetId], 18, 'ADA', 'ADA Token')
  ],
  [intMainnetId]: [
    ...WETH_ONLY[intMainnetId],
    new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
    new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
    new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD Token'),
    new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token'),
    new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB'),
    new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token'),
    new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token'),
    new Token(intMainnetId, XRP_ADDRESS[intMainnetId], 18, 'XRP', 'XRP Token'),
    new Token(intMainnetId, ADA_ADDRESS[intMainnetId], 18, 'ADA', 'ADA Token')
  ]
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES = {
  [intMainnetId]: {}
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES = {
  ...WETH_ONLY,
  [intMainnetId]: [...WETH_ONLY[intMainnetId]]
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR = {
  ...WETH_ONLY,
  [intMainnetId]: [...WETH_ONLY[intMainnetId]]
}

export const PINNED_PAIRS = {
  [intMainnetId]: [
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token')
    ],
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intMainnetId, SIX_ADDRESS[intMainnetId], 18, 'SIX', 'SIX Token'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ],
    [
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intMainnetId, FINIX_ADDRESS[intMainnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ],
    [
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intMainnetId, WBNB_ADDRESS[intMainnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ],
    [
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD BNB'),
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD BNB'),
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intMainnetId, BUSD_ADDRESS[intMainnetId], 18, 'BUSD', 'BUSD BNB'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ],
    [
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token'),
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intMainnetId, USDT_ADDRESS[intMainnetId], 18, 'USDT', 'USDT Token'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ],
    [
      new Token(intMainnetId, BTCB_ADDRESS[intMainnetId], 18, 'BTCB', 'BTCB Token'),
      new Token(intMainnetId, ETH_ADDRESS[intMainnetId], 18, 'ETH', 'ETH Token')
    ]
    [
      new Token(intMainnetId, VELO_ADDRESS[ChainId.MAINNET], 5, 'VELO', 'VELO Token'),
      new Token(intMainnetId, WBNB_ADDRESS[ChainId.MAINNET], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intMainnetId, VELO_ADDRESS[ChainId.MAINNET], 5, 'VELO', 'VELO Token'),
      new Token(intMainnetId, BUSD_ADDRESS[ChainId.MAINNET], 18, 'BUSD', 'BUSD BNB'),
    ],
    [
      new Token(intMainnetId, VELO_ADDRESS[ChainId.MAINNET], 5, 'VELO', 'VELO Token'),
      new Token(intMainnetId, FINIX_ADDRESS[ChainId.MAINNET], 18, 'FINIX', 'FINIX Token'),
    ],
  ],
  [intTestnetId]: [
    [
      new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
      new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token')
    ],
    [
      new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
      new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
      new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
      new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intTestnetId, SIX_ADDRESS[intTestnetId], 18, 'SIX', 'SIX Token'),
      new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intTestnetId, FINIX_ADDRESS[intTestnetId], 18, 'FINIX', 'FINIX Token'),
      new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD Token')
    ],
    [
      new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intTestnetId, WBNB_ADDRESS[intTestnetId], 18, 'WBNB', 'Wrapped BNB'),
      new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD BNB'),
      new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token')
    ],
    [
      new Token(intTestnetId, BUSD_ADDRESS[intTestnetId], 18, 'BUSD', 'BUSD BNB'),
      new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token')
    ],
    [
      new Token(intTestnetId, USDT_ADDRESS[intTestnetId], 18, 'USDT', 'USDT Token'),
      new Token(intTestnetId, BTCB_ADDRESS[intTestnetId], 18, 'BTCB', 'BTCB Token')
    ]
    [
      new Token(intTestnetId, VELO_ADDRESS[ChainId.BSCTESTNET], 18, 'VELO', 'VELO Token'),
      new Token(intTestnetId, WBNB_ADDRESS[ChainId.BSCTESTNET], 18, 'WBNB', 'Wrapped BNB')
    ],
    [
      new Token(intTestnetId, VELO_ADDRESS[ChainId.BSCTESTNET], 18, 'VELO', 'VELO Token'),
      new Token(intTestnetId, BUSD_ADDRESS[ChainId.BSCTESTNET], 18, 'BUSD', 'BUSD BNB'),
    ],
    [
      new Token(intTestnetId, VELO_ADDRESS[ChainId.BSCTESTNET], 18, 'VELO', 'VELO Token'),
      new Token(intTestnetId, FINIX_ADDRESS[ChainId.BSCTESTNET], 18, 'FINIX', 'FINIX Token'),
    ],
  ]
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 80
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH

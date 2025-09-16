export type TokenInfo = {
  symbol: string
  name: string
  address: string
  decimals: number
  logoURI?: string
}

export const tokenList: TokenInfo[] = [
  {
    symbol: 'SHAH',
    name: 'ShahCoin',
    address: '0x6E0cFA42F797E316ff147A21f7F1189cd610ede8',
    decimals: 18,
    logoURI: 'https://shah.vip/logo.png',
  },
  {
    symbol: 'RDC',
    name: 'Radcoin',
    address: '0xDffced9015F094B861741E2CdC3e1EB21B0F17e6',
    decimals: 18,
    logoURI: 'https://shah.vip/rdc.png',
  },
  {
    symbol: 'RADVERS',
    name: 'Radvers',
    address: '0x9aD1EE5125851D47863edef19A0Bce3B57F6bD9F',
    decimals: 18,
    logoURI: 'https://shah.vip/radvers.png',
  },
]

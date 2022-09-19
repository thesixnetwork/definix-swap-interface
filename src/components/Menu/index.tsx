import { useWeb3React } from '@web3-react/core'
import { bsc, injected, walletconnect } from 'connectors'
import { allLanguages } from 'constants/localisation/languageCodes'
import { LanguageContext } from 'hooks/LanguageContext'
import useGetPriceData from 'hooks/useGetPriceData'
import useTheme from 'hooks/useTheme'
import numeral from 'numeral'
import React, { useContext } from 'react'
import { ConnectorId } from 'uikit-dev'
import WrapperV2 from 'uikitV2/components/WrapperV2'
import useFinixPrice from '../../hooks/useFinixPrice'
import links from './config'

const Menu: React.FC = ({ children, ...props }) => {
  const { account, activate, deactivate } = useWeb3React()
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext)
  const { isDark, toggleTheme } = useTheme()
  const priceData = useGetPriceData()
  const finixPrice = useFinixPrice()
  const finixPriceUsd = priceData ? Number(priceData.prices.Finix) : undefined

  return (
    <WrapperV2
      links={links}
      account={account as string}
      login={(connectorId: ConnectorId) => {
        if (connectorId === 'walletconnect') {
          return activate(walletconnect)
        }

        if (connectorId === 'bsc') {
          return activate(bsc)
        }

        return activate(injected)
      }}
      logout={deactivate}
      isDark={isDark}
      toggleTheme={toggleTheme}
      currentLang={selectedLanguage?.code || 'en'}
      langs={allLanguages}
      setLang={setSelectedLanguage}
      finixPriceUsd={finixPriceUsd}
      price={finixPrice <= 0 ? 'N/A' : numeral(finixPrice).format('0,0.0000')}
      {...props}
    >
      {children}
    </WrapperV2>
  )
}

export default Menu

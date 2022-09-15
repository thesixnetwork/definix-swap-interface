import { Credentials, StringTranslations } from '@crowdin/crowdin-api-client'
import { useWeb3React } from '@web3-react/core'
import { injected } from 'connectors'
import React, { Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import Menu from '../components/Menu'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { allLanguages, EN } from '../constants/localisation/languageCodes'
import { LanguageContext } from '../hooks/LanguageContext'
import { TranslationsContext } from '../hooks/TranslationsContext'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds, RedirectOldAddLiquidityPathStructure } from './AddLiquidity/redirects'
import LiquidityList from './LiquidityList'
import Pool from './Pool'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import { RedirectOldRemoveLiquidityPathStructure } from './RemoveLiquidity/redirects'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
// import WaitingPage from 'uikit-dev/components/WaitingPage'

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<any>(undefined)
  const [translatedLanguage, setTranslatedLanguage] = useState<any>(undefined)
  const [translations, setTranslations] = useState<Array<any>>([])
  const apiKey = `${process.env.REACT_APP_CROWDIN_APIKEY}`
  const projectId = parseInt(`${process.env.REACT_APP_CROWDIN_PROJECTID}`)
  const fileId = 6

  const credentials: Credentials = {
    token: apiKey,
  }

  const stringTranslationsApi = new StringTranslations(credentials)

  const getStoredLang = (storedLangCode: string) => {
    return allLanguages.filter((language) => {
      return language.code === storedLangCode
    })[0]
  }

  useEffect(() => {
    const storedLangCode = localStorage.getItem('definixSwapLanguage')
    if (storedLangCode) {
      const storedLang = getStoredLang(storedLangCode)
      setSelectedLanguage(storedLang)
    } else {
      setSelectedLanguage(EN)
    }
  }, [])

  const fetchTranslationsForSelectedLanguage = async () => {
    stringTranslationsApi
      .listLanguageTranslations(projectId, selectedLanguage.code, undefined, fileId, 200)
      .then((translationApiResponse) => {
        if (translationApiResponse.data.length < 1) {
          setTranslations(['error'])
        } else {
          setTranslations(translationApiResponse.data)
        }
      })
      .then(() => setTranslatedLanguage(selectedLanguage))
      .catch((error) => {
        setTranslations(['error'])
        console.error(error)
      })
  }

  const { account, activate } = useWeb3React()

  useEffect(() => {
    if (!account && window.localStorage.getItem('accountStatus')) {
      activate(injected)
    }
  }, [account, activate])

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslationsForSelectedLanguage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage])

  return (
    <Suspense fallback={null}>
      <BrowserRouter>
        <LanguageContext.Provider
          value={{ selectedLanguage, setSelectedLanguage, translatedLanguage, setTranslatedLanguage }}
        >
          <TranslationsContext.Provider value={{ translations, setTranslations }}>
            <Menu>
              <Popups />
              <Web3ReactManager>
                <Switch>
                  <Route exact strict path="/swap" component={Swap} />
                  <Route exact path="/swap/:currencyIdA/:currencyIdB" component={RedirectToSwap} />
                  <Route exact path="/swap/:currencyIdA" component={RedirectToSwap} />
                  <Route exact strict path="/find" component={PoolFinder} />
                  <Route exact strict path="/liquidity" component={Pool} />
                  <Route exact path="/liquidity/add" component={AddLiquidity} />
                  <Route exact path="/liquidity/list" component={LiquidityList} />
                  <Route exact strict path="/liquidity/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />

                  {/* <Route path="/xxx">
                        <WaitingPage pageName="XXX" openDate="Tue Mar 30 2021 08:00:00 GMT+0700 (Indochina Time)" />
                      </Route> */}

                  {/* Redirection: These old routes are still used in the code base */}
                  <Route exact path="/liquidity/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                  <Route exact path="/liquidity/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                  <Route
                    exact
                    strict
                    path="/liquidity/remove/:tokens"
                    component={RedirectOldRemoveLiquidityPathStructure}
                  />

                  <Route component={RedirectPathToSwapOnly} />
                </Switch>
              </Web3ReactManager>
            </Menu>
          </TranslationsContext.Provider>
        </LanguageContext.Provider>
      </BrowserRouter>
    </Suspense>
  )
}

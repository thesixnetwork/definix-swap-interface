import React, { useState, useEffect } from 'react'
import { StringTranslations } from '@crowdin/crowdin-api-client'
import { TranslationsContext } from './translationsContext'
import { allLanguages, EN } from '../../constants/localisation/languageCodes'

const CACHE_KEY = 'pancakeSwapLanguage'

export interface LangType {
  code: string
  language: string
}

export interface LanguageState {
  selectedLanguage: LangType
  setSelectedLanguage: (langObject: LangType) => void
  translatedLanguage: LangType
  setTranslatedLanguage: React.Dispatch<React.SetStateAction<LangType>>
}

const LanguageContext = React.createContext({
  selectedLanguage: { code: '', language: '' },
  setSelectedLanguage: () => undefined,
  translatedLanguage: { code: '', language: '' },
  setTranslatedLanguage: () => undefined,
} as LanguageState)

const fileId = 8
const projectId = parseInt(process.env.REACT_APP_CROWDIN_PROJECTID!)
const stringTranslationsApi = new StringTranslations({
  token: process.env.REACT_APP_CROWDIN_APIKEY!,
})

const fetchTranslationsForSelectedLanguage = (selectedLanguage:any) => {
  return stringTranslationsApi.listLanguageTranslations(projectId, selectedLanguage.code, undefined, fileId, 200)
}

const LanguageContextProvider = ({ children }: {children: any}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<any>(undefined)
  const [translatedLanguage, setTranslatedLanguage] = useState<any>(undefined)
  const [translations, setTranslations] = useState<Array<any>>([])

  const getStoredLang = (storedLangCode: string) => {
    return allLanguages.filter((language) => {
      return language.code === storedLangCode
    })[0]
  }

  useEffect(() => {
    const storedLangCode = localStorage.getItem(CACHE_KEY)
    if (storedLangCode) {
      const storedLang = getStoredLang(storedLangCode)
      setSelectedLanguage(storedLang)
    } else {
      setSelectedLanguage(EN)
    }
  }, [])

  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslationsForSelectedLanguage(selectedLanguage)
        .then((translationApiResponse) => {
          if (translationApiResponse.data.length < 1) {
            setTranslations(['error'])
          } else {
            setTranslations(translationApiResponse.data)
          }
        })
        .then(() => setTranslatedLanguage(selectedLanguage))
        .catch(() => {
          setTranslations(['error'])
        })
    }
  }, [selectedLanguage, setTranslations])

  const handleLanguageSelect = (langObject: LangType) => {
    setSelectedLanguage(langObject)
    localStorage.setItem(CACHE_KEY, langObject.code)
  }

  return (
    <LanguageContext.Provider
      value={{ selectedLanguage, setSelectedLanguage: handleLanguageSelect, translatedLanguage, setTranslatedLanguage }}
    >
      <TranslationsContext.Provider value={{ translations, setTranslations }}>{children}</TranslationsContext.Provider>
    </LanguageContext.Provider>
  )
}

export { LanguageContext, LanguageContextProvider }
import { useEffect } from 'react'
import type { CSSProperties, Dispatch } from 'react'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import { $ai, SEARCH_COLLECTION } from '@/lib/ai/client'
import { KioskHeader } from './kiosk-header'
import { DetailScreen } from './screens/detail-screen'
import { ErrorScreen } from './screens/error-screen'
import { LoadingScreen } from './screens/loading-screen'
import { NoResultScreen } from './screens/no-result-screen'
import { ResultsScreen } from './screens/results-screen'
import { SearchScreen } from './screens/search-screen'
import { useKioskSession, type KioskAction } from './use-kiosk-session'

export function KioskApp() {
  const navigate = useNavigate()
  const [session, dispatch] = useKioskSession()
  const { stage } = session

  useRootFontSizeReset()
  useKioskBackButton(stage.name !== 'entry', dispatch)

  /*
   * Reducer trzyma intencję, React Query trzyma stan serwera. Ekrany wyników, braku
   * wyniku i błędu są POCHODNE od tego zapytania, nie dispatchowane — inaczej udany
   * refetch zostawiłby maszynę na ekranie błędu. `staleTime: Infinity` sprawia, że
   * powrót i ponowne wysłanie tego samego opisu trafia w cache.
   */
  const search = $ai.useQuery(
    'post',
    '/search',
    { body: { collection: SEARCH_COLLECTION, query: stage.name === 'entry' ? '' : stage.query } },
    { enabled: stage.name !== 'entry', staleTime: Infinity, retry: false },
  )

  return (
    <div
      className="kiosk hub-powloka relative mx-auto h-[100dvh] w-full max-w-[834px] overflow-hidden"
      style={{ '--hub-skala': session.skala } as CSSProperties}
    >
      <KioskHeader
        skala={session.skala}
        onSkala={(skala) => dispatch({ type: 'setSkala', skala })}
        onEnd={() => {
          dispatch({ type: 'end' })
          navigate({ to: '/' })
        }}
      />

      <main className="hub-panel hub-przewijanie absolute inset-x-0 top-28 bottom-0 flex flex-col px-14 pb-12">
        {renderScreen()}
      </main>
    </div>
  )

  function renderScreen() {
    if (stage.name === 'entry') {
      return (
        <SearchScreen
          key="entry"
          mode={session.mode}
          draft={session.draft}
          onMode={(mode) => dispatch({ type: 'chooseMode', mode })}
          onDraft={(text) => dispatch({ type: 'setDraft', text })}
          onSubmit={(query) => dispatch({ type: 'submit', query })}
        />
      )
    }

    // Szczegół ma własne źródło danych (/catalog/{id}), więc nie czeka na wyszukiwanie.
    if (stage.name === 'detail') {
      return <DetailScreen key={`detail-${stage.result.id}`} result={stage.result} onBack={() => dispatch({ type: 'back' })} />
    }

    if (search.isPending || search.isFetching) return <LoadingScreen key="loading" />

    if (search.isError) {
      return (
        <ErrorScreen
          key="error"
          error={search.error}
          query={stage.query}
          onRetry={() => search.refetch()}
          onBack={() => dispatch({ type: 'back' })}
        />
      )
    }

    if (search.data.noMatch) {
      return <NoResultScreen key="no-result" query={stage.query} onBack={() => dispatch({ type: 'back' })} />
    }

    return (
      <ResultsScreen
        key="results"
        data={search.data}
        query={stage.query}
        onOpen={(result) => dispatch({ type: 'openDetail', result })}
        onBack={() => dispatch({ type: 'back' })}
      />
    )
  }
}

/**
 * `applyStoredTextSize()` w main.tsx ustawia fontSize na <html> (87,5 / 100 / 125 %).
 * Nagłówki kiosku są w px, więc są bezpieczne — ale każdy utility Tailwinda tutaj
 * (p-6, gap-4, size-14) jest w rem, więc zostawione 125 % z poprzedniej wizyty
 * w wersji web rozsadziłoby kolumnę 834 px. Przywracamy przy odmontowaniu, żeby
 * powrót na `/` zachował preferencję mieszkańca.
 */
function useRootFontSizeReset() {
  useEffect(() => {
    const previous = document.documentElement.style.fontSize
    document.documentElement.style.fontSize = '100%'
    return () => {
      document.documentElement.style.fontSize = previous
    }
  }, [])
}

/**
 * Kiosk nie pcha nic do URL-a, więc sprzętowy Back wyrzuciłby mieszkańca z aplikacji
 * w środku przepływu. Zamieniamy go na „jeden ekran kiosku wstecz". Na ekranie
 * startowym nie blokujemy — tam wyjście z kiosku jest poprawne.
 *
 * Przez `useBlocker` routera, a nie własne `history.pushState`: surowe wpisy rozjeżdżają
 * wewnętrzny indeks historii TanStacka i późniejsze `navigate()` przestaje działać
 * (sprawdzone — „Zakończ" przestawał reagować).
 *
 * Zasięg: łapiemy cofanie w obrębie dokumentu, czyli wejście na kiosk z linku w SPA.
 * Jeśli `/kiosk` wczytano bezpośrednio, Back jest wyjściem z dokumentu i zatrzymałby go
 * wyłącznie natywny monit `beforeunload` — na kiosku byłby szkodliwy (wyskakiwałby też
 * przy odświeżeniu), a na iPadOS jest zawodny. Na docelowym sprzęcie przeglądarka i tak
 * chodzi w trybie kiosku, bez przycisku wstecz, więc ten przypadek nie występuje.
 */
function useKioskBackButton(midFlow: boolean, dispatch: Dispatch<KioskAction>) {
  useBlocker({
    disabled: !midFlow,
    // Kiosk nie ma niezapisanych danych w rozumieniu przeglądarki; pytanie
    // „czy na pewno opuścić stronę?" przy odświeżeniu byłoby tylko szumem.
    enableBeforeUnload: false,
    // `dispatch` z useReducer jest stabilny, więc domknięcie nie potrzebuje refa.
    shouldBlockFn: ({ action }) => {
      if (action !== 'BACK') return false
      dispatch({ type: 'back' })
      return true
    },
  })
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { getJson } from '../api.js'
import { useI18n } from '../i18n/context.js'

const EMPTY = { items: [], nextPage: null, loading: false, error: null, limitReached: false }

export function useCatalog(path, revision = 0) {
  const { locale } = useI18n()
  const [state, setState] = useState(EMPTY)
  const request = useRef(null)
  const lastRequest = useRef(null)

  const load = useCallback(async (url, page, append) => {
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    lastRequest.current = { url, page, append }
    setState(previous => ({ ...(append ? previous : EMPTY), loading: true, error: null }))
    try {
      const separator = url.includes('?') ? '&' : '?'
      const data = await getJson(`${url}${separator}page=${page}&language=${locale}`, controller.signal)
      if (controller.signal.aborted) return
      if (!Array.isArray(data.results)) throw Object.assign(new Error('Invalid response'), { code: 'INVALID_RESPONSE' })
      setState(previous => {
        const combined = append ? [...previous.items, ...data.results] : data.results
        const unique = new Map(combined.map(item => [`${item.type}-${item.id}`, item]))
        return {
          items: [...unique.values()], nextPage: data.nextPage,
          limitReached: data.limitReached, loading: false, error: null,
        }
      })
    } catch (error) {
      if (!controller.signal.aborted) {
        setState(previous => ({ ...previous, loading: false, error }))
      }
    }
  }, [locale])

  useEffect(() => {
    if (path) load(path, 1, false)
    else setState(EMPTY)
    return () => request.current?.abort()
  }, [path, revision, load])

  return {
    ...state,
    loadMore: () => {
      if (state.nextPage && !state.loading) load(path, state.nextPage, true)
    },
    retry: () => {
      if (lastRequest.current) {
        const { url, page, append } = lastRequest.current
        load(url, page, append)
      }
    },
  }
}

export function useGenres(type) {
  const { locale } = useI18n()
  const [state, setState] = useState({ genres: [], loading: true, error: null })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState({ genres: [], loading: true, error: null })
    getJson(`/api/genres?type=${type}&language=${locale}`, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setState({ genres: data.genres, loading: false, error: null })
      })
      .catch(error => {
        if (!controller.signal.aborted) setState({ genres: [], loading: false, error })
      })
    return () => controller.abort()
  }, [type, revision, locale])
  return { ...state, retry: () => setRevision(value => value + 1) }
}

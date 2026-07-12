import { saveSubmissionToFirebase } from './firebase.js'

const CONTACT_MESSAGES_KEY = 'layrd.contactMessages'
const SUBSCRIPTIONS_KEY = 'layrd.subscriptions'

const readStoredItems = (storageKey) => {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    return rawValue ? JSON.parse(rawValue) : []
  } catch (error) {
    console.warn(`Unable to read ${storageKey}:`, error)
    return []
  }
}

const writeStoredItems = (storageKey, items) => {
  if (typeof window === 'undefined') return items

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  } catch (error) {
    console.warn(`Unable to write ${storageKey}:`, error)
  }

  return items
}

const syncSubmissionStore = () => {
  if (typeof window === 'undefined') return { messages: [], subscriptions: [] }

  const snapshot = {
    messages: readStoredItems(CONTACT_MESSAGES_KEY),
    subscriptions: readStoredItems(SUBSCRIPTIONS_KEY),
  }

  window.__LAYRD_SUBMISSIONS__ = snapshot
  window.dispatchEvent(new CustomEvent('layrd:data-updated', { detail: snapshot }))

  return snapshot
}

const saveToRemoteDatabase = async (type, payload) => {
  return saveSubmissionToFirebase(type, payload)
}

export const getStoredSubmissionData = () => syncSubmissionStore()

export const storeContactMessage = async (messagePayload) => {
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: 'message',
    ...messagePayload,
  }

  const nextItems = writeStoredItems(CONTACT_MESSAGES_KEY, [...readStoredItems(CONTACT_MESSAGES_KEY), item].slice(-100))
  const remoteResult = await saveToRemoteDatabase('message', item)
  syncSubmissionStore()
  return { item, remoteResult }
}

export const storeSubscription = async (subscriptionPayload) => {
  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: 'subscription',
    ...subscriptionPayload,
  }

  const nextItems = writeStoredItems(SUBSCRIPTIONS_KEY, [...readStoredItems(SUBSCRIPTIONS_KEY), item].slice(-100))
  const remoteResult = await saveToRemoteDatabase('subscription', item)
  syncSubmissionStore()
  return { item, remoteResult }
}

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || ''

async function parseResponse(response) {
  const data = await response.json()
  if (!response.ok || data?.status === 'error') {
    throw new Error(data?.message || 'Request failed')
  }
  return data
}

export function getApiUrl() {
  return APPS_SCRIPT_URL
}

export async function fetchAppData() {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Missing VITE_APPS_SCRIPT_URL')
  }

  const response = await fetch(`${APPS_SCRIPT_URL}?action=getAppData`)
  return parseResponse(response)
}

export async function postAction(payload) {
  if (!APPS_SCRIPT_URL) {
    throw new Error('Missing VITE_APPS_SCRIPT_URL')
  }

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response)
}

/** The host SDK boundary is the only browser stub; all data uses the real backend. */
async function request(path, method = 'GET', payload) {
  const response = await fetch(path, {
    method, headers: { 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  })
  const body = await response.text()
  if (!response.ok) {
    const error = new Error(body)
    Object.assign(error, { name: 'AppApiError', status: response.status, body })
    throw error
  }
  return body ? JSON.parse(body) : null
}
const api = {
  get: path => request(path), post: (path, body) => request(path, 'POST', body),
  put: (path, body) => request(path, 'PUT', body), patch: (path, body) => request(path, 'PATCH', body),
  del: path => request(path, 'DELETE'),
}
export function useAppApi() { return api }
const navigate = path => { window.testNavigation = path }
export function useNavigate() { return navigate }

import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getHealth    = ()                   => api.get('/')
export const getNodes     = ()                   => api.get('/nodes')
export const getFiles     = ()                   => api.get('/files')
export const registerNode = (node_id, address)   =>
  api.post('/register_node', null, { params: { node_id, address } })
export const uploadFile = (formData, onUploadProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })

/** Download a file as a blob and trigger a browser save dialog. */
export const downloadFile = (filename) =>
  api.get(`/download/${encodeURIComponent(filename)}`, { responseType: 'blob' })

/** Directly ping a storage node's health endpoint to determine live status. */
export const pingNode = (address) => {
  const url = address.replace(/^https:\/\//i, 'http://')
  return axios.get(`${url}/`, { timeout: 3000 })
}

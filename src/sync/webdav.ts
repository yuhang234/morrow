import type { SyncAccount } from '../types'

function basicAuth(username: string, password: string): string {
  // 对非 ASCII 字符做安全编码后再 base64
  const raw = unescape(encodeURIComponent(`${username}:${password}`))
  return 'Basic ' + btoa(raw)
}

function joinPath(base: string, sub: string): string {
  if (!sub) return base
  const left = base.endsWith('/') ? base.slice(0, -1) : base
  const right = sub.startsWith('/') ? sub : `/${sub}`
  return left + right
}

export async function webdavTest(
  account: SyncAccount,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(account.url, {
      method: 'PROPFIND',
      headers: {
        Authorization: basicAuth(account.username, account.password),
        Depth: '0',
      },
    })
    if (res.status === 207 || res.status === 200) return { ok: true }
    if (res.status === 401 || res.status === 403)
      return { ok: false, error: '认证失败，请检查账号与应用密码' }
    return { ok: false, error: `服务器返回 ${res.status}` }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '网络错误',
    }
  }
}

export async function webdavPush(
  account: SyncAccount,
  json: string,
): Promise<{ ok: boolean; error?: string }> {
  const base = account.url
  const dirUrl = joinPath(base, account.path)
  try {
     // MKCOL 远端目录；已存在时服务器多返回 405/301，忽略这些状态
     await fetch(dirUrl, {
       method: 'MKCOL',
       headers: { Authorization: basicAuth(account.username, account.password) },
     })
     const fileUrl = joinPath(dirUrl, 'data.json')
     const put = await fetch(fileUrl, {
       method: 'PUT',
       headers: {
         Authorization: basicAuth(account.username, account.password),
         'Content-Type': 'application/json',
       },
       body: json,
     })
    if (put.status >= 200 && put.status < 300) return { ok: true }
    if (put.status === 401 || put.status === 403)
      return { ok: false, error: '认证失败，请检查账号与应用密码' }
    return { ok: false, error: `上传失败：${put.status}` }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '网络错误',
    }
  }
}

export async function webdavPull(
  account: SyncAccount,
): Promise<{
  ok: boolean
  data?: string
  error?: string
  remoteMtime?: number
}> {
  const dirUrl = joinPath(account.url, account.path)
  const fileUrl = joinPath(dirUrl, 'data.json')
  try {
    const res = await fetch(fileUrl, {
      method: 'GET',
      headers: { Authorization: basicAuth(account.username, account.password) },
    })
    if (res.status === 404) return { ok: true, data: undefined }
    if (res.status === 401 || res.status === 403)
      return { ok: false, error: '认证失败，请检查账号与应用密码' }
    if (!res.ok) return { ok: false, error: `拉取失败：${res.status}` }
    const data = await res.text()
    let remoteMtime: number | undefined
    const lastMod = res.headers.get('Last-Modified')
    if (lastMod) {
      const t = Date.parse(lastMod)
      if (!Number.isNaN(t)) remoteMtime = t
    }
    if (remoteMtime === undefined) {
      const etag = res.headers.get('ETag')
      if (etag) {
        const m = etag.match(/\d{10,}/)
        if (m) remoteMtime = Number(m[0])
      }
    }
    if (remoteMtime === undefined) remoteMtime = Date.now()
    return { ok: true, data, remoteMtime }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : '网络错误',
    }
  }
}

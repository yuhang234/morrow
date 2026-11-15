import type { SyncAccount } from '../types'

function basicAuth(username: string, password: string): string {
  // 对非 ASCII 字符做安全编码后再 base64
  const raw = unescape(encodeURIComponent(`${username}:${password}`))
  return 'Basic ' + btoa(raw)
}

function authHeaders(account: SyncAccount): Record<string, string> {
  return { Authorization: basicAuth(account.username, account.password) }
}

function joinPath(base: string, sub: string): string {
  if (!sub) return base
  const left = base.endsWith('/') ? base.slice(0, -1) : base
  const right = sub.startsWith('/') ? sub : `/${sub}`
  return left + right
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/**
 * MKCOL 目标已存在时的返回：405 Method Not Allowed（坚果云 / SabreDAV / Nextcloud）、
 * 有的服务器用 301/302 重定向到带斜杠的地址。
 */
const MKCOL_ALREADY_EXISTS = new Set([301, 302, 405])

/** PROPFIND Depth:0 判断某个资源是否真的存在 */
async function resourceExists(
  account: SyncAccount,
  url: string,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'PROPFIND',
      headers: { ...authHeaders(account), Depth: '0' },
    })
    return res.status === 207 || res.status === 200
  } catch {
    return false
  }
}

/**
 * 逐级创建远端目录。
 *
 * 不能对整条路径一次性 MKCOL：坚果云 / SabreDAV 在父目录缺失时直接返回 409，
 * 像 `/a/b` 这样的多级目录因此建不出来。这里从根开始一层层建，已存在的层级忽略。
 */
async function ensureRemoteDir(
  account: SyncAccount,
  dirPath: string,
): Promise<{ ok: boolean; error?: string }> {
  const segments = dirPath.split('/').filter(Boolean)
  let current = stripTrailingSlash(account.url)

  for (const segment of segments) {
    current = `${current}/${segment}`
    const res = await fetch(current, {
      method: 'MKCOL',
      headers: authHeaders(account),
    })
    if (res.status === 201 || res.status === 200) continue
    if (MKCOL_ALREADY_EXISTS.has(res.status)) continue
    if (res.status === 401 || res.status === 403)
      return { ok: false, error: '认证失败，请检查账号与应用密码' }
    return { ok: false, error: `创建远端目录失败：${res.status}` }
  }

  return { ok: true }
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
  const dirUrl = joinPath(account.url, account.path)
  try {
    const dirRes = await ensureRemoteDir(account, account.path)
    if (!dirRes.ok) return dirRes

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
    if (res.status === 409) {
      // 坚果云等服务器在父目录不存在时对 GET 返回 409（而不是 404）。
      // 这种情形等价于「远端还没有数据」，否则首次同步永远卡在拉取阶段。
      // 先确认文件确实不存在，避免真的冲突时被误判成空远端而覆盖云端数据。
      if (await resourceExists(account, fileUrl))
        return { ok: false, error: '拉取失败：409（远端文件状态异常）' }
      return { ok: true, data: undefined }
    }
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
/**
 * 加密工具函数
 */

/**
 * 使用SHA-256对字符串进行哈希加密
 * @param text 要加密的文本
 * @returns 加密后的哈希值
 */
export async function sha256Hash(text: string): Promise<string> {
  // 将字符串转换为ArrayBuffer
  const msgBuffer = new TextEncoder().encode(text)

  // 使用SubtleCrypto API进行SHA-256哈希
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)

  // 将ArrayBuffer转换为十六进制字符串
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * 对密码进行哈希处理
 * @param password 原始密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  return await sha256Hash(password)
}

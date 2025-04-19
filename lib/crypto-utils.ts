// Implementação melhorada de criptografia

/**
 * Gera uma chave de criptografia aleatória
 * Formato: TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX
 * Onde X são caracteres alfanuméricos
 */
export function generateRandomKey(): string {
  // Função para gerar segmentos aleatórios de caracteres alfanuméricos
  const generateSegment = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Formatar a chave no estilo TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX
  return [
    "TLPTH",
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
    generateSegment(4),
  ].join("-")
}

/**
 * Criptografa uma mensagem usando uma chave
 * Em um app real, isso usaria algoritmos de criptografia adequados como AES
 */
export async function encryptMessage(message: string, key = ""): Promise<string> {
  // Em um app real, você usaria a Web Crypto API para criptografia adequada
  // Esta é uma simulação simplificada para demonstração

  const encoder = new TextEncoder()
  const data = encoder.encode(message)

  // Usar a chave fornecida ou gerar uma nova
  const useKey = key || generateRandomKey()

  // Simular criptografia (em produção, use algoritmos reais como AES-GCM)
  // Converter a mensagem para base64 e adicionar a chave como prefixo
  const base64 = btoa(String.fromCharCode(...new Uint8Array(data)))
  return `${useKey.substring(0, 16)}:${base64}`
}

/**
 * Descriptografa uma mensagem usando uma chave
 */
export function decryptMessage(encryptedMessage: string, key = ""): string {
  try {
    // Separar a chave e o conteúdo criptografado
    const parts = encryptedMessage.split(":")
    if (parts.length !== 2) {
      throw new Error("Formato de mensagem inválido")
    }

    // Em um app real, você verificaria se a chave corresponde
    // e usaria a Web Crypto API para descriptografia

    // Decodificar o conteúdo de base64
    const base64 = parts[1]
    const binary = atob(base64)

    // Converter de binário para string
    return binary
  } catch (e) {
    console.error("Falha ao descriptografar mensagem:", e)
    return "Falha ao descriptografar mensagem"
  }
}

/**
 * Gera um hash seguro dos dados
 */
export async function generateHash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  // Usar SHA-256 para gerar um hash seguro
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer)

  // Converter para string hexadecimal
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Verifica se duas chaves correspondem
 */
export async function verifyKeys(key1: string, key2: string): Promise<boolean> {
  return (await generateHash(key1)) === (await generateHash(key2))
}

/**
 * Valida se uma chave está no formato correto
 */
export function isValidKey(key: string): boolean {
  // Verificar se a chave está no formato TLPTH-XXXX-XXXX-XXXX-XXXX-XXXX
  const keyPattern = /^TLPTH-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
  return keyPattern.test(key)
}

import sanitize from 'sanitize-filename'
import type { ConversationNodeMessage } from '../api'

/**
 * Files generated inside the Code Interpreter sandbox are linked from the
 * message text as `[Download](sandbox:/mnt/data/report.xlsx)`.
 */
export const SANDBOX_LINK_REGEX = /sandbox:\/[^\s)"'<>\]]+/g

export function extractSandboxLinks(text: string): string[] {
    return Array.from(new Set(text.match(SANDBOX_LINK_REGEX) ?? []))
}

export function getMessageTextParts(content: ConversationNodeMessage['content']): string[] {
    if (content.content_type !== 'text' && content.content_type !== 'multimodal_text') return []
    const parts: unknown[] = content.parts ?? []
    return parts.filter((part): part is string => typeof part === 'string')
}

function safeDecode(value: string) {
    try {
        return decodeURIComponent(value)
    }
    catch {
        return value
    }
}

/** `sandbox:/mnt/data/My%20Report.xlsx` → `/mnt/data/My Report.xlsx` */
export function sandboxPathFromLink(link: string) {
    return safeDecode(link.replace(/^sandbox:/, ''))
}

/** `/mnt/data/My Report.xlsx` → `My Report.xlsx` */
export function fileNameFromPath(path: string) {
    return path.split('/').pop() || path
}

/** `sandbox:/mnt/data/My%20Report.xlsx` → `My Report.xlsx` */
export function sandboxPathToFileName(link: string) {
    return fileNameFromPath(sandboxPathFromLink(link))
}

export function toSafeFileName(name: string, fallback = 'attachment') {
    return sanitize(name).trim() || fallback
}

/** Returns `name`, or `name (n)` when that name is already taken (case-insensitive) */
export function uniqueFileName(name: string, used: Set<string>) {
    const dot = name.lastIndexOf('.')
    const stem = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''

    let candidate = name
    for (let i = 1; used.has(candidate.toLowerCase()); i++) {
        candidate = `${stem} (${i})${ext}`
    }
    used.add(candidate.toLowerCase())
    return candidate
}

/** Placeholder written into image parts whose bytes were moved into the attachments folder: `attachment://image-1.png` */
export const ATTACHMENT_PLACEHOLDER_REGEX = /attachment:\/\/[^\s)"'<>\]]+/g

export function attachmentPlaceholder(name: string) {
    return `attachment://${encodeURIComponent(name)}`
}

export function attachmentNameFromPlaceholder(placeholder: string) {
    return safeDecode(placeholder.replace(/^attachment:\/\//, ''))
}

const MIME_EXTENSIONS: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/avif': 'avif',
}

export function extensionFromMimeType(mimeType: string, fallback = 'bin') {
    const type = mimeType.split(';')[0].trim().toLowerCase()
    return MIME_EXTENSIONS[type] ?? type.split('/')[1]?.replace(/[^a-z0-9]/g, '') ?? fallback
}

/** Decode a base64 `data:` url into a Blob. Returns null for anything else. */
export function dataUrlToBlob(dataUrl: string): Blob | null {
    const match = /^data:([^;,]*);base64,(.*)$/s.exec(dataUrl)
    if (!match) return null
    try {
        const binary = atob(match[2])
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        return new Blob([bytes], { type: match[1] || 'application/octet-stream' })
    }
    catch {
        return null
    }
}

/** Run `fn` over `items` with at most `limit` in flight, keeping the result order */
export async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = Array.from({ length: items.length })
    let next = 0
    const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
        while (next < items.length) {
            const index = next++
            results[index] = await fn(items[index], index)
        }
    })
    await Promise.all(workers)
    return results
}

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

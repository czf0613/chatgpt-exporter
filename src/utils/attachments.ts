import JSZip from 'jszip'
import sanitize from 'sanitize-filename'
import i18n from '../i18n'
import { downloadFile } from './download'
import type { ConversationAttachments, ConversationNodeMessage } from '../api'

/** Folder inside the zip that holds the attachments of a single exported conversation */
export const SINGLE_EXPORT_ATTACHMENT_DIR = 'attachments'

/**
 * Files generated inside the Code Interpreter sandbox are linked from the
 * message text as `[Download](sandbox:/mnt/data/report.xlsx)`.
 */
const SANDBOX_LINK_REGEX = /sandbox:\/[^\s)"'<>\]]+/g

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

/** `sandbox:/mnt/data/My%20Report.xlsx` → `My Report.xlsx` */
export function sandboxPathToFileName(link: string) {
    const path = sandboxPathFromLink(link)
    return path.split('/').pop() || path
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

/** Relative, URL-encoded path used in links: `attachments/My%20Report.xlsx` */
export function attachmentHref(dir: string, name: string) {
    return `${dir}/${name}`.split('/').map(encodeURIComponent).join('/')
}

/** Attachment folder of a conversation file inside a batch zip: `ChatGPT-Title.md` → `attachments/ChatGPT-Title` */
export function attachmentDirForFile(fileName: string) {
    return `${SINGLE_EXPORT_ATTACHMENT_DIR}/${fileName.replace(/\.[^./]+$/, '')}`
}

/** Point `sandbox:/mnt/data/...` links at the downloaded copies */
export function rewriteAttachmentLinks(input: string, attachments: ConversationAttachments | undefined, dir: string) {
    const hrefs = new Map<string, string>()
    for (const item of attachments?.items ?? []) {
        if (item.source === 'sandbox') hrefs.set(item.key, attachmentHref(dir, item.name))
    }
    if (hrefs.size === 0) return input

    return input.replace(SANDBOX_LINK_REGEX, link => hrefs.get(link) ?? link)
}

/** Uploaded files that belong to a message, used to render an attachment list under it */
export function getMessageAttachments(attachments: ConversationAttachments | undefined, messageId: string) {
    return {
        items: attachments?.items.filter(item => item.source === 'upload' && item.messageId === messageId) ?? [],
        failed: attachments?.failed.filter(item => item.source === 'upload' && item.messageId === messageId) ?? [],
    }
}

export function addAttachmentsToZip(zip: JSZip, dir: string, attachments: ConversationAttachments | undefined) {
    for (const item of attachments?.items ?? []) {
        // Most attachments are already compressed (xlsx, docx, pdf, png, ...),
        // deflating them again is slow and gains nothing.
        zip.file(`${dir}/${item.name}`, item.blob, { compression: 'STORE' })
    }
}

/**
 * Download a single exported file. When the conversation has attachments,
 * the file is bundled together with them into a zip instead.
 */
export async function downloadFileWithAttachments(fileName: string, type: string, content: string, attachments: ConversationAttachments | undefined) {
    if (!attachments?.items.length) {
        downloadFile(fileName, type, content)
        return
    }

    const zip = new JSZip()
    zip.file(fileName, content)
    addAttachmentsToZip(zip, SINGLE_EXPORT_ATTACHMENT_DIR, attachments)

    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9,
        },
    })
    const zipName = `${fileName.replace(/\.[^./]+$/, '')}.zip`
    downloadFile(zipName, 'application/zip', blob)
}

export function reportFailedAttachments(attachments: ConversationAttachments | undefined) {
    const count = attachments?.failed.length ?? 0
    if (count === 0) return

    alert(i18n.t('Attachments Download Failed', { count }))
}

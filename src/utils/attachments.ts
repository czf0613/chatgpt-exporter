import JSZip from 'jszip'
import i18n from '../i18n'
import type { ConversationAttachments, ConversationNodeMessage } from '../api'
import { ATTACHMENT_PLACEHOLDER_REGEX, SANDBOX_LINK_REGEX, attachmentNameFromPlaceholder, sandboxPathFromLink } from './attachmentPaths'
import { downloadFile } from './download'

export * from './attachmentPaths'

/** Folder inside the zip that holds the attachments of a single exported conversation */
export const SINGLE_EXPORT_ATTACHMENT_DIR = 'attachments'

/** Relative, URL-encoded path used in links: `attachments/My%20Report.xlsx` */
export function attachmentHref(dir: string, name: string) {
    return `${dir}/${name}`.split('/').map(encodeURIComponent).join('/')
}

/** Attachment folder of a conversation file inside a batch zip: `ChatGPT-Title.md` → `attachments/ChatGPT-Title` */
export function attachmentDirForFile(fileName: string) {
    return `${SINGLE_EXPORT_ATTACHMENT_DIR}/${fileName.replace(/\.[^./]+$/, '')}`
}

/**
 * Point `sandbox:/mnt/data/...` links at the downloaded copies. Links are
 * matched by decoded path, so `My%20Report.xlsx` and `My Report.xlsx` are the same file.
 */
export function rewriteAttachmentLinks(input: string, attachments: ConversationAttachments | undefined, dir: string) {
    const hrefs = new Map<string, string>()
    const placeholders = new Map<string, string>()
    for (const item of attachments?.items ?? []) {
        if (item.sandboxPath) hrefs.set(item.sandboxPath, attachmentHref(dir, item.name))
        if (item.source === 'image') placeholders.set(item.name, attachmentHref(dir, item.name))
    }
    if (hrefs.size === 0 && placeholders.size === 0) return input

    return input
        .replace(SANDBOX_LINK_REGEX, link => hrefs.get(sandboxPathFromLink(link)) ?? link)
        .replace(ATTACHMENT_PLACEHOLDER_REGEX, placeholder => placeholders.get(attachmentNameFromPlaceholder(placeholder)) ?? placeholder)
}

export interface MessageAttachmentEntry {
    /** Display name: the original file name */
    name: string
    /** Relative link to the downloaded copy, absent when the file was not downloaded */
    href?: string
    /** True when a download was attempted and failed */
    unavailable?: boolean
}

/**
 * Files to list under a message: the files the user uploaded with it (their
 * content lives in hidden tool messages) and generated files that ChatGPT
 * recorded in the metadata without linking them from the answer. Files that
 * the answer links are left out, their links get rewritten instead.
 */
export function getMessageAttachmentEntries(message: ConversationNodeMessage, attachments: ConversationAttachments | undefined, dir: string): MessageAttachmentEntry[] {
    const entries: MessageAttachmentEntry[] = []
    const items = attachments?.items.filter(item => item.messageId === message.id) ?? []
    const failed = attachments?.failed.filter(item => item.messageId === message.id) ?? []

    for (const upload of message.metadata?.attachments ?? []) {
        if (!upload?.name || upload.mime_type?.startsWith('image/')) continue
        const item = items.find(item => item.source === 'upload' && item.key === upload.id)
        if (item) {
            entries.push({ name: upload.name, href: attachmentHref(dir, item.name) })
            continue
        }
        const unavailable = failed.some(item => item.source === 'upload' && item.key === upload.id)
        entries.push({ name: upload.name, unavailable })
    }

    for (const item of items) {
        if (item.source === 'sandbox' && !item.linked) entries.push({ name: item.name, href: attachmentHref(dir, item.name) })
    }
    for (const item of failed) {
        if (item.source === 'sandbox' && !item.linked) entries.push({ name: item.name, unavailable: true })
    }

    return entries
}

export function addAttachmentsToZip(zip: JSZip, dir: string, attachments: ConversationAttachments | undefined) {
    for (const item of attachments?.items ?? []) {
        // Most attachments are already compressed (xlsx, docx, pdf, png, ...),
        // deflating them again is slow and gains nothing.
        zip.file(`${dir}/${item.name}`, item.blob.arrayBuffer(), { compression: 'STORE' })
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

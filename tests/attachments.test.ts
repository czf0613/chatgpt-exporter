import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'
import type { ApiConversationWithId } from '../src/api'

const downloadFile = vi.hoisted(() => vi.fn())

// The userscript client touches `document` and constants read `location` at import time.
vi.mock('vite-plugin-monkey/dist/client', () => ({ unsafeWindow: {} }))
vi.stubGlobal('location', { href: 'https://chatgpt.com/c/conv1' })
vi.stubGlobal('document', { documentElement: { lang: 'en' }, cookie: '' })

vi.mock('../src/i18n', () => ({ default: { t: (key: string) => key } }))
vi.mock('../src/page', () => ({
    getUserAvatar: async () => '',
    getChatIdFromUrl: () => 'conv1',
    isSharePage: () => false,
    isTemporaryChat: () => false,
    getConversationFromSharePage: () => null,
}))
vi.mock('../src/temporaryChat', () => ({ getTemporaryChatId: () => null, checkIfTemporaryChatIsExportable: () => true }))
vi.mock('../src/utils/storage', () => ({ ScriptStorage: { get: () => null, set: () => {} } }))
vi.mock('../src/utils/imageCache', () => ({ getCachedImage: async () => null, setCachedImage: async () => {} }))
vi.mock('../src/utils/utils', async importOriginal => ({
    ...await importOriginal<typeof import('../src/utils/utils')>(),
    getColorScheme: () => 'light',
    sleep: async () => {},
}))
vi.mock('../src/utils/download', async importOriginal => ({
    ...await importOriginal<typeof import('../src/utils/download')>(),
    downloadFile,
}))

const { loadConversationAttachments, processConversation } = await import('../src/api')
const { exportAllToHtml } = await import('../src/exporter/html')
const { exportAllToMarkdown } = await import('../src/exporter/markdown')

const API = 'https://chatgpt.com/backend-api'

function testConversation(): ApiConversationWithId {
    return {
        id: 'conv1',
        title: 'Files',
        create_time: 1,
        update_time: 2,
        current_node: 'a2',
        moderation_results: [],
        is_archived: false,
        gizmo_id: 'g-p-proj123',
        mapping: {
            root: { id: 'root', message: null, parent: null, children: ['u1'] },
            u1: { id: 'u1', parent: 'root', children: ['a1'], message: { id: 'u1', author: { role: 'user' }, recipient: 'all', create_time: 1, content: { content_type: 'text', parts: ['Please analyze'] }, metadata: { attachments: [{ id: 'file-UUU', name: 'input.pdf', mime_type: 'application/pdf', size: 10 }, { id: 'file-IMG', name: 'pic.png', mime_type: 'image/png' }] } } },
            a1: { id: 'a1', parent: 'u1', children: ['a2'], message: { id: 'a1', author: { role: 'assistant' }, recipient: 'all', create_time: 2, content: { content_type: 'text', parts: ['Here: [Download](sandbox:/mnt/data/My%20Report.xlsx) and ![chart](sandbox:/mnt/data/chart.png)'] }, metadata: { code_interpreter_file_links: { '/mnt/data/My Report.xlsx': 'file-AAA', '/mnt/data/extra.csv': 'file-BBB' } } } },
            a2: { id: 'a2', parent: 'a1', children: [], message: { id: 'a2', author: { role: 'assistant' }, recipient: 'all', create_time: 3, content: { content_type: 'text', parts: ['Old file: [x](sandbox:/mnt/data/expired.txt)'] }, metadata: {} } },
        },
    } as unknown as ApiConversationWithId
}

interface RecordedRequest { url: string, headers: Record<string, string> }

function mockFetch() {
    const requests: RecordedRequest[] = []
    const interpreterCalls = new Map<string, number>()
    const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    const success = (name: string) => ({ status: 'success', download_url: `https://dl.example/${encodeURIComponent(name)}`, metadata: { file_id: 'x' }, file_name: name, file_size_bytes: 1, mimedata: null, mime_type: null, creation_time: null })

    vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit = {}) => {
        const url = new URL(String(input))
        requests.push({ url: url.href, headers: (init.headers ?? {}) as Record<string, string> })
        if (url.pathname === '/api/auth/session') return json({ accessToken: 'tok' })
        if (url.pathname.startsWith('/backend-api/accounts/check')) return json({ accounts: {} })
        if (url.pathname === '/backend-api/files/download/file-AAA') return json(success('My Report.xlsx'))
        if (url.pathname === '/backend-api/files/download/file-BBB') return json({ status: 'error', error_code: 'file_expired', error_message: null }, 404)
        if (url.pathname === '/backend-api/files/download/file-UUU') return json(success('input.pdf'))
        if (url.pathname === '/backend-api/conversation/conv1/interpreter/download') {
            const path = url.searchParams.get('sandbox_path') ?? ''
            const count = (interpreterCalls.get(path) ?? 0) + 1
            interpreterCalls.set(path, count)
            if (path === '/mnt/data/extra.csv') return count === 1 ? json({ status: 'retry' }) : json(success('extra.csv'))
            if (path === '/mnt/data/chart.png') return json(success('chart.png'))
            if (path === '/mnt/data/expired.txt') return json({ status: 'error', error_code: 'file_not_found', error_message: 'File not found' })
        }
        if (url.pathname.startsWith('/backend-api/share/share1/file_from_message/')) {
            const path = url.searchParams.get('file_path') ?? ''
            return json(success(`share:${path.split('/').pop()}`))
        }
        if (url.hostname === 'dl.example') return new Response(`content of ${decodeURIComponent(url.pathname.slice(1))}`, { status: 200 })
        throw new Error(`unexpected fetch ${url.href}`)
    })

    return { requests, interpreterCalls }
}

async function zippedFiles(exportAll: typeof exportAllToHtml, conv: ApiConversationWithId) {
    downloadFile.mockClear()
    await exportAll('{title}', [conv])
    const [, , blob] = downloadFile.mock.calls[0]
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const files: Record<string, string> = {}
    for (const [name, file] of Object.entries(zip.files)) {
        if (!file.dir) files[name] = await file.async('string')
    }
    return files
}

describe('conversation attachments', () => {
    it('downloads generated and uploaded files the way ChatGPT resolves them', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const { requests, interpreterCalls } = mockFetch()
        const conversation = testConversation()

        const attachments = await loadConversationAttachments(conversation)

        expect(attachments.items.map(item => `${item.name}|${item.source}|${item.linked}|${item.messageId}`).sort()).toEqual([
            'My Report.xlsx|sandbox|true|a1',
            'chart.png|sandbox|true|a1',
            'extra.csv|sandbox|false|a1',
            'input.pdf|upload|false|u1',
        ].sort())
        expect(attachments.failed.map(item => `${item.name}|${item.reason}`)).toEqual(['expired.txt|File not found'])
        expect(await attachments.items.find(item => item.name === 'My Report.xlsx')?.blob.text()).toBe('content of My Report.xlsx')

        // The persisted copy is preferred, the sandbox endpoint is the fallback and honours `retry`
        expect(interpreterCalls.get('/mnt/data/My Report.xlsx')).toBeUndefined()
        expect(interpreterCalls.get('/mnt/data/extra.csv')).toBe(2)
        const sandboxRequests = requests.filter(request => request.url.includes('/interpreter/download'))
        expect(sandboxRequests.length).toBeGreaterThan(0)
        for (const request of sandboxRequests) {
            expect(request.headers['chatgpt-project-id']).toBe('g-p-proj123')
            expect(request.headers.Authorization).toBe('Bearer tok')
        }
        expect(sandboxRequests.map(request => request.url)).toContain(`${API}/conversation/conv1/interpreter/download?message_id=a1&sandbox_path=%2Fmnt%2Fdata%2Fextra.csv`)

        // `processConversation` picks the attachments up for the exporters
        expect(processConversation(conversation).attachments).toBe(attachments)
    })

    it('links downloaded copies from markdown and html exports', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockFetch()
        const conversation = testConversation()
        await loadConversationAttachments(conversation)

        const markdownFiles = await zippedFiles(exportAllToMarkdown, conversation)
        expect(Object.keys(markdownFiles).sort()).toEqual([
            'Files.md',
            'attachments/Files/My Report.xlsx',
            'attachments/Files/chart.png',
            'attachments/Files/extra.csv',
            'attachments/Files/input.pdf',
        ].sort())
        const markdown = markdownFiles['Files.md']
        expect(markdown).toContain('[Download](attachments/Files/My%20Report.xlsx)')
        expect(markdown).toContain('![chart](attachments/Files/chart.png)')
        expect(markdown).toContain('- 📎 [input.pdf](attachments/Files/input.pdf)')
        expect(markdown).toContain('- 📎 [extra.csv](attachments/Files/extra.csv)')
        // A failed download keeps its original link and is not listed twice
        expect(markdown).toContain('[x](sandbox:/mnt/data/expired.txt)')
        expect(markdown).not.toContain('📎 expired.txt')

        const htmlFiles = await zippedFiles(exportAllToHtml, conversation)
        const html = htmlFiles['Files.html']
        expect(html).toContain('href="attachments/Files/My%20Report.xlsx"')
        expect(html).toContain('<li>📎 <a href="attachments/Files/input.pdf" download>input.pdf</a></li>')
        expect(html).toContain('<li>📎 <a href="attachments/Files/extra.csv" download>extra.csv</a></li>')
    })

    it('resolves files through the share endpoint without a session on share pages', async () => {
        const { requests } = mockFetch()
        vi.stubGlobal('fetch', ((original: typeof fetch) => async (input: string | URL, init?: RequestInit) => {
            if (new URL(String(input)).pathname === '/api/auth/session') return new Response('nope', { status: 403, statusText: 'Forbidden' })
            return original(input, init)
        })(fetch))
        // The session lookup is memoized per module instance, so start from a fresh one
        vi.resetModules()
        const { fetchConversationAttachments: fetchFresh } = await import('../src/api')
        const conversation = { ...testConversation(), id: 'share1' }

        const attachments = await fetchFresh(conversation, { conversationId: 'share1', shareId: 'share1' })

        expect(attachments.failed).toEqual([])
        expect(attachments.items.map(item => item.name).sort()).toEqual(['My Report.xlsx', 'chart.png', 'expired.txt', 'extra.csv'].sort())
        expect(attachments.items.every(item => item.source === 'sandbox')).toBe(true)
        const shareRequests = requests.filter(request => request.url.includes('/share/share1/file_from_message/'))
        expect(shareRequests).toHaveLength(4)
        expect(shareRequests.every(request => !request.headers.Authorization)).toBe(true)
        expect(shareRequests.map(request => request.url)).toContain(`${API}/share/share1/file_from_message/a1?file_path=%2Fmnt%2Fdata%2FMy+Report.xlsx`)
        expect(requests.some(request => request.url.includes('/files/download/'))).toBe(false)
    })
})

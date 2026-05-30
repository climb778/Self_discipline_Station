/**
 * 简易 Markdown 转 HTML
 * 支持：h1-h3、加粗、引用、无序列表、代码块、分割线、图片、行内代码、链接、[[双向链接]]、附件链接
 */
export function markdownToHtml(md) {
  if (!md) return ''

  let html = md

  // 1. 先提取代码块和行内代码，避免被后续转义破坏
  const codeBlocks = []
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  const inlineCodes = []
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code)
    return `__INLINE_CODE_${inlineCodes.length - 1}__`
  })

  // 2. 提取双向链接 [[标题]]，避免被 HTML 转义破坏
  const wikilinks = []
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
    wikilinks.push(title)
    return `__WIKILINK_${wikilinks.length - 1}__`
  })

  // 3. 提取非图片的附件链接 [text](url)，避免被 HTML 转义破坏
  const ATTACHMENT_RE = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|json|md|zip|rar|7z|tar\.gz|mp3|mp4|wav)(\?[^)]*)?$/i
  const attachments = []
  html = html.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (full, text, href) => {
    if (ATTACHMENT_RE.test(href)) {
      attachments.push({ text, href })
      return `__ATTACHMENT_${attachments.length - 1}__`
    }
    return full
  })

  // 4. 转义 HTML 特殊字符（防止 XSS）
  html = html.replace(/&/g, '&amp;')
  html = html.replace(/</g, '&lt;')
  html = html.replace(/>/g, '&gt;')
  html = html.replace(/"/g, '&quot;')

  // 5. 图片（允许 http/https 和相对路径 / 开头的 URL）
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    if (!/^(https?:\/\/|\/)/i.test(src)) return ''
    return `<img src="${src}" alt="${alt}" style="max-width:100%;border-radius:8px;"/>`
  })

  // 6. 普通链接（允许 http/https 和相对路径 / 开头的 URL）
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    if (!/^(https?:\/\/|\/)/i.test(href)) return text
    return `<a href="${href}" style="color:#0b4aa2;text-decoration:underline;">${text}</a>`
  })

  // 7. 标题
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:30rpx;font-weight:700;margin:24rpx 0 12rpx;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:34rpx;font-weight:700;margin:28rpx 0 14rpx;">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:40rpx;font-weight:700;margin:32rpx 0 16rpx;">$1</h1>')

  // 8. 分割线
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #edf2f8;margin:24rpx 0;"/>')

  // 9. 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 10. 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:6rpx solid #0b4aa2;padding:12rpx 20rpx;margin:16rpx 0;color:#66758c;background:#eaf3ff;border-radius:0 12rpx 12rpx 0;">$1</blockquote>')

  // 11. 无序列表
  html = html.replace(/^- (.+)$/gm, '<div style="padding-left:24rpx;margin:8rpx 0;"><span style="color:#0b4aa2;margin-right:12rpx;">&bull;</span>$1</div>')

  // 12. 还原代码块（已转义）
  codeBlocks.forEach((code, i) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()
    html = html.replace(`__CODE_BLOCK_${i}__`,
      `<pre style="background:#1e293b;color:#e2e8f0;padding:20rpx;border-radius:12rpx;overflow-x:auto;font-size:24rpx;line-height:1.6;margin:16rpx 0;white-space:pre-wrap;word-break:break-all;">${escaped}</pre>`)
  })

  // 13. 还原行内代码（已转义）
  inlineCodes.forEach((code, i) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(`__INLINE_CODE_${i}__`,
      `<code style="background:#f1f5f9;color:#e11d48;padding:4rpx 12rpx;border-radius:6rpx;font-size:24rpx;">${escaped}</code>`)
  })

  // 14. 还原双向链接
  wikilinks.forEach((title, i) => {
    const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    html = html.replace(`__WIKILINK_${i}__`,
      `<span class="wikilink" data-title="${escapedTitle}" style="color:#0b4aa2;background:#eaf3ff;padding:2rpx 10rpx;border-radius:6rpx;cursor:pointer;text-decoration:underline;">${escapedTitle}</span>`)
  })

  // 15. 还原附件链接
  attachments.forEach((att, i) => {
    const escapedHref = att.href.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const escapedText = att.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(`__ATTACHMENT_${i}__`,
      `<span class="attachment-link" data-url="${escapedHref}" style="color:#0b4aa2;background:#f0fdf4;padding:2rpx 10rpx;border-radius:6rpx;cursor:pointer;text-decoration:underline;">📎 ${escapedText}</span>`)
  })

  // 16. 换行
  html = html.replace(/\n/g, '<br/>')

  return html
}

function protectCode(text) {
  const codeBlocks = []
  let protectedText = text.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code)
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`
  })

  const inlineCodes = []
  protectedText = protectedText.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(code)
    return `__INLINE_CODE_${inlineCodes.length - 1}__`
  })

  function restore(value) {
    let restored = value
    codeBlocks.forEach((code, i) => {
      restored = restored.replace(`__CODE_BLOCK_${i}__`, `\`\`\`${code}\`\`\``)
    })
    inlineCodes.forEach((code, i) => {
      restored = restored.replace(`__INLINE_CODE_${i}__`, `\`${code}\``)
    })
    return restored
  }

  return { protectedText, restore }
}

const ATTACHMENT_URL_RE = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|json|md|zip|rar|7z|tar\.gz|mp3|mp4|wav)(\?[^)]*)?$/i

/**
 * 判断 URL 是否为附件链接（非图片）
 */
function isAttachmentUrl(url) {
  return ATTACHMENT_URL_RE.test(url)
}

/**
 * 将 Markdown 拆成 HTML 片段、可点击双向链接和可点击附件链接。
 * 双链和附件链接不依赖 rich-text 内部 <a> 点击事件。
 */
export function markdownToParts(md) {
  if (!md) return []

  const { protectedText, restore } = protectCode(md)
  const parts = []
  // 匹配 [[wikilink]] 或 [text](attachment-url)
  const regex = /\[\[([^\]\n]+)\]\]|(?<!!)\[([^\]\n]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(protectedText)) !== null) {
    const before = protectedText.slice(lastIndex, match.index)
    if (before) {
      parts.push({ type: 'html', html: markdownToHtml(restore(before)) })
    }

    if (match[1] != null) {
      // [[wikilink]]
      const title = match[1].trim()
      if (title) {
        parts.push({ type: 'wikilink', title })
      }
    } else if (match[2] != null && match[3] != null) {
      // [text](url) — 仅提取附件链接，普通链接留在 HTML 中
      const text = match[2].trim()
      const url = match[3].trim()
      if (text && url && isAttachmentUrl(url)) {
        parts.push({ type: 'attachment', text, url })
      } else {
        // 非附件链接，回退为普通文本让 markdownToHtml 处理
        parts.push({ type: 'html', html: markdownToHtml(restore(match[0])) })
      }
    }

    lastIndex = regex.lastIndex
  }

  const rest = protectedText.slice(lastIndex)
  if (rest) {
    parts.push({ type: 'html', html: markdownToHtml(restore(rest)) })
  }

  return parts.filter(part => part.type === 'wikilink' || part.type === 'attachment' || part.html)
}

/**
 * 提取文本中所有 [[标题]] 的标题列表
 */
export function extractWikilinkTitles(text) {
  if (!text) return []
  const { protectedText } = protectCode(text)
  const titles = []
  const regex = /\[\[([^\]\n]+)\]\]/g
  let match
  while ((match = regex.exec(protectedText)) !== null) {
    const title = match[1].trim()
    if (title && !titles.includes(title)) {
      titles.push(title)
    }
  }
  return titles
}

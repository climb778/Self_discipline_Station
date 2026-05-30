import { getNoteList, getFolderList, createNote, createFolder } from '../api/notes'

/**
 * 笔记文件导入导出工具
 * 优先支持 H5，非 H5 环境给出提示
 */

/* ========== 文件名工具 ========== */

const ILLEGAL_FILENAME_RE = /[\\/:*?"<>|]/g

function sanitizeFilename(name) {
  return (name || '未命名笔记').replace(ILLEGAL_FILENAME_RE, '').trim() || '未命名笔记'
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getFileExt(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

/* ========== Markdown 标题提取 ========== */

/**
 * 从 Markdown 内容前几行中提取一级标题 # xxx
 * @returns {string} 提取到的标题，或空字符串
 */
function extractH1FromMarkdown(content) {
  if (!content) return ''
  const lines = content.split('\n')
  const checkCount = Math.min(lines.length, 10)
  for (let i = 0; i < checkCount; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const m = line.match(/^#\s+(.+)$/)
    if (m) return m[1].trim()
    // 遇到非空、非标题行就停止（标题通常在最前面）
    if (!line.startsWith('#') && line.length > 0) break
  }
  return ''
}

/* ========== H5 文件下载 ========== */

function downloadTextFileH5(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ========== H5 文件读取 ========== */

/**
 * 打开文件选择器并读取文本内容
 * @param {string} accept - 文件类型过滤，如 '.md,.txt'
 * @returns {Promise<{name: string, content: string}>}
 * 取消选择时 reject，错误信息为 'CANCELLED'
 */
function readTextFileFromInputH5(accept) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept || '.md,.txt'
    input.style.display = 'none'
    document.body.appendChild(input)

    let settled = false

    const cleanup = () => {
      input.onchange = null
      try { document.body.removeChild(input) } catch (e) { /* ignore */ }
    }

    const settle = (fn, value) => {
      if (settled) return
      settled = true
      cleanup()
      fn(value)
    }

    input.onchange = () => {
      const file = input.files && input.files[0]
      if (!file) {
        settle(reject, new Error('CANCELLED'))
        return
      }
      const reader = new FileReader()
      reader.onload = () => settle(resolve, { name: file.name, content: reader.result })
      reader.onerror = () => settle(reject, new Error('文件读取失败'))
      reader.readAsText(file, 'utf-8')
    }

    // 用户关闭对话框而未选择文件时，focus 会回到窗口
    window.addEventListener('focus', function onfocus() {
      window.removeEventListener('focus', onfocus)
      // 延迟一小段时间，让 onchange 先触发（如果有的话）
      setTimeout(() => {
        if (!settled && (!input.files || !input.files.length)) {
          settle(reject, new Error('CANCELLED'))
        }
      }, 200)
    }, { once: true })

    input.click()
  })
}

/* ========== 单篇笔记导出 Markdown ========== */

/**
 * 将笔记导出为 .md 文件下载
 * @param {object} note - { title, content }
 */
export function exportNoteAsMarkdown(note) {
  // #ifdef H5
  const filename = sanitizeFilename(note.title) + '.md'
  downloadTextFileH5(filename, note.content || '', 'text/markdown;charset=utf-8')
  uni.showToast({ title: '导出成功', icon: 'success' })
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂不支持文件导出，请在 H5 中使用', icon: 'none', duration: 2500 })
  // #endif
}

/* ========== 导入 Markdown 文件 ========== */

/**
 * 选择并读取 .md 文件，创建为笔记
 * @returns {Promise<object|null>} 创建成功返回笔记对象，取消返回 null
 */
export async function importMarkdownFile() {
  // #ifdef H5
  let fileInfo
  try {
    fileInfo = await readTextFileFromInputH5('.md,.txt')
  } catch (e) {
    // 用户取消选择，静默返回
    if (e.message === 'CANCELLED') return null
    uni.showToast({ title: e.message || '文件读取失败', icon: 'none' })
    return null
  }

  // 真实后缀校验
  const ext = getFileExt(fileInfo.name)
  if (ext !== '.md' && ext !== '.txt') {
    uni.showToast({ title: '请选择 .md 或 .txt 文件', icon: 'none' })
    return null
  }

  // 标题提取：优先从内容中取 # 一级标题，其次用文件名
  const content = fileInfo.content || ''
  const h1Title = extractH1FromMarkdown(content)
  const rawName = fileInfo.name || ''
  const dotIdx = rawName.lastIndexOf('.')
  const fileNameTitle = dotIdx > 0 ? rawName.slice(0, dotIdx).trim() : rawName.trim()
  const title = h1Title || fileNameTitle || '未命名导入笔记'

  // 检查同名笔记
  try {
    const res = await getNoteList({ keyword: title })
    const notes = res.data || []
    const duplicate = notes.find(n => n.title === title)
    if (duplicate) {
      const confirmed = await new Promise(resolve => {
        uni.showModal({
          title: '同名笔记已存在',
          content: `已存在同名笔记「${title}」，是否仍然导入？`,
          success: res => resolve(res.confirm)
        })
      })
      if (!confirmed) return null
    }
  } catch (e) {
    // 查询失败不阻塞导入
  }

  // 创建笔记
  try {
    const createRes = await createNote({
      title,
      content,
      tags: '导入',
      folderId: null
    })
    const newNote = createRes.data
    uni.showToast({ title: '导入成功', icon: 'success' })
    return newNote
  } catch (e) {
    uni.showToast({ title: '导入失败，请重试', icon: 'none' })
    return null
  }
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂不支持文件导入，请在 H5 中使用', icon: 'none', duration: 2500 })
  return null
  // #endif
}

/* ========== 导出知识库备份 JSON ========== */

/**
 * 导出全部笔记和文件夹为 JSON 备份文件
 */
export async function exportAllNotesAsJson() {
  // #ifdef H5
  try {
    const [notesRes, foldersRes] = await Promise.all([
      getNoteList(),
      getFolderList()
    ])

    const notes = (notesRes.data || []).map(n => ({
      title: n.title,
      content: n.content,
      folderId: n.folderId || null,
      tags: n.tags || '',
      isPinned: !!n.isPinned,
      summary: n.summary || '',
      createTime: n.createTime,
      updateTime: n.updateTime
    }))

    const folders = (foldersRes.data || []).map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId || 0,
      sortOrder: f.sortOrder || 0,
      createTime: f.createTime,
      updateTime: f.updateTime
    }))

    const backup = {
      app: 'Self_discipline_Station',
      type: 'cloud-notes-backup',
      version: 1,
      exportTime: formatDate(new Date()) + ' ' + new Date().toTimeString().slice(0, 8),
      notes,
      folders
    }

    const json = JSON.stringify(backup, null, 2)
    const filename = `self-discipline-notes-backup-${formatDate(new Date())}.json`
    downloadTextFileH5(filename, json, 'application/json;charset=utf-8')
    uni.showToast({ title: '备份导出成功', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: '备份导出失败', icon: 'none' })
  }
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂不支持文件导出，请在 H5 中使用', icon: 'none', duration: 2500 })
  // #endif
}

/* ========== 从 JSON 备份恢复 ========== */

/**
 * 选择 JSON 备份文件并恢复笔记和文件夹
 * @returns {Promise<{folderSuccess: number, noteSuccess: number, noteFail: number}|null>}
 */
export async function restoreFromJsonBackup() {
  // #ifdef H5
  let fileInfo
  try {
    fileInfo = await readTextFileFromInputH5('.json')
  } catch (e) {
    // 用户取消选择，静默返回
    if (e.message === 'CANCELLED') return null
    uni.showToast({ title: e.message || '文件读取失败', icon: 'none' })
    return null
  }

  // 真实后缀校验
  const ext = getFileExt(fileInfo.name)
  if (ext !== '.json') {
    uni.showToast({ title: '请选择 .json 备份文件', icon: 'none' })
    return null
  }

  // 解析 JSON
  let backup
  try {
    backup = JSON.parse(fileInfo.content)
  } catch (e) {
    uni.showToast({ title: 'JSON 格式错误，请检查文件', icon: 'none' })
    return null
  }

  // 校验备份格式
  if (!backup || backup.type !== 'cloud-notes-backup' || !Array.isArray(backup.notes)) {
    uni.showToast({ title: '不是有效的知识库备份文件', icon: 'none' })
    return null
  }

  // 确认恢复
  const noteCount = backup.notes.length
  const folderCount = Array.isArray(backup.folders) ? backup.folders.length : 0
  const desc = folderCount > 0
    ? `将导入 ${folderCount} 个文件夹和 ${noteCount} 条笔记，可能产生重复，是否继续？`
    : `将导入 ${noteCount} 条笔记，可能产生重复，是否继续？`
  const confirmed = await new Promise(resolve => {
    uni.showModal({
      title: '恢复备份',
      content: desc,
      success: res => resolve(res.confirm)
    })
  })
  if (!confirmed) return null

  // 1. 恢复文件夹，建立 oldId -> newId 映射
  //    同名文件夹复用已有 id，不重复创建
  let folderSuccess = 0
  const folderIdMap = {} // oldFolderId -> newFolderId

  if (folderCount > 0) {
    let existingFolders = []
    try {
      const flRes = await getFolderList()
      existingFolders = flRes.data || []
    } catch (e) {
      // 查询失败不阻塞，按全部新建处理
    }
    const existingNameMap = {}
    existingFolders.forEach(ef => { existingNameMap[ef.name] = ef.id })

    for (const f of backup.folders) {
      const folderName = f.name || '未命名文件夹'
      try {
        // 同名文件夹已存在，直接复用
        if (existingNameMap[folderName] != null) {
          if (f.id != null) folderIdMap[f.id] = existingNameMap[folderName]
          folderSuccess++
          continue
        }
        const res = await createFolder({ name: folderName })
        const newFolder = res.data
        const newId = newFolder && (newFolder.id ?? newFolder.data?.id)
        if (newId != null && f.id != null) {
          folderIdMap[f.id] = newId
        }
        folderSuccess++
      } catch (e) {
        // 单个文件夹失败不中断
      }
    }
  }

  // 2. 恢复笔记，映射 folderId
  let noteSuccess = 0
  let noteFail = 0

  for (const n of backup.notes) {
    try {
      // 旧 folderId 在映射表中则使用新 id，否则置空
      let folderId = null
      if (n.folderId != null && folderIdMap[n.folderId] != null) {
        folderId = folderIdMap[n.folderId]
      }
      await createNote({
        title: n.title || '未命名笔记',
        content: n.content || '',
        tags: n.tags || '',
        isPinned: !!n.isPinned,
        folderId
      })
      noteSuccess++
    } catch (e) {
      noteFail++
    }
  }

  return { folderSuccess, noteSuccess, noteFail }
  // #endif

  // #ifndef H5
  uni.showToast({ title: '当前端暂不支持文件导入，请在 H5 中使用', icon: 'none', duration: 2500 })
  return null
  // #endif
}

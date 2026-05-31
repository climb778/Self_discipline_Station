import { getNoteList, getFolderList, createNote, createFolder } from '../api/notes'

/**
 * 笔记文件导入导出工具
 * 支持 H5 和 APP-PLUS
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

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}${m}${day}-${h}${min}${s}`
}

function getFileExt(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

/* ========== Markdown 标题提取 ========== */

function extractH1FromMarkdown(content) {
  if (!content) return ''
  const lines = content.split('\n')
  const checkCount = Math.min(lines.length, 10)
  for (let i = 0; i < checkCount; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const m = line.match(/^#\s+(.+)$/)
    if (m) return m[1].trim()
    if (!line.startsWith('#') && line.length > 0) break
  }
  return ''
}

/* ========== H5 文件下载 ========== */

// #ifdef H5
function downloadTextFile(filename, content, mimeType) {
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
// #endif

/* ========== H5 文件读取 ========== */

// #ifdef H5
function readTextFileFromInput(accept) {
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

    window.addEventListener('focus', function onfocus() {
      window.removeEventListener('focus', onfocus)
      setTimeout(() => {
        if (!settled && (!input.files || !input.files.length)) {
          settle(reject, new Error('CANCELLED'))
        }
      }, 200)
    }, { once: true })

    input.click()
  })
}
// #endif

/* ========== APP-PLUS 文件操作 ========== */

// #ifdef APP-PLUS

/**
 * 使用 plus.io 将文本保存到 _doc/self_discipline_backups/ 目录
 * @param {string} filename
 * @param {string} content
 * @returns {Promise<string>} 保存成功后的完整文件路径
 */
function saveTextToDoc(filename, content) {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL('_doc/', (docEntry) => {
      docEntry.getDirectory('self_discipline_backups', { create: true }, (dirEntry) => {
        dirEntry.getFile(filename, { create: true }, (fileEntry) => {
          fileEntry.createWriter((writer) => {
            writer.onwrite = () => {
              const fullPath = fileEntry.fullPath || ('_doc/self_discipline_backups/' + filename)
              resolve(fullPath)
            }
            writer.onerror = (err) => {
              reject(new Error('写入失败：' + (err.message || '')))
            }
            writer.write(content)
          }, (err) => {
            reject(new Error('创建写入器失败：' + (err.message || '')))
          })
        }, (err) => {
          reject(new Error('创建文件失败：' + (err.message || '')))
        })
      }, (err) => {
        reject(new Error('创建目录失败：' + (err.message || '')))
      })
    }, (err) => {
      reject(new Error('无法访问应用存储目录：' + (err.message || '')))
    })
  })
}

/**
 * 读取文件文本内容（优先 uni.getFileSystemManager，降级 plus.io）
 * @param {string} filePath - 文件完整路径（uni.chooseFile 返回的 tempFilePath）
 * @returns {Promise<string>}
 */
function readFileAsText(filePath) {
  return new Promise((resolve, reject) => {
    // 方式1：uni.getFileSystemManager（更可靠，直接支持 tempFilePath）
    try {
      const fs = uni.getFileSystemManager()
      fs.readFile({
        filePath,
        encoding: 'utf8',
        success: (res) => {
          resolve(typeof res.data === 'string' ? res.data : '')
        },
        fail: () => {
          // 方式2：降级到 plus.io
          readFileWithPlusIo(filePath).then(resolve).catch(reject)
        }
      })
    } catch (e) {
      // 方式2：降级到 plus.io
      readFileWithPlusIo(filePath).then(resolve).catch(reject)
    }
  })
}

function readFileWithPlusIo(filePath) {
  return new Promise((resolve, reject) => {
    plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
      entry.file((file) => {
        const reader = new plus.io.FileReader()
        reader.onload = (e) => {
          resolve(e.target.result || '')
        }
        reader.onerror = () => {
          reject(new Error('读取文件内容失败'))
        }
        reader.readAsText(file, 'utf-8')
      }, (err) => {
        reject(new Error('获取文件对象失败：' + (err.message || '')))
      })
    }, (err) => {
      reject(new Error('无法访问文件：' + (err.message || '')))
    })
  })
}

/**
 * 备份/导出操作：弹出选项（复制到剪贴板 / 保存到应用目录）
 */
function showExportActionSheet(filename, content) {
  uni.showActionSheet({
    itemList: ['复制到剪贴板', '保存到应用目录'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.setClipboardData({
          data: content,
          success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
        })
      } else if (res.tapIndex === 1) {
        uni.showLoading({ title: '保存中...' })
        saveTextToDoc(filename, content).then((path) => {
          uni.hideLoading()
          uni.showModal({
            title: '保存成功',
            content: '文件已保存到：\n' + path,
            showCancel: false,
            confirmText: '确定'
          })
        }).catch((err) => {
          uni.hideLoading()
          uni.showToast({ title: err.message || '文件保存失败', icon: 'none', duration: 3000 })
        })
      }
    }
  })
}

/**
 * 导入/恢复操作：弹出选项（从文件导入 / 从剪贴板导入）
 * @param {string} fileType - 'md' | 'json'
 * @returns {Promise<{name: string, content: string}|null>}
 */
function showImportActionSheet(fileType) {
  return new Promise((resolve) => {
    const isJson = fileType === 'json'
    const fileLabel = isJson ? 'JSON 备份' : 'Markdown'
    uni.showActionSheet({
      itemList: ['从文件导入', '从剪贴板导入'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 从文件导入
          importFromFile(fileType).then(resolve)
        } else if (res.tapIndex === 1) {
          // 从剪贴板导入
          importFromClipboard(fileType).then(resolve)
        }
      },
      fail: () => {
        resolve(null)
      }
    })
  })
}

/**
 * 使用 uni.chooseFile 选择文件并读取
 */
function importFromFile(fileType) {
  const isJson = fileType === 'json'
  const allowedExts = isJson ? ['.json'] : ['.md', '.txt']

  return new Promise((resolve) => {
    try {
      uni.chooseFile({
        count: 1,
        type: 'file',
        success: async (res) => {
          const tempFilePath = res.tempFilePaths[0]
          const tempFile = res.tempFiles[0]
          const rawName = (tempFile && tempFile.name) || ''
          const ext = getFileExt(rawName)

          if (!allowedExts.includes(ext)) {
            uni.showToast({ title: `请选择 ${allowedExts.join('/')} 格式文件`, icon: 'none' })
            resolve(null)
            return
          }

          uni.showLoading({ title: '读取中...' })
          try {
            const content = await readFileAsText(tempFilePath)
            uni.hideLoading()
            if (!content || !content.trim()) {
              uni.showToast({ title: '文件内容为空', icon: 'none' })
              resolve(null)
              return
            }
            const dotIdx = rawName.lastIndexOf('.')
            const name = dotIdx > 0 ? rawName.slice(0, dotIdx).trim() : rawName.trim()
            resolve({ name, content })
          } catch (e) {
            uni.hideLoading()
            uni.showToast({ title: e.message || '文件读取失败', icon: 'none' })
            resolve(null)
          }
        },
        fail: () => {
          uni.showToast({ title: '当前基座不支持文件选择，请使用剪贴板导入', icon: 'none', duration: 2500 })
          resolve(null)
        }
      })
    } catch (e) {
      // uni.chooseFile 不存在或调用抛异常
      uni.showToast({ title: '当前基座不支持文件选择，请使用剪贴板导入', icon: 'none', duration: 2500 })
      resolve(null)
    }
  })
}

/**
 * 从剪贴板读取内容
 */
function importFromClipboard(fileType) {
  return new Promise((resolve) => {
    uni.getClipboardData({
      success: (res) => {
        const content = (res.data || '').trim()
        if (!content) {
          uni.showToast({ title: '剪贴板为空', icon: 'none' })
          resolve(null)
          return
        }

        if (fileType === 'json') {
          // JSON 备份校验
          try {
            const parsed = JSON.parse(content)
            if (!parsed || parsed.type !== 'cloud-notes-backup' || !Array.isArray(parsed.notes)) {
              uni.showToast({ title: '剪贴板内容不是有效的知识库备份', icon: 'none' })
              resolve(null)
              return
            }
          } catch (e) {
            uni.showToast({ title: '剪贴板内容不是有效的 JSON 格式', icon: 'none' })
            resolve(null)
            return
          }
          resolve({ name: 'clipboard-backup', content })
        } else {
          // Markdown 文件
          resolve({ name: 'clipboard-import.md', content })
        }
      },
      fail: () => {
        uni.showToast({ title: '无法读取剪贴板', icon: 'none' })
        resolve(null)
      }
    })
  })
}
// #endif

/* ========== 单篇笔记导出 Markdown ========== */

export function exportNoteAsMarkdown(note) {
  const mdFilename = sanitizeFilename(note.title) + '.md'
  const content = note.content || ''

  // #ifdef H5
  downloadTextFile(mdFilename, content, 'text/markdown;charset=utf-8')
  uni.showToast({ title: '导出成功', icon: 'success' })
  // #endif

  // #ifdef APP-PLUS
  showExportActionSheet(mdFilename, content)
  // #endif
}

/* ========== 导入 Markdown 文件 ========== */

export async function importMarkdownFile() {
  // #ifdef H5
  let fileInfo
  try {
    fileInfo = await readTextFileFromInput('.md,.txt')
  } catch (e) {
    if (e.message === 'CANCELLED') return null
    uni.showToast({ title: e.message || '文件读取失败', icon: 'none' })
    return null
  }

  const ext = getFileExt(fileInfo.name)
  if (ext !== '.md' && ext !== '.txt') {
    uni.showToast({ title: '请选择 .md 或 .txt 文件', icon: 'none' })
    return null
  }

  const content = fileInfo.content || ''
  const h1Title = extractH1FromMarkdown(content)
  const rawName = fileInfo.name || ''
  const dotIdx = rawName.lastIndexOf('.')
  const fileNameTitle = dotIdx > 0 ? rawName.slice(0, dotIdx).trim() : rawName.trim()
  const title = h1Title || fileNameTitle || '未命名导入笔记'

  return await doImportNote(title, content)
  // #endif

  // #ifdef APP-PLUS
  const fileInfo = await showImportActionSheet('md')
  if (!fileInfo) return null

  const content = fileInfo.content || ''
  const h1Title = extractH1FromMarkdown(content)
  const rawName = fileInfo.name || ''
  const dotIdx = rawName.lastIndexOf('.')
  const fileNameTitle = dotIdx > 0 ? rawName.slice(0, dotIdx).trim() : rawName.trim()
  const title = h1Title || fileNameTitle || '未命名导入笔记'

  return await doImportNote(title, content)
  // #endif
}

/* ========== 导入笔记公共逻辑 ========== */

async function doImportNote(title, content) {
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
}

/* ========== 导出知识库备份 JSON ========== */

export async function exportAllNotesAsJson() {
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
    const backupFilename = `self-discipline-notes-backup-${formatDateTime(new Date())}.json`

    // #ifdef H5
    downloadTextFile(backupFilename, json, 'application/json;charset=utf-8')
    uni.showToast({ title: '备份导出成功', icon: 'success' })
    // #endif

    // #ifdef APP-PLUS
    showExportActionSheet(backupFilename, json)
    // #endif
  } catch (e) {
    uni.showToast({ title: '备份导出失败', icon: 'none' })
  }
}

/* ========== 从 JSON 备份恢复 ========== */

export async function restoreFromJsonBackup() {
  // #ifdef H5
  let fileInfo
  try {
    fileInfo = await readTextFileFromInput('.json')
  } catch (e) {
    if (e.message === 'CANCELLED') return null
    uni.showToast({ title: e.message || '文件读取失败', icon: 'none' })
    return null
  }

  const ext = getFileExt(fileInfo.name)
  if (ext !== '.json') {
    uni.showToast({ title: '请选择 .json 备份文件', icon: 'none' })
    return null
  }

  return await doRestoreFromJson(fileInfo.content)
  // #endif

  // #ifdef APP-PLUS
  const fileInfo = await showImportActionSheet('json')
  if (!fileInfo) return null

  return await doRestoreFromJson(fileInfo.content)
  // #endif
}

/* ========== 恢复备份公共逻辑 ========== */

async function doRestoreFromJson(fileContent) {
  let backup
  try {
    backup = JSON.parse(fileContent)
  } catch (e) {
    uni.showToast({ title: 'JSON 格式错误，请检查文件', icon: 'none' })
    return null
  }

  if (!backup || backup.type !== 'cloud-notes-backup' || !Array.isArray(backup.notes)) {
    uni.showToast({ title: '不是有效的知识库备份文件', icon: 'none' })
    return null
  }

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
  let folderSuccess = 0
  const folderIdMap = {}

  if (folderCount > 0) {
    let existingFolders = []
    try {
      const flRes = await getFolderList()
      existingFolders = flRes.data || []
    } catch (e) {
      // 查询失败不阻塞
    }
    const existingNameMap = {}
    existingFolders.forEach(ef => { existingNameMap[ef.name] = ef.id })

    for (const f of backup.folders) {
      const folderName = f.name || '未命名文件夹'
      try {
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
}

import { get, post, put, del, BASE_URL, handle401 } from '../utils/request'
import { getToken } from '../utils/auth'

// 上传接口地址与 API 请求地址统一，由 request.js 的 BASE_URL 控制
export const UPLOAD_BASE = BASE_URL

// ========== 笔记接口 ==========

/** 查询笔记列表 */
export function getNoteList(params) {
  return get({ url: '/api/notes', data: params })
}

/** 获取标签统计 */
export function getNoteTags() {
  return get({ url: '/api/notes/tags' })
}

/** 批量归一化历史标签（一次性迁移） */
export function normalizeAllTags() {
  return post({ url: '/api/notes/normalize-tags' })
}

/** 查询笔记详情 */
export function getNoteDetail(id) {
  return get({ url: `/api/notes/${id}` })
}

/** 新增笔记 */
export function createNote(data) {
  return post({ url: '/api/notes', data })
}

/** 修改笔记 */
export function updateNote(id, data) {
  return put({ url: `/api/notes/${id}`, data })
}

/** 删除笔记（移入回收站） */
export function deleteNote(id) {
  return del({ url: `/api/notes/${id}` })
}

/** 查询回收站笔记列表 */
export function getTrashNotes() {
  return get({ url: '/api/notes/trash' })
}

/** 恢复笔记 */
export function restoreNote(id) {
  return put({ url: `/api/notes/${id}/restore` })
}

/** 彻底删除笔记 */
export function permanentDeleteNote(id) {
  return del({ url: `/api/notes/${id}/permanent` })
}

// ========== 版本历史接口 ==========

/** 查询笔记版本列表 */
export function getNoteVersions(noteId) {
  return get({ url: `/api/notes/${noteId}/versions` })
}

/** 查询版本详情 */
export function getNoteVersionDetail(noteId, versionId) {
  return get({ url: `/api/notes/${noteId}/versions/${versionId}` })
}

/** 手动保存版本快照 */
export function createNoteVersion(noteId) {
  return post({ url: `/api/notes/${noteId}/versions` })
}

/** 恢复指定版本 */
export function restoreNoteVersion(noteId, versionId) {
  return put({ url: `/api/notes/${noteId}/versions/${versionId}/restore` })
}

// ========== 文件夹接口 ==========

/** 查询文件夹列表 */
export function getFolderList() {
  return get({ url: '/api/note-folders' })
}

/** 新增文件夹 */
export function createFolder(data) {
  return post({ url: '/api/note-folders', data })
}

/** 修改文件夹 */
export function updateFolder(id, data) {
  return put({ url: `/api/note-folders/${id}`, data })
}

/** 删除文件夹 */
export function deleteFolder(id) {
  return del({ url: `/api/note-folders/${id}` })
}

// ========== 附件接口 ==========

/**
 * 上传笔记附件（图片/文件）
 * @param {string} filePath - 本地文件路径（uni.chooseFile 返回）
 * @param {string} [originalName] - 原始文件名（blob URL 场景下需要额外传入）
 * @returns {Promise<{code, message, data: {fileName, fileUrl, fileType, fileSize}}>}
 */
export function uploadNoteAttachment(filePath, originalName) {
  const header = {}
  const token = getToken()
  if (token) {
    header['Authorization'] = 'Bearer ' + token
  }

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: UPLOAD_BASE + '/api/note-attachments/upload',
      filePath,
      name: 'file',
      header,
      formData: originalName ? { originalName } : undefined,
      success: (res) => {
        try {
          if (res.statusCode === 401) {
            handle401()
            reject({ code: 401, message: '未登录或登录已过期' })
            return
          }
          const body = JSON.parse(res.data)
          if (body.code === 200) {
            resolve(body)
          } else {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' })
            reject(body)
          }
        } catch (e) {
          uni.showToast({ title: '上传响应解析失败', icon: 'none' })
          reject(e)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络连接失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

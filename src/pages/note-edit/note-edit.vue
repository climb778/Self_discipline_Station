<template>
  <view class="page-shell" :class="themeClass">
    <!-- 标题 -->
    <view class="field card">
      <input v-model.trim="form.title" class="title-input" placeholder="笔记标题（留空则为未命名笔记）" @input="onInput" />
    </view>

    <!-- 文件夹选择 -->
    <view v-if="folders.length" class="field card">
      <text class="label">文件夹</text>
      <view class="chips">
        <text class="chip" :class="{ active: !form.folderId }" @tap="form.folderId = null; onInput()">未分类</text>
        <text v-for="f in folders" :key="f.id" class="chip" :class="{ active: form.folderId === f.id }" @tap="form.folderId = f.id; onInput()">{{ f.name }}</text>
      </view>
    </view>

    <!-- 标签 -->
    <view class="field card">
      <text class="label">标签（逗号分隔）</text>
      <input v-model.trim="form.tags" class="tag-input" placeholder="例如：Java,学习笔记" @input="onInput" />
    </view>

    <!-- Markdown 编辑区 -->
    <view class="editor-card card">
      <scroll-view class="editor-toolbar" scroll-x :show-scrollbar="false">
        <view class="toolbar-inner">
          <text class="toolbar-btn" @tap="insertMarkdown('heading')">H</text>
          <text class="toolbar-btn" @tap="insertMarkdown('bold')">B</text>
          <text class="toolbar-btn" @tap="insertMarkdown('quote')">></text>
          <text class="toolbar-btn" @tap="insertMarkdown('list')">-</text>
          <text class="toolbar-btn" @tap="insertMarkdown('code')">`</text>
          <text class="toolbar-btn" @tap="insertMarkdown('divider')">—</text>
          <text class="toolbar-btn wikilink-btn" @tap="insertWikilink">[[ ]]</text>
          <text class="toolbar-btn media-btn" @tap="pickAndUploadImage">图片</text>
          <text class="toolbar-btn media-btn" @tap="pickAndUploadFile">附件</text>
        </view>
      </scroll-view>
      <textarea v-model="form.content" class="editor-textarea" placeholder="输入 Markdown 内容..." :maxlength="-1" @input="onInput" />
    </view>

    <!-- 自动保存提示 -->
    <text v-if="autoSaved" class="auto-saved">已自动保存</text>

    <!-- 操作栏 -->
    <view class="action-bar">
      <button class="preview-btn" @tap="goPreview">预览</button>
      <button v-if="isEdit" class="snapshot-btn" @tap="handleSaveVersion">保存版本</button>
      <button class="primary-button save-btn" @tap="saveNote">{{ isEdit ? '保存修改' : '保存笔记' }}</button>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getNoteDetail, createNote, updateNote, getFolderList, uploadNoteAttachment, createNoteVersion } from '../../api/notes'

const themeClass = ref(getThemeClass())
const noteId = ref('')
const isEdit = computed(() => Boolean(noteId.value))
const folders = ref([])
const formDirty = ref(false)
const autoSaved = ref(false)
const saving = ref(false)
let autoSaveTimer = null
let autoSavedTimer = null

const form = reactive({
  title: '',
  content: '',
  folderId: null,
  tags: ''
})

function normalizeTags(raw) {
  if (!raw) return null
  const parts = raw.split(/[,，\s]+/).map(s => s.trim()).filter(Boolean)
  const unique = [...new Set(parts)]
  return unique.length ? unique.join(',') : null
}

function buildPayload(titleOverride) {
  return {
    title: titleOverride || form.title || '未命名笔记',
    content: form.content,
    folderId: form.folderId || null,
    tags: normalizeTags(form.tags)
  }
}

function scheduleAutoSave() {
  formDirty.value = true
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => doSave(false), 2000)
}

function onInput() {
  scheduleAutoSave()
}

/**
 * 统一保存函数，auto 和 manual 共用
 * @param {boolean} manual - 是否为手动保存
 * @returns {Promise<boolean>} 是否保存成功
 */
async function doSave(manual) {
  if (saving.value) return false

  // 自动保存：标题和正文都为空则跳过
  if (!manual && !form.title && !form.content) return false

  saving.value = true
  if (autoSaveTimer) { clearTimeout(autoSaveTimer); autoSaveTimer = null }

  try {
    if (isEdit.value) {
      await updateNote(noteId.value, buildPayload())
    } else {
      const res = await createNote(buildPayload())
      const newId = res.data && res.data.id
      if (newId) {
        noteId.value = String(newId)
      }
      clearDraft()
    }
    formDirty.value = false
    if (manual) {
      uni.showToast({ title: '已保存', icon: 'success' })
    } else {
      showAutoSaved()
    }
    return true
  } catch (e) {
    return false
  } finally {
    saving.value = false
  }
}

function showAutoSaved() {
  autoSaved.value = true
  if (autoSavedTimer) clearTimeout(autoSavedTimer)
  autoSavedTimer = setTimeout(() => { autoSaved.value = false }, 2000)
}

function saveDraft() {
  if (!form.title && !form.content) return
  uni.setStorageSync('SELF_DISCIPLINE_NOTE_DRAFT', { ...form, savedAt: Date.now() })
}

function loadDraft() {
  return uni.getStorageSync('SELF_DISCIPLINE_NOTE_DRAFT') || null
}

function clearDraft() {
  uni.removeStorageSync('SELF_DISCIPLINE_NOTE_DRAFT')
}

function insertMarkdown(type) {
  const inserts = {
    heading: '\n## ',
    bold: '**加粗文字**',
    quote: '\n> 引用内容',
    list: '\n- 列表项',
    code: '\n```\n代码\n```',
    divider: '\n---\n'
  }
  form.content += (inserts[type] || '')
  scheduleAutoSave()
}

function insertWikilink() {
  uni.showModal({
    title: '插入双向链接',
    editable: true,
    placeholderText: '输入要链接的笔记标题',
    success: (res) => {
      if (res.confirm && res.content) {
        form.content += `[[${res.content}]]`
        scheduleAutoSave()
      }
    }
  })
}

/* ========== 文件上传工具 ========== */

const MAX_UPLOAD_SIZE = 20 * 1024 * 1024
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const FILE_EXTS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar']

function getExt(name) {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
}

function sanitizeLinkText(name) {
  // 去掉会破坏 Markdown 链接语法的字符
  return name.replace(/[\[\]()]/g, '')
}

// #ifdef H5
function pickAndUploadH5(accept, allowedExts, isImage) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.style.display = 'none'
  document.body.appendChild(input)

  let settled = false

  const cleanup = () => {
    input.onchange = null
    try { document.body.removeChild(input) } catch (e) { /* ignore */ }
  }

  input.onchange = async () => {
    if (settled) return
    settled = true
    const file = input.files && input.files[0]
    cleanup()
    if (!file) return

    // 前端预校验：大小
    if (file.size > MAX_UPLOAD_SIZE) {
      uni.showToast({ title: '文件大小不能超过 20MB', icon: 'none' })
      return
    }

    // 前端预校验：后缀
    const ext = getExt(file.name)
    if (!allowedExts.includes(ext)) {
      const label = isImage ? '图片' : '附件'
      uni.showToast({ title: `请选择 ${allowedExts.join('/')} 格式的${label}`, icon: 'none' })
      return
    }

    uni.showLoading({ title: '上传中...' })
    try {
      const res = await uploadNoteAttachment(URL.createObjectURL(file), file.name)
      const data = res.data
      const safeName = sanitizeLinkText(data.fileName)
      if (isImage) {
        form.content += `\n![${safeName}](${data.fileUrl})\n`
      } else {
        form.content += `\n[${safeName}](${data.fileUrl})\n`
      }
      scheduleAutoSave()
      uni.showToast({ title: isImage ? '图片已插入' : '附件已插入', icon: 'success' })
    } catch (e) {
      // uploadNoteAttachment 内部已 toast
    } finally {
      uni.hideLoading()
    }
  }

  // 取消选择时 focus 兜底清理
  window.addEventListener('focus', function onfocus() {
    window.removeEventListener('focus', onfocus)
    setTimeout(() => {
      if (!settled) {
        settled = true
        cleanup()
      }
    }, 300)
  }, { once: true })

  input.click()
}
// #endif

function pickAndUploadImage() {
  // #ifdef H5
  pickAndUploadH5('image/jpeg,image/png,image/gif,image/webp', IMAGE_EXTS, true)
  // #endif
  // #ifdef APP-PLUS
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFilePaths[0]
      const tempFile = res.tempFiles[0]
      const name = tempFile.name || ('image_' + Date.now() + '.jpg')
      doUploadApp(filePath, name, true)
    }
  })
  // #endif
}

function pickAndUploadFile() {
  // #ifdef H5
  pickAndUploadH5('.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar', FILE_EXTS, false)
  // #endif
  // #ifdef APP-PLUS
  uni.chooseFile({
    count: 1,
    type: 'file',
    success: (res) => {
      const filePath = res.tempFilePaths[0]
      const tempFile = res.tempFiles[0]
      const name = tempFile.name || ('file_' + Date.now())
      const ext = getExt(name)
      if (FILE_EXTS.includes(ext) || IMAGE_EXTS.includes(ext)) {
        doUploadApp(filePath, name, false)
      } else {
        uni.showToast({ title: '请选择 pdf/doc/xls/ppt/txt/zip 格式文件', icon: 'none' })
      }
    },
    fail: () => {
      // uni.chooseFile 在部分 App 环境不可用时的兜底
      uni.showToast({ title: '当前 App 版本不支持文件选择，请使用图片按钮上传图片', icon: 'none', duration: 2500 })
    }
  })
  // #endif
}

// #ifdef APP-PLUS
async function doUploadApp(filePath, fileName, isImage) {
  if (!isImage) {
    const ext = getExt(fileName)
    if (!FILE_EXTS.includes(ext) && !IMAGE_EXTS.includes(ext)) {
      uni.showToast({ title: '不支持的文件格式', icon: 'none' })
      return
    }
  }
  uni.showLoading({ title: '上传中...' })
  try {
    const res = await uploadNoteAttachment(filePath, fileName)
    const data = res.data
    const safeName = sanitizeLinkText(data.fileName || fileName)
    if (isImage) {
      form.content += `\n![${safeName}](${data.fileUrl})\n`
    } else {
      form.content += `\n[${safeName}](${data.fileUrl})\n`
    }
    scheduleAutoSave()
    uni.showToast({ title: isImage ? '图片已插入' : '附件已插入', icon: 'success' })
  } catch (e) {
    // uploadNoteAttachment 内部已 toast
  } finally {
    uni.hideLoading()
  }
}
// #endif

async function saveNote() {
  const ok = await doSave(true)
  if (!ok) return

  if (isEdit.value) {
    setTimeout(() => uni.redirectTo({ url: `/pages/note-detail/note-detail?id=${noteId.value}` }), 300)
  } else {
    const id = noteId.value
    if (id) {
      setTimeout(() => uni.redirectTo({ url: `/pages/note-detail/note-detail?id=${id}` }), 300)
    } else {
      setTimeout(() => uni.navigateBack(), 300)
    }
  }
}

function goPreview() {
  uni.setStorageSync('SELF_DISCIPLINE_NOTE_PREVIEW', { ...form })
  uni.navigateTo({ url: '/pages/note-detail/note-detail?mode=preview' })
}

async function handleSaveVersion() {
  if (!noteId.value) return
  try {
    await createNoteVersion(noteId.value)
    uni.showToast({ title: '版本已保存', icon: 'success' })
  } catch (e) { /* request.js 已提示 */ }
}

async function loadFolders() {
  try {
    const res = await getFolderList()
    folders.value = res.data || []
  } catch (e) {
    folders.value = []
  }
}

onLoad(options => {
  if (options?.id) {
    noteId.value = options.id
    uni.setNavigationBarTitle({ title: '编辑笔记' })
    getNoteDetail(noteId.value).then(res => {
      const note = res.data
      form.title = note.title || ''
      form.content = note.content || ''
      form.folderId = note.folderId || null
      form.tags = note.tags || ''
      formDirty.value = false
    }).catch(() => {
      uni.showToast({ title: '笔记不存在', icon: 'none' })
      setTimeout(() => uni.navigateBack(), 500)
    })
  } else {
    const draft = loadDraft()
    if (draft && (draft.title || draft.content)) {
      form.title = draft.title || ''
      form.content = draft.content || ''
      form.folderId = draft.folderId || null
      form.tags = draft.tags || ''
    }
  }
})

onShow(() => {
  themeClass.value = getThemeClass()
  loadFolders()
})

onUnload(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (autoSavedTimer) clearTimeout(autoSavedTimer)
  if (!isEdit.value && formDirty.value) {
    saveDraft()
  }
  uni.removeStorageSync('SELF_DISCIPLINE_NOTE_PREVIEW')
})
</script>

<style scoped>
.field {
  padding: 24rpx 28rpx;
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  color: #172033;
  margin-bottom: 14rpx;
}

.title-input {
  width: 100%;
  height: 80rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #172033;
}

.tag-input {
  width: 100%;
  height: 72rpx;
  font-size: 28rpx;
  color: #172033;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.chip {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  color: #66758c;
  background: #eef4fb;
}

.chip.active {
  color: #fff;
  background: var(--theme-primary);
}

.editor-card {
  padding: 0;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.editor-toolbar {
  background: #f8fafd;
  border-bottom: 1rpx solid #edf2f8;
  white-space: nowrap;
}

.toolbar-inner {
  display: inline-flex;
  padding: 14rpx 20rpx;
  gap: 12rpx;
}

.toolbar-btn {
  display: inline-block;
  min-width: 64rpx;
  height: 56rpx;
  line-height: 56rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  color: #66758c;
  background: #fff;
  border-radius: 12rpx;
  padding: 0 12rpx;
  white-space: nowrap;
  flex-shrink: 0;
}

.toolbar-btn:active {
  background: #eef4fb;
}

.wikilink-btn {
  min-width: auto;
  padding: 0 16rpx;
  font-size: 22rpx;
  color: var(--theme-primary);
}

.media-btn {
  min-width: auto;
  padding: 0 20rpx;
  font-size: 26rpx;
  color: #2e9b68;
}

.editor-textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 500rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #172033;
  line-height: 1.7;
}

.auto-saved {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #2e9b68;
  margin: 12rpx 0 4rpx;
}

.action-bar {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}

.preview-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: var(--theme-primary);
  background: var(--theme-soft);
  border-radius: 24rpx;
  border: none;
}

.preview-btn:active {
  opacity: 0.8;
}

.snapshot-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 24rpx;
  border: none;
}

.snapshot-btn:active {
  opacity: 0.8;
}

.save-btn {
  flex: 2;
}
</style>

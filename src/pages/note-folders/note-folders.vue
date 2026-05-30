<template>
  <view class="page-shell" :class="themeClass">
    <!-- 标题卡 -->
    <view class="hero-card">
      <text class="hero-title">文件夹管理</text>
      <text class="hero-sub">整理你的笔记分类</text>
    </view>

    <!-- 新建文件夹 -->
    <view class="add-bar card">
      <input v-model.trim="newFolderName" class="add-input" placeholder="输入文件夹名称" @confirm="handleCreate" />
      <text class="add-btn" @tap="handleCreate">新建</text>
    </view>

    <!-- 文件夹列表 -->
    <view v-if="folders.length" class="folder-list">
      <view v-for="f in folders" :key="f.id" class="folder-card card">
        <view v-if="editingId === f.id" class="folder-edit">
          <input v-model.trim="editingName" class="edit-input" placeholder="文件夹名称" @confirm="handleUpdate(f.id)" />
          <text class="edit-save" @tap="handleUpdate(f.id)">保存</text>
          <text class="edit-cancel" @tap="editingId = ''">取消</text>
        </view>
        <view v-else class="folder-row">
          <view class="folder-info">
            <text class="folder-icon">📁</text>
            <text class="folder-name">{{ f.name }}</text>
          </view>
          <view class="folder-actions">
            <text class="action-edit" @tap="startEdit(f)">编辑</text>
            <text class="action-delete" @tap="handleDelete(f)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text class="empty-icon">📂</text>
      <text class="empty-title">还没有文件夹</text>
      <text class="empty-text">在上方输入名称创建第一个文件夹</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getThemeClass } from '../../utils/storage'
import { getFolderList, createFolder, updateFolder, deleteFolder } from '../../api/notes'

const themeClass = ref(getThemeClass())
const folders = ref([])
const newFolderName = ref('')
const editingId = ref('')
const editingName = ref('')

async function loadFolders() {
  try {
    const res = await getFolderList()
    folders.value = res.data || []
  } catch (e) {
    folders.value = []
  }
}

async function handleCreate() {
  const name = newFolderName.value
  if (!name) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  try {
    await createFolder({ name, parentId: 0 })
    newFolderName.value = ''
    uni.showToast({ title: '已创建', icon: 'success' })
    loadFolders()
  } catch (e) { /* request.js 已提示 */ }
}

function startEdit(f) {
  editingId.value = f.id
  editingName.value = f.name
}

async function handleUpdate(id) {
  const name = editingName.value
  if (!name) {
    uni.showToast({ title: '请输入名称', icon: 'none' })
    return
  }
  try {
    await updateFolder(id, { name })
    editingId.value = ''
    uni.showToast({ title: '已修改', icon: 'success' })
    loadFolders()
  } catch (e) { /* request.js 已提示 */ }
}

function handleDelete(f) {
  uni.showModal({
    title: '确认删除',
    content: `删除「${f.name}」后，其中的笔记将变为未分类。`,
    confirmColor: '#e84f4f',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteFolder(f.id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadFolders()
        } catch (e) { /* request.js 已提示 */ }
      }
    }
  })
}

onShow(() => {
  themeClass.value = getThemeClass()
  loadFolders()
})
</script>

<style scoped>
.hero-card {
  background: linear-gradient(135deg, var(--theme-primary), var(--theme-secondary));
  border-radius: 32rpx;
  padding: 36rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 16rpx 40rpx var(--theme-shadow);
}

.hero-title {
  display: block;
  color: #fff;
  font-size: 38rpx;
  font-weight: 700;
}

.hero-sub {
  display: block;
  color: rgba(255, 255, 255, 0.8);
  font-size: 26rpx;
  margin-top: 8rpx;
}

.add-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  margin-bottom: 24rpx;
  gap: 16rpx;
}

.add-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #172033;
}

.add-btn {
  padding: 14rpx 32rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
  background: var(--theme-primary);
  white-space: nowrap;
}

.add-btn:active {
  opacity: 0.85;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.folder-card {
  padding: 24rpx 28rpx;
}

.folder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.folder-info {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex: 1;
}

.folder-icon {
  font-size: 36rpx;
}

.folder-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #172033;
}

.folder-actions {
  display: flex;
  gap: 20rpx;
}

.action-edit {
  font-size: 26rpx;
  color: var(--theme-primary);
  font-weight: 600;
  padding: 8rpx 4rpx;
}

.action-delete {
  font-size: 26rpx;
  color: #e84f4f;
  font-weight: 600;
  padding: 8rpx 4rpx;
}

.folder-edit {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.edit-input {
  flex: 1;
  height: 72rpx;
  font-size: 28rpx;
  color: #172033;
  background: #f3f7fc;
  border-radius: 16rpx;
  padding: 0 20rpx;
}

.edit-save {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--theme-primary);
  padding: 12rpx 8rpx;
}

.edit-cancel {
  font-size: 26rpx;
  color: #8491a5;
  padding: 12rpx 8rpx;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #172033;
  margin-bottom: 12rpx;
}

.empty-text {
  display: block;
  font-size: 26rpx;
  color: #8491a5;
}
</style>

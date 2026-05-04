<template>
  <view class="page-shell">
    <view class="form-card card">
      <view class="field">
        <text class="label">任务标题</text>
        <input v-model.trim="form.title" class="input" placeholder="输入你要完成的事" />
      </view>

      <view class="field">
        <text class="label">任务描述</text>
        <textarea v-model.trim="form.description" class="textarea" placeholder="补充目标、步骤或提醒" />
      </view>

      <view class="field">
        <text class="label">分类</text>
        <view class="chips">
          <text v-for="item in categories" :key="item" class="chip" :class="{ active: form.category === item }" @tap="form.category = item">{{ item }}</text>
        </view>
      </view>

      <view class="field">
        <text class="label">截止日期</text>
        <picker mode="date" :value="form.dueDate" @change="form.dueDate = $event.detail.value">
          <view class="picker-value">{{ form.dueDate }}</view>
        </picker>
      </view>

      <view class="field">
        <text class="label">优先级</text>
        <view class="chips">
          <text v-for="item in priorities" :key="item" class="chip" :class="{ active: form.priority === item }" @tap="form.priority = item">{{ item }}</text>
        </view>
      </view>

      <view class="switch-line">
        <view>
          <text class="label">长期任务</text>
          <text class="hint">长期任务会出现在每日待办中</text>
        </view>
        <switch :checked="form.isLongTerm" color="#0b4aa2" @change="form.isLongTerm = $event.detail.value" />
      </view>
    </view>

    <button class="primary-button save" @tap="submit">保存任务</button>
  </view>
</template>

<script setup>
import { reactive } from 'vue'
import { getToday } from '../../utils/date'
import { addTask } from '../../utils/storage'
import { categories, priorities } from '../../utils/tasks'

const form = reactive({
  title: '',
  description: '',
  category: '学习',
  dueDate: getToday(),
  priority: '中',
  isLongTerm: false
})

function submit() {
  if (!form.title) {
    uni.showToast({
      title: '请填写任务标题',
      icon: 'none'
    })
    return
  }

  addTask({ ...form })
  uni.showToast({
    title: '已新增',
    icon: 'success'
  })
  setTimeout(() => {
    uni.navigateBack()
  }, 350)
}
</script>

<style scoped>
.form-card {
  padding: 30rpx;
}

.field {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  color: #172033;
  font-size: 29rpx;
  font-weight: 700;
}

.hint {
  display: block;
  margin-top: 8rpx;
  color: #8491a5;
  font-size: 24rpx;
}

.input,
.textarea,
.picker-value {
  box-sizing: border-box;
  width: 100%;
  margin-top: 16rpx;
  border-radius: 22rpx;
  color: #172033;
  font-size: 28rpx;
  background: #f3f7fc;
}

.input,
.picker-value {
  height: 92rpx;
  padding: 0 24rpx;
  line-height: 92rpx;
}

.textarea {
  height: 180rpx;
  padding: 24rpx;
  line-height: 1.5;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}

.chip {
  padding: 16rpx 28rpx;
  border-radius: 999rpx;
  color: #66758c;
  font-size: 26rpx;
  background: #eef4fb;
}

.chip.active {
  color: #fff;
  background: #0b4aa2;
}

.switch-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding-top: 4rpx;
}

.save {
  margin-top: 34rpx;
}
</style>

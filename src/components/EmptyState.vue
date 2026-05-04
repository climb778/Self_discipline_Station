<template>
  <view class="empty card">
    <view class="empty-icon">—</view>
    <text class="empty-title">{{ title }}</text>
    <text class="empty-text">{{ text }}</text>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '暂无记录'
  },
  text: {
    type: String,
    default: '新的行动会在这里留下痕迹'
  }
})
</script>

<style scoped>
.empty {
  padding: 70rpx 28rpx;
  text-align: center;
}

.empty-icon {
  width: 92rpx;
  height: 92rpx;
  margin: 0 auto 22rpx;
  border-radius: 46rpx;
  color: #9fb0c5;
  font-size: 44rpx;
  line-height: 84rpx;
  background: #eef4fb;
}

.empty-title {
  display: block;
  color: #172033;
  font-size: 31rpx;
  font-weight: 700;
}

.empty-text {
  display: block;
  margin-top: 12rpx;
  color: #8491a5;
  font-size: 25rpx;
}
</style>

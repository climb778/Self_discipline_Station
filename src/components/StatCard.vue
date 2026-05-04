<template>
  <view class="stat-card card">
    <text class="value">{{ value }}</text>
    <text class="label">{{ label }}</text>
  </view>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  }
})
</script>

<style scoped>
.stat-card {
  min-width: 0;
  padding: 24rpx 18rpx;
  text-align: center;
}

.value {
  display: block;
  color: #0b4aa2;
  font-size: 42rpx;
  font-weight: 800;
  line-height: 1.1;
}

.label {
  display: block;
  margin-top: 10rpx;
  color: #8491a5;
  font-size: 24rpx;
}
</style>

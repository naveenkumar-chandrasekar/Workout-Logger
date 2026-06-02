<template>
  <div class="auth-shell">
    <div class="auth-card">
      <div class="auth-icon">🏋️</div>
      <h1 class="auth-title">Workout Logger</h1>
      <p class="auth-sub">Personalised 6-day plan · 74 kg</p>

      <div class="auth-features">
        <div class="feature-row"><span class="feature-icon">📋</span> View &amp; edit your 6-day plan</div>
        <div class="feature-row"><span class="feature-icon">💪</span> Log sets, reps &amp; weight per exercise</div>
        <div class="feature-row"><span class="feature-icon">☁️</span> Synced to Google Drive as Excel files</div>
        <div class="feature-row"><span class="feature-icon">📅</span> Track history &amp; progress</div>
      </div>

      <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon style="margin-bottom:16px;" />

      <el-button
        type="primary"
        size="large"
        :loading="loading"
        style="width:100%; font-size:15px; height:48px;"
        @click="$emit('signin')"
      >
        <template #icon><el-icon><Connection /></el-icon></template>
        Sign in with Google
      </el-button>

      <el-button size="small" text style="margin-top:12px; width:100%; color:#aaa;" @click="$emit('change-setup')">
        Change Client ID
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Connection } from '@element-plus/icons-vue';
defineProps({ error: String, loading: Boolean });
defineEmits(['signin', 'change-setup']);
</script>

<style scoped>
.auth-shell {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f8 100%);
  padding: 24px;
}
.auth-card {
  background: #fff;
  border-radius: 20px;
  padding: 36px 28px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(108,92,231,0.12);
  text-align: center;
}
.auth-icon { font-size: 52px; margin-bottom: 12px; }
.auth-title { font-size: 26px; font-weight: 800; color: #1a1a2e; margin-bottom: 4px; }
.auth-sub { font-size: 14px; color: #aaa; margin-bottom: 28px; }
.auth-features {
  text-align: left;
  background: #f9f9ff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 24px;
}
.feature-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #444;
  padding: 5px 0;
}
.feature-icon { font-size: 18px; width: 24px; flex-shrink: 0; }
</style>

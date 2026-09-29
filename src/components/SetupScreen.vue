<template>
  <div class="setup-shell">
    <div class="setup-card">
      <div class="setup-icon">🏋️</div>
      <h1 class="setup-title">Workout Logger</h1>
      <p class="setup-desc">
        Connect your Google account to sync workouts across devices via Google Drive.
        You'll need a Google Cloud OAuth Client ID.
      </p>

      <el-form label-position="top" style="margin-top: 24px;">
        <el-form-item label="Google OAuth Client ID">
          <el-input
            v-model="clientId"
            placeholder="xxxx.apps.googleusercontent.com"
            :prefix-icon="Key"
            clearable
            size="large"
          />
        </el-form-item>
      </el-form>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      >
        <template #title>
          How to get your Client ID
        </template>
        <div style="font-size:13px; line-height:1.6; margin-top:4px;">
          1. Go to <strong>console.cloud.google.com</strong><br/>
          2. Create a project → Enable <strong>Google Drive API</strong><br/>
          3. Credentials → Create <strong>OAuth 2.0 Client ID</strong> (Web app)<br/>
          4. Add your Vercel URL to Authorized JS Origins
        </div>
      </el-alert>

      <el-button
        type="primary"
        size="large"
        :disabled="!clientId.trim()"
        style="width:100%;"
        @click="save"
      >
        Continue
      </el-button>

      <el-divider>or</el-divider>

      <el-button size="large" style="width:100%;" @click="$emit('skip')">
        Use Offline (local storage only)
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Key } from '@element-plus/icons-vue';

const emit = defineEmits(['save', 'skip']);
const clientId = ref(localStorage.getItem('wl_clientId') || '');

function save() {
  const id = clientId.value.trim();
  if (!id) return;
  localStorage.setItem('wl_clientId', id);
  emit('save', id);
}
</script>

<style scoped>
.setup-shell {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef1f8 100%);
  padding: 24px;
}
.setup-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px 28px;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(108,92,231,0.12);
}
.setup-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}
.setup-title {
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  color: #1a1a2e;
  margin-bottom: 8px;
}
.setup-desc {
  font-size: 14px;
  color: #888;
  text-align: center;
  line-height: 1.6;
}
</style>

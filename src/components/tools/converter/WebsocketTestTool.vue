<template>
  <div class="space-y-4">
    <div class="flex gap-2">
      <input
        v-model="wsUrl"
        type="text"
        placeholder="ws:// 或 wss:// 地址，如: wss://echo.websocket.org/"
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "

        :disabled="status === 'connected'"
        @keyup.enter="connect"
      />
      <button
        v-if="status !== 'connected'"
        @click="connect"
        :disabled="!wsUrl.trim() || status === 'connecting'"
        class="btn-primary"
      >
        {{ status === 'connecting' ? '连接中...' : '连接' }}
      </button>
      <button
        v-else
        @click="disconnect"
        class="px-4 py-2 rounded-md text-sm font-medium text-white transition-colors"
        style="background-color: #ef4444;"
      >
        断开
      </button>
    </div>

    <div class="flex items-center gap-2">
      <div
        class="w-2.5 h-2.5 rounded-full"
        :style="{
          backgroundColor:
            status === 'connected' ? 'var(--color-success)' :
            status === 'connecting' ? '#f59e0b' :
            status === 'error' ? '#ef4444' :
            'var(--color-text-muted)'
        }"
      ></div>
      <span class="text-xs font-medium" :style="{ color: status === 'connected' ? 'var(--color-success)' : 'var(--color-text-secondary)' }">
        {{ statusText }}
      </span>
    </div>

    <ErrorAlert :message="error" />

    <div class="flex gap-2" v-if="status === 'connected'">
      <input
        v-model="messageInput"
        type="text"
        placeholder="输入要发送的消息..."
        class="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none "

        @keyup.enter="sendMessage"
      />
      <button
        @click="sendMessage"
        :disabled="!messageInput.trim()"
        class="btn-primary"
      >
        发送
      </button>
    </div>

    <div class="rounded-md border overflow-hidden" style="border-color: var(--color-border);">
      <div class="flex items-center justify-between px-4 py-2.5" style="background-color: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border);">
        <span class="text-xs font-medium" style="color: var(--color-text-secondary);">消息日志</span>
        <div class="flex items-center gap-2">
          <span class="text-xs" style="color: var(--color-text-muted);">{{ messages.length }} 条消息</span>
          <button
            v-if="messages.length > 0"
            @click="clearMessages"
            class="text-xs px-2 py-1 rounded"
            style="color: var(--color-text-muted); background-color: var(--color-bg-tertiary);"
          >
            清空
          </button>
        </div>
      </div>
      <div ref="logContainerRef" class="overflow-y-auto max-h-[320px]">
        <div v-if="messages.length === 0" class="flex items-center justify-center py-12">
          <span class="text-sm" style="color: var(--color-text-muted);">等待消息...</span>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="flex gap-2 px-4 py-2 text-sm"
          :style="{ backgroundColor: idx % 2 === 0 ? 'transparent' : 'var(--color-bg-tertiary)' }"
        >
          <span class="text-xs shrink-0 mt-0.5 font-mono" :style="{ color: msg.direction === 'sent' ? '#3b82f6' : '#22c55e' }">
            {{ msg.direction === 'sent' ? '发送' : '接收' }}
          </span>
          <span class="text-xs shrink-0 mt-0.5 font-mono" style="color: var(--color-text-muted);">{{ msg.time }}</span>
          <span class="flex-1 break-all font-mono" :style="{ color: msg.direction === 'sent' ? '#3b82f6' : 'var(--color-text)' }">{{ msg.data }}</span>
          <CopyButton :text="msg.data" />
        </div>
      </div>
    </div>

    <div class="rounded-md border p-3" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
      <div class="text-xs font-medium mb-2" style="color: var(--color-text-secondary);">公共 WebSocket 测试服务器</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="server in publicServers"
          :key="server.url"
          @click="wsUrl = server.url"
          :disabled="status === 'connected'"
          class="text-xs px-2 py-1 rounded border transition-colors"
          style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); border-color: var(--color-border);"
        >
          {{ server.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import ErrorAlert from '../../common/ErrorAlert.vue';
import CopyButton from '../../common/CopyButton.vue';

const wsUrl = ref('wss://echo.websocket.org/');
const messageInput = ref('');
const status = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle');
const error = ref('');
const logContainerRef = ref<HTMLElement>();

interface WsMessage {
  direction: 'sent' | 'received';
  time: string;
  data: string;
}

const messages = ref<WsMessage[]>([]);

let ws: WebSocket | null = null;

const statusText = ref('未连接');

const publicServers = [
  { name: 'Echo 测试', url: 'wss://echo.websocket.org/' },
  { name: 'PieSocket 演示', url: 'wss://demo.piesocket.com/v3/channel_1?api_key=oCdCMcMPQpbvNjUIzqtvF1d2X2okWpDQj4AwARJuAgtjhzKxVEjQU6IdCjwm&notify_self' },
];

function addMessage(direction: 'sent' | 'received', data: string) {
  const now = new Date();
  const time = now.toLocaleTimeString('zh-CN', { hour12: false });
  messages.value.push({ direction, time, data });
  // Auto scroll to bottom
  nextTick(() => {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
    }
  });
}

function clearMessages() {
  messages.value = [];
}

function connect() {
  error.value = '';
  const url = wsUrl.value.trim();

  if (!url) {
    error.value = '请输入 WebSocket 地址';
    return;
  }

  if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
    error.value = '地址必须以 ws:// 或 wss:// 开头';
    return;
  }

  try {
    status.value = 'connecting';
    statusText.value = '连接中...';

    ws = new WebSocket(url);

    ws.onopen = () => {
      status.value = 'connected';
      statusText.value = '已连接';
      addMessage('received', '连接已建立到 ' + url);
    };

    ws.onmessage = (event: MessageEvent) => {
      addMessage('received', typeof event.data === 'string' ? event.data : '[二进制数据]');
    };

    ws.onerror = () => {
      status.value = 'error';
      statusText.value = '连接错误';
      error.value = 'WebSocket 连接发生错误';
    };

    ws.onclose = (event: CloseEvent) => {
      status.value = 'idle';
      statusText.value = '已断开';
      addMessage('received', `连接已关闭 (代码: ${event.code}${event.reason ? ', 原因: ' + event.reason : ''})`);
      ws = null;
    };
  } catch (e: any) {
    status.value = 'error';
    statusText.value = '连接失败';
    error.value = e.message || '创建 WebSocket 连接失败';
  }
}

function disconnect() {
  if (ws) {
    ws.close(1000, '用户主动断开');
    ws = null;
  }
}

function sendMessage() {
  const msg = messageInput.value.trim();
  if (!msg || !ws || ws.readyState !== WebSocket.OPEN) return;

  try {
    ws.send(msg);
    addMessage('sent', msg);
    messageInput.value = '';
  } catch (e: any) {
    error.value = '发送消息失败: ' + (e.message || '未知错误');
  }
}
</script>

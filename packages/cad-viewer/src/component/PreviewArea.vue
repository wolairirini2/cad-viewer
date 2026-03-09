<template>
  <div class="preview-area">
    <!-- PDF -->
    <div v-if="fileType === 'pdf'" class="preview-content">
      <div class="preview-toolbar">
        <el-button-group>
          <el-button size="small" @click="pdfPage > 1 && pdfPage--">
            <el-icon><ArrowLeft /></el-icon>上一页
          </el-button>
          <span class="page-info">{{ pdfPage }} / {{ pdfPages }}</span>
          <el-button size="small" @click="pdfPage < pdfPages && pdfPage++">
            下一页<el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      <VuePdfEmbed
        :source="previewUrl"
        :page="pdfPage"
        @loaded="onPdfLoaded"
        class="preview-iframe"
      />
    </div>

    <!-- Word -->
    <div v-else-if="fileType === 'docx'" class="preview-content">
      <MlWordViewer :src="wordPreviewUrl" :highlight-text="highlightText" />
    </div>

    <!-- Office -->
    <div v-else-if="fileType === 'office'" class="preview-content">
      <iframe
        :src="officeViewerUrl"
        frameborder="0"
        class="preview-iframe"
      ></iframe>
      <div class="preview-hint">文档预览由 Microsoft Office Online 提供</div>
    </div>

    <!-- Image -->
    <div v-else-if="fileType === 'image'" class="preview-content">
      <img :src="previewUrl" class="preview-image" alt="预览图片" />
    </div>

    <!-- Unsupported -->
    <div v-else class="preview-content unsupported">
      <el-empty description="不支持的文件格式" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import VuePdfEmbed from 'vue-pdf-embed'
import MlWordViewer from './MlWordViewer.vue'
import { ElMessage } from 'element-plus'

interface Props {
  previewUrl: string
  fileName: string
  highlightText?: string
}

const props = defineProps<Props>()

const pdfPage = ref(1)
const pdfPages = ref(0)

const fileType = computed(() => {
  if (!props.previewUrl) return null
  const ext =
    (props.fileName || props.previewUrl)
      .toLowerCase()
      .split('.')
      .pop()
      ?.split('?')[0] || ''

  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  if (['doc', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office'
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return 'image'
  return 'unsupported'
})

const wordPreviewUrl = computed(() => {
  if (fileType.value !== 'docx') return ''
  return props.previewUrl.replace('http://192.168.3.184:9000', '/storage')
})

const officeViewerUrl = computed(() => {
  if (fileType.value !== 'office') return ''
  return props.previewUrl
})

const onPdfLoaded = (pdf: any) => {
  pdfPages.value = pdf.numPages
  ElMessage.success('PDF加载成功')
}

watch(
  () => props.previewUrl,
  () => {
    pdfPage.value = 1
  }
)
</script>

<style scoped>
.preview-area {
  flex: 1;
  display: flex;
  position: relative;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.preview-content {
  width: 100%;
  height: 100%;
}

.preview-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-info {
  padding: 0 12px;
  font-size: 14px;
  color: #606266;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #f5f5f5;
}

.preview-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #909399;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  border-radius: 12px;
}

.unsupported {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

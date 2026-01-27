<template>
  <el-dialog
    v-model="visible"
    title="审查内容详情"
    width="800px"
    class="violation-detail-dialog-wrapper"
    :style="{ maxHeight: '85vh' }"
    draggable
  >
    <div v-if="data" class="violation-detail-dialog">
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-label">检查内容:</span>
          <span>{{ data.articleTitle }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">风险等级:</span>
          <el-tag
            :type="getRiskTagType(data.risk_level)"
            style="font-weight: bold"
          >
            {{ getRiskText(data.risk_level) }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">问题来源:</span>
          <el-tag
            :type="getCategoryType(data.category)"
            style="font-weight: bold"
          >
            {{ data.category }}
          </el-tag>
        </div>
      </div>

      <div class="detail-section" v-if="descriptions.length">
        <h4>问题描述</h4>
        <div class="detail-content description-content">
          <div
            v-for="(desc, index) in descriptions"
            :key="index"
            class="description-item"
          >
            <span class="item-number">{{ +index + 1 }}.</span>
            <span class="item-content" v-html="desc"></span>
          </div>
        </div>
      </div>

      <div class="detail-section" v-if="suggestions.length">
        <h4>修改建议</h4>
        <div class="detail-content suggestion">
          <ol class="suggestion-ol">
            <li v-for="(sug, index) in suggestions" :key="index">{{ sug }}</li>
          </ol>
        </div>
      </div>

      <div class="detail-section">
        <h4>相关规范条文</h4>
        <div class="related-article">
          <div class="article-content">
            {{ data.origin || '未找到条文信息' }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button type="primary" @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  data: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const descriptions = computed(() => {
  if (!props.data?.allViolations) return []
  return props.data.allViolations
    .filter((v: any) => v.description)
    .map((v: any) => v.description)
})

const suggestions = computed(() => {
  if (!props.data?.allViolations) return []
  const result: string[] = []
  props.data.allViolations.forEach((v: any) => {
    if (v.suggestion?.length) {
      result.push(...v.suggestion)
    }
  })
  return result
})

const getRiskTagType = (level: string) => {
  const map: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[level] || 'info'
}

const getRiskText = (level: string) => {
  const map: Record<string, string> = {
    high: '重大问题',
    medium: '一般问题',
    low: '轻微问题'
  }
  return map[level] || level
}

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}
</script>

<style scoped>
.violation-detail-dialog {
  max-height: calc(85vh - 120px);
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #f0f0f0;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: bold;
  color: #262626;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  line-height: 1.5;
}

.detail-label {
  font-weight: bold;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.detail-content {
  line-height: 1.6;
  color: #595959;
  font-size: 14px;
}

.detail-content.suggestion {
  color: var(--color-primary-dark);
  padding: 12px;
  border-radius: 4px;
  border-left: 3px solid var(--color-primary-dark);
  background: #f5f5f5;
}

.description-item {
  display: flex;
  margin-bottom: 8px;
  line-height: 1.6;
}

.item-number {
  flex-shrink: 0;
  font-weight: 500;
  margin-right: 8px;
}

.item-content {
  flex: 1;
}

.suggestion-ol {
  margin: 0;
  padding-left: 20px;
}

.suggestion-ol li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.related-article {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 2px solid var(--color-success-dark);
}

.article-content {
  font-size: 14px;
  color: #595959;
  line-height: 1.5;
}
</style>

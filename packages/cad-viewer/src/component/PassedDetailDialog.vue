<template>
  <div v-if="data" class="violation-detail-dialog">
    <div class="detail-section">
      <div class="detail-row">
        <span class="detail-label">检查内容:</span>
        <span>{{ data.articleTitle }}</span>
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

    <div class="detail-section" v-if="data.geometry_ref">
      <h4>图纸位置</h4>
      <div class="violation-geometry">
        <div v-if="data.geometry_ref.extents" class="geometry-info">
          <span>坐标范围：</span>
          <span>
            ({{ data.geometry_ref.extents.min_point.x.toFixed(2) }},
            {{ data.geometry_ref.extents.min_point.y.toFixed(2) }}) - ({{
              data.geometry_ref.extents.max_point.x.toFixed(2)
            }}, {{ data.geometry_ref.extents.max_point.y.toFixed(2) }})
          </span>
        </div>
        <div v-else class="geometry-info">
          <span>坐标范围：</span>
          <span>未提供</span>
        </div>
        <el-button
          type="primary"
          size="small"
          @click="handleLocate"
          :disabled="!data.geometry_ref.extents"
          >定位</el-button
        >
      </div>
    </div>

    <div class="detail-section">
      <h4>相关规范条文</h4>
      <div class="related-article">
        <div class="article-title">{{ data.origin || '未找到条文信息' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'locate', geometryRef: any): void
}>()

const getCategoryType = (category: string) => {
  const map: Record<string, any> = { 设计说明: 'primary', 设计图纸: 'danger' }
  return map[category] || 'info'
}

const handleLocate = () => {
  emit('locate', props.data?.geometry_ref)
  visible.value = false
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
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-label {
  font-weight: bold;
  color: #595959;
  margin-right: 12px;
  flex-shrink: 0;
}

.violation-geometry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
}

.geometry-info {
  font-size: 14px;
  color: #8c8c8c;
  flex: 1;
}

.related-article {
  padding: 12px;
  background: #fafafa;
  border-radius: 4px;
  border-left: 2px solid var(--color-success-dark);
}

.article-title {
  font-weight: 500;
  color: #262626;
  margin-bottom: 8px;
}
</style>

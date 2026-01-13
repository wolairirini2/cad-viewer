<template>
  <div id="app-root">
    <MlCadViewer
      locale="zh"
      base-url="https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/"
      :project-name="projectName"
      preview-url="http://192.168.3.184:8012/onlinePreview?url=aHR0cDovL21pbmlvOjkwMDAvZGVzaWduLXNwZWNzLzIwMjUvMTIvMzAvODY3MjhjMjUtY2MwOS00NThjLThiYjgtYTg2NzZiZTI4NmMzLmRvY3g/WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1taW5pb2FkbWluJTJGMjAyNjAxMTMlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTEzVDA3MTkyNlomWC1BbXotRXhwaXJlcz0zNjAwJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZYLUFtei1TaWduYXR1cmU9YTA3ZDgwMzM5MWM2Y2M5ZTljMTQ1ZTU5ZDFkZDY3ZmIzOWYwMWVhYzA2MDc1ZDdjYmMwZGI0MDZmNDEyOTAyNg=="
      fileName="YB11844S-D101-01-设计说明书.docx"
    />
  </div>
</template>

<script setup lang="ts">
// import { AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import { MlCadViewer } from '@mlightcad/cad-viewer'

const projectName = encodeURIComponent('测试项目变电一次专业')
// import { ref } from 'vue'

// import FileUpload from './components/FileUpload.vue'

// Decide whether to show command line vertical toolbar at the right side,
// performance stats, coordinates in status bar, etc.
// AcApSettingManager.instance.isShowCommandLine = false
// AcApSettingManager.instance.isShowToolbar = false
// AcApSettingManager.instance.isShowStats = false
// AcApSettingManager.instance.isShowCoordinate = false

// State for file selection
// const selectedFile = ref<File | null>(null)

// Handle file selection from upload component
// const handleFileSelect = (file: File) => {
//   selectedFile.value = file
// }
</script>

<style>
* {
  font-family: var(--font-family);
}
#app-root {
  width: 100%;
  height: 100%;
  display: flex;
}

.upload-screen {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: auto; /* Allow clicks on upload screen */
}
</style>

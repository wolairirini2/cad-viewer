<template>
  <div id="app-root">
    <MlCadViewer
      locale="zh"
      url="https://mlightcad.gitlab.io/cad-data/data/anteen.dwg"
      base-url="https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/"
      :project-name="projectName"
    />
  </div>
</template>

<script setup lang="ts">
// import { AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import { MlCadViewer } from '@mlightcad/cad-viewer'

const projectName = encodeURIComponent('测试项目/变电一次')
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

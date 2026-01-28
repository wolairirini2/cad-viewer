<template>
  <div id="app-root">
    <MlCadViewer
      locale="zh"
      base-url="https://cdn.jsdelivr.net/gh/mlightcad/cad-data@main/"
      :project-name="projectName"
      :url="cadUrl"
      :currentFileId="'123'"
      :reviewReportData="reviewReportData"
    />
  </div>
</template>

<script setup lang="ts">
// import { AcApSettingManager } from '@mlightcad/cad-simple-viewer'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import { ref, onMounted } from 'vue'

const projectName = encodeURIComponent('测试项目变电一次专业.dwg')
const cadUrl = ref<string>('')
onMounted(async () => {
  // 使用Blob URL加载CAD文件
  cadUrl.value =
    'http://192.168.3.184:9000/temp/2026/01/15/0df91a45-038a-47ee-8cc0-1cf682117588.dwg'
})

const reviewReportData = ref<any>(null)
reviewReportData.value = {
  rules: [
    {
      code: 'DESIGN-SPEC-001',
      name: '工程设计说明编制规范',
      type: '行业标准',
      articles: [
        {
          id: '0',
          title:
            '检查计量用CT、PT绕组是否独立，二次回路是否专用，端子盒是否可铅封',
          origin: 'DL/T 448-2016',
          content:
            '检查计量用CT、PT绕组是否独立，二次回路是否专用，端子盒是否可铅封',
          violations: []
        },
        {
          id: '1',
          title: '短路电流审查',
          origin: 'GB/T 15544.1-2023',
          content: '短路电流审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: ['检查设计说明中的计算参数是否正确'],
              description:
                '高压侧母线计算值与设计说明差异过大：计算值8.31kA与设计值14.11kA 差异41.1%',
              geometry_ref: {
                chapter:
                  '计算采用短路电流最大的接入方式时的电流值。计算时不考虑康源印染变两台主变低压侧并供。短路电流计算条件如下：\n\n短路电流计算采用标幺制，取基准值分别为Sj=100MVA，Uj1=115kV，Ij1=0.502kA；Uj2=10.5kV，Ij2=5.5kA。\n\n1、220kV延陵变#1主变压器阻抗参数Uk1-2%=9.02，Uk1-3%=34.08，Uk2-3%=22.19；接入点的220kV延陵变110kV母线短路阻抗标幺值考虑220kV系统短路容量为无穷大计算得0.0501。\n\n3、本期规模下，东华铝业变电站主变容量分别为25MVA，短路阻抗为10.5%。\n\n4、线路：从延陵变733间隔至T接部分线路长2.5km，导线型号LGJ-300/25。新建110kV架空线路0.8公里，导线型号1×JL/G1A-300/25。电缆线路0.45公里，电缆型号1×ZC-YJLW03-64/110-1*400mm2。\n\n三相短路电流计算短路阻抗图：\n\n图3.2.1-1 短路阻抗图\n\n本期短路电流计算结果见下表：\n\n表3.2.1-1  稳态短路电流计算结果表\n\n注：表中ich＝2.55I”，Ich＝1.51I”。\n\n经计算江阴东华铝材科技有限公司110kV变电站110kV侧三相最大短路电流为14.11kA，10kV侧三相最大短路电流为12.07kA。\n\n根据短路电流计算结果，对主要设备选择和校验，110kV设备额定开断电流40kA，10kV主变间隔、分段间隔断路器额定开断电流选31.5kA，其余出线柜断路器选择额定开断电流25kA，可满足本工程要求。',
                extents: null,
                file_id: 'cebcfa23-6d10-43f0-b4fb-0530495aac35',
                handles: null
              },
              review_trace: {
                calculation_result: {
                  hv_bus_Isc_ka: 8.31,
                  lv_bus_Isc_ka: 11.45,
                  calculation_steps: [
                    {
                      title: '计算高压侧基准阻抗',
                      formula:
                        '$$Z_{j,hv}=\\frac{U_{hv}^2}{S_{base}}=\\frac{115.0^2}{1000.0}=13.225\\ \\Omega$$'
                    },
                    {
                      title: '计算高压侧基准电流',
                      formula:
                        '$$I_{j,hv}=\\frac{S_{base}}{\\sqrt{3}U_{hv}}=\\frac{1000.0}{\\sqrt{3}\\times115.0}=5.0204\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧基准阻抗',
                      formula:
                        '$$Z_{j,lv}=\\frac{U_{lv}^2}{S_{base}}=\\frac{10.5^2}{1000.0}=0.1103\\ \\Omega$$'
                    },
                    {
                      title: '计算低压侧基准电流',
                      formula:
                        '$$I_{j,lv}=\\frac{S_{base}}{\\sqrt{3}U_{lv}}=\\frac{1000.0}{\\sqrt{3}\\times10.5}=54.9857\\ \\text{kA}$$'
                    },
                    {
                      title: '计算系统电抗标幺值',
                      formula:
                        '$$X^{*}_{sys}=\\frac{S_{base}}{S_{sc}}=\\frac{1000.0}{2222.0}=0.45005$$'
                    },
                    {
                      title: '计算线路电抗有名值',
                      formula:
                        '$$X_{line}=L_{oh}x_{oh}+L_{cab}x_{cab}=4.1\\times0.4+1.0\\times0.12=1.76\\ \\Omega$$'
                    },
                    {
                      title: '计算线路电抗标幺值',
                      formula:
                        '$$X^{*}_{line}=\\frac{X_{line}}{Z_{j,hv}}=\\frac{1.76}{13.225}=0.13308$$'
                    },
                    {
                      title: '计算变压器电抗标幺值',
                      formula:
                        '$$X^{*}_{T}=\\frac{Uk\\%}{100}\\times\\frac{S_{base}}{S_{tr}}=\\frac{10.5}{100}\\times\\frac{1000.0}{20.0}=5.25$$'
                    },
                    {
                      title: '计算高压侧总电抗标幺值',
                      formula:
                        '$$X^{*}_{HV}=X^{*}_{sys}+X^{*}_{line}=0.45005+0.13308=0.58313$$'
                    },
                    {
                      title: '计算高压侧短路电流标幺值',
                      formula:
                        '$$I^{*}_{HV}=\\frac{1}{X^{*}_{HV}}=\\frac{1}{0.58313}=1.7149$$'
                    },
                    {
                      title: '计算高压侧短路电流',
                      formula:
                        '$$I_{k,HV}=I^{*}_{HV}\\times I_{j,hv}=1.7149\\times5.0204=8.61\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧总电抗标幺值',
                      formula:
                        '$$X^{*}_{LV}=X^{*}_{HV}+X^{*}_{T}=0.58313+5.25=5.83313$$'
                    },
                    {
                      title: '计算低压侧短路电流标幺值',
                      formula:
                        '$$I^{*}_{LV}=\\frac{1}{X^{*}_{LV}}=\\frac{1}{5.83313}=0.1714$$'
                    },
                    {
                      title: '计算低压侧短路电流',
                      formula:
                        '$$I_{k,LV}=I^{*}_{LV}\\times I_{j,lv}=0.1714\\times54.9857=9.43\\ \\text{kA}$$'
                    }
                  ],
                  calculation_details: {
                    Ij_hv: 0.502,
                    Ij_lv: 5.4986,
                    Zj_hv: 132.25,
                    Zj_lv: 1.1025,
                    X_line_ohm: 1.374,
                    X_sys_star: 0.05,
                    X_line_star: 0.01039,
                    X_total_hv_star: 0.06039,
                    X_total_lv_star: 0.48039,
                    X_transformer_star: 0.42
                  }
                },
                extracted_parameters: {
                  cable_length_km: 0.45,
                  base_capacity_mva: 100,
                  hv_base_voltage_kv: 115,
                  lv_base_voltage_kv: 10.5,
                  overhead_line_length_km: 3.3,
                  transformer_capacity_mva: 25,
                  normal_supply_hv_bus_Isc_ka: 14.11,
                  normal_supply_lv_bus_Isc_ka: 12.07,
                  transformer_impedance_percent: 10.5,
                  cable_unit_reactance_ohm_per_km: 0.12,
                  system_short_circuit_capacity_mva: 2000,
                  overhead_line_unit_reactance_ohm_per_km: 0.4
                }
              }
            },
            {
              risk_level: 'medium',
              suggestion: ['检查设计说明中的计算参数是否正确'],
              description:
                '低压侧母线计算值与设计说明差异过大：计算值11.45kA与设计值12.07kA 差异5.1%',
              geometry_ref: {
                chapter:
                  '计算采用短路电流最大的接入方式时的电流值。计算时不考虑康源印染变两台主变低压侧并供。短路电流计算条件如下：\n\n短路电流计算采用标幺制，取基准值分别为Sj=100MVA，Uj1=115kV，Ij1=0.502kA；Uj2=10.5kV，Ij2=5.5kA。\n\n1、220kV延陵变#1主变压器阻抗参数Uk1-2%=9.02，Uk1-3%=34.08，Uk2-3%=22.19；接入点的220kV延陵变110kV母线短路阻抗标幺值考虑220kV系统短路容量为无穷大计算得0.0501。\n\n3、本期规模下，东华铝业变电站主变容量分别为25MVA，短路阻抗为10.5%。\n\n4、线路：从延陵变733间隔至T接部分线路长2.5km，导线型号LGJ-300/25。新建110kV架空线路0.8公里，导线型号1×JL/G1A-300/25。电缆线路0.45公里，电缆型号1×ZC-YJLW03-64/110-1*400mm2。\n\n三相短路电流计算短路阻抗图：\n\n图3.2.1-1 短路阻抗图\n\n本期短路电流计算结果见下表：\n\n表3.2.1-1  稳态短路电流计算结果表\n\n注：表中ich＝2.55I”，Ich＝1.51I”。\n\n经计算江阴东华铝材科技有限公司110kV变电站110kV侧三相最大短路电流为14.11kA，10kV侧三相最大短路电流为12.07kA。\n\n根据短路电流计算结果，对主要设备选择和校验，110kV设备额定开断电流40kA，10kV主变间隔、分段间隔断路器额定开断电流选31.5kA，其余出线柜断路器选择额定开断电流25kA，可满足本工程要求。',
                extents: null,
                file_id: 'cebcfa23-6d10-43f0-b4fb-0530495aac35',
                handles: null
              },
              review_trace: {
                calculation_result: {
                  hv_bus_Isc_ka: 8.31,
                  lv_bus_Isc_ka: 11.45,
                  calculation_steps: [
                    {
                      title: '计算高压侧基准阻抗',
                      formula:
                        '$$Z_{j,hv}=\\frac{U_{hv}^2}{S_{base}}=\\frac{115.0^2}{1000.0}=13.225\\ \\Omega$$'
                    },
                    {
                      title: '计算高压侧基准电流',
                      formula:
                        '$$I_{j,hv}=\\frac{S_{base}}{\\sqrt{3}U_{hv}}=\\frac{1000.0}{\\sqrt{3}\\times115.0}=5.0204\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧基准阻抗',
                      formula:
                        '$$Z_{j,lv}=\\frac{U_{lv}^2}{S_{base}}=\\frac{10.5^2}{1000.0}=0.1103\\ \\Omega$$'
                    },
                    {
                      title: '计算低压侧基准电流',
                      formula:
                        '$$I_{j,lv}=\\frac{S_{base}}{\\sqrt{3}U_{lv}}=\\frac{1000.0}{\\sqrt{3}\\times10.5}=54.9857\\ \\text{kA}$$'
                    },
                    {
                      title: '计算系统电抗标幺值',
                      formula:
                        '$$X^{*}_{sys}=\\frac{S_{base}}{S_{sc}}=\\frac{1000.0}{2222.0}=0.45005$$'
                    },
                    {
                      title: '计算线路电抗有名值',
                      formula:
                        '$$X_{line}=L_{oh}x_{oh}+L_{cab}x_{cab}=4.1\\times0.4+1.0\\times0.12=1.76\\ \\Omega$$'
                    },
                    {
                      title: '计算线路电抗标幺值',
                      formula:
                        '$$X^{*}_{line}=\\frac{X_{line}}{Z_{j,hv}}=\\frac{1.76}{13.225}=0.13308$$'
                    },
                    {
                      title: '计算变压器电抗标幺值',
                      formula:
                        '$$X^{*}_{T}=\\frac{Uk\\%}{100}\\times\\frac{S_{base}}{S_{tr}}=\\frac{10.5}{100}\\times\\frac{1000.0}{20.0}=5.25$$'
                    },
                    {
                      title: '计算高压侧总电抗标幺值',
                      formula:
                        '$$X^{*}_{HV}=X^{*}_{sys}+X^{*}_{line}=0.45005+0.13308=0.58313$$'
                    },
                    {
                      title: '计算高压侧短路电流标幺值',
                      formula:
                        '$$I^{*}_{HV}=\\frac{1}{X^{*}_{HV}}=\\frac{1}{0.58313}=1.7149$$'
                    },
                    {
                      title: '计算高压侧短路电流',
                      formula:
                        '$$I_{k,HV}=I^{*}_{HV}\\times I_{j,hv}=1.7149\\times5.0204=8.61\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧总电抗标幺值',
                      formula:
                        '$$X^{*}_{LV}=X^{*}_{HV}+X^{*}_{T}=0.58313+5.25=5.83313$$'
                    },
                    {
                      title: '计算低压侧短路电流标幺值',
                      formula:
                        '$$I^{*}_{LV}=\\frac{1}{X^{*}_{LV}}=\\frac{1}{5.83313}=0.1714$$'
                    },
                    {
                      title: '计算低压侧短路电流',
                      formula:
                        '$$I_{k,LV}=I^{*}_{LV}\\times I_{j,lv}=0.1714\\times54.9857=9.43\\ \\text{kA}$$'
                    }
                  ],
                  calculation_details: {
                    Ij_hv: 0.502,
                    Ij_lv: 5.4986,
                    Zj_hv: 132.25,
                    Zj_lv: 1.1025,
                    X_line_ohm: 1.374,
                    X_sys_star: 0.05,
                    X_line_star: 0.01039,
                    X_total_hv_star: 0.06039,
                    X_total_lv_star: 0.48039,
                    X_transformer_star: 0.42
                  }
                },
                extracted_parameters: {
                  cable_length_km: 0.45,
                  base_capacity_mva: 100,
                  hv_base_voltage_kv: 115,
                  lv_base_voltage_kv: 10.5,
                  overhead_line_length_km: 3.3,
                  transformer_capacity_mva: 25,
                  normal_supply_hv_bus_Isc_ka: 14.11,
                  normal_supply_lv_bus_Isc_ka: 12.07,
                  transformer_impedance_percent: 10.5,
                  cable_unit_reactance_ohm_per_km: 0.12,
                  system_short_circuit_capacity_mva: 2000,
                  overhead_line_unit_reactance_ohm_per_km: 0.4
                }
              }
            }
          ]
        }
      ],
      category: '设计说明'
    }
  ],
  discipline_id: 'cebcfa23-6d10-43f0-b4fb-0530495aac35'
}
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

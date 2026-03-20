<template>
  <div id="app-root">
    <MlCadViewer
      locale="zh"
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
          title: '短路电流审查',
          origin: 'GB/T 15544.1-2023',
          content: '短路电流审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: ['检查设计说明中的高压母线侧短路电流计算是否正确'],
              description:
                '高压侧母线计算值与设计说明差异过大：计算值8.61kA与设计值9.63kA 差异10.6%',
              geometry_ref: {
                chapter:
                  '按照《城市电力网规划设计导则》要求,为了取得合理的经济效益,各级电压的短路容量应该从网络设计、电压等级、变压器容量、短路阻抗和运行方式等多方面控制,使各级电压断路器的开断电流以及设备的动稳定电流得到配合,并根据计算结果进行设备选择及校验。\n\n220kV七里庙变2008年最大方式下110kV短路容量为2221MVA，新建架空线路8.30km，导线型号LGJ-300，电缆线路1.0km，电缆采用单芯400mm2；220kV福前变2008年最大方式下110kV短路容量为2222MVA，新建架空线路4.10km，导线型号LGJ-300，电缆线路1.0km，电缆采用单芯400mm2。\n\n根据《电力工程电气设计手册》电气一次部分中短路电流计算条件的一般规定：确定短路电流时，应按可能发生最大短路电流的正常接线方式，而不应按仅在切换过程中可能并列运行的接线方式。\n\n根据上述情况，本期短路电流计算按较大的接入方式即福前变供电情况下计算。\n\n本设计按照如下的条件计算：\n\n1、220kV福前变至110kV彩虹平板变电站的110kV架空线路长度为4.10km，导线型号为LGJ-300。电缆长度1.0km，电缆为单芯400 mm2。\n\n2、主变容量为20MVA，主变短路阻抗按Uk%=10.5计算。\n\n3、基准容量Sj＝1000MVA，基准电压Uj=115kV，Uj=10.5kV\n\n正常供电情况下计算阻抗图如下（已归算为标么值）:\n\n计算结果\n\n经计算，得到如下的110kV彩虹平板变电站三相短路电流值：\n\n变电站110kV母线短路电流：I1”=9.626kA,\n\n变电站10kV母线短路电流: I2”=9.429kA。\n\n合环运行情况下计算阻抗图如下（已归算为标么值）:\n\n经计算，得到如下的110kV彩虹平板变电站三相短路电流值：\n\n变电站110kV母线短路电流：I1”=14.50kA,\n\n变电站10kV母线短路电流: I2”=18.51kA。\n\n设备选择时按正常供电情况考虑。',
                extents: null,
                file_id: 'cdbff4a3-0233-46e2-97d9-444326aed3fb',
                handles: null
              },
              review_trace: {
                defaults_applied: {
                  cable_unit_reactance_ohm_per_km: 0.12,
                  overhead_line_unit_reactance_ohm_per_km: 0.4
                },
                calculation_result: {
                  hv_bus_Isc_ka: 8.6095,
                  lv_bus_Isc_ka: 9.4265,
                  calculation_steps: [
                    {
                      title: '计算高压侧基准电流',
                      formula:
                        '$$I_{B}^{(高)}=\\frac{S_{B}}{\\sqrt{3} \\cdot U_{B}^{(高)}}=\\frac{1000.0\\ \\text{MVA}}{\\sqrt{3}\\times115.0\\ \\text{kV}}=5.0204\\ \\text{kA}$$'
                    },
                    {
                      title: '计算高压侧基准电抗',
                      formula:
                        '$$X_{B}^{(高)}=\\frac{\\left(U_{B}^{(高)}\\right)^2}{S_{B}}=\\frac{(115.0\\ \\text{kV})^2}{1000.0\\ \\text{MVA}}=13.225\\ \\Omega$$'
                    },
                    {
                      title: '计算低压侧基准电流',
                      formula:
                        '$$I_{B}^{(低)}=\\frac{S_{B}}{\\sqrt{3} \\cdot U_{B}^{(低)}}=\\frac{1000.0\\ \\text{MVA}}{\\sqrt{3}\\times10.5\\ \\text{kV}}=54.9857\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧基准电抗',
                      formula:
                        '$$X_{B}^{(低)}=\\frac{\\left(U_{B}^{(低)}\\right)^2}{S_{B}}=\\frac{(10.5\\ \\text{kV})^2}{1000.0\\ \\text{MVA}}=0.1103\\ \\Omega$$'
                    },
                    {
                      title: '计算系统电抗标幺值',
                      formula:
                        '$$X_{\\mathrm{s}{*}}=\\frac{S_{B}}{S_{\\mathrm{k}}^{\\prime\\prime}}=\\frac{1000.0\\ \\text{MVA}}{2222.0\\ \\text{MVA}}=0.45$$'
                    },
                    {
                      title: '计算线路电抗有名值',
                      formula:
                        '$$X_{\\mathrm{有名值}}=L_{\\mathrm{架空}}\\times x_{\\mathrm{架空}}+L_{\\mathrm{电缆}}\\times x_{\\mathrm{电缆}}=4.1\\ \\text{km}\\times0.4\\ \\Omega/\\text{km}+1.0\\ \\text{km}\\times0.12\\ \\Omega/\\text{km}=1.76\\ \\Omega$$'
                    },
                    {
                      title: '计算线路电抗标幺值',
                      formula:
                        '$$X_{\\ell{*}}=\\frac{X_{\\mathrm{有名值}}}{X_{B}^{(高)}}=\\frac{1.76\\ \\Omega}{13.225\\ \\Omega}=0.1331$$'
                    },
                    {
                      title: '计算变压器电抗标幺值',
                      formula:
                        '$$X_{\\mathrm{b}{*}}=\\frac{U_{k}{(\\%)}}{100}\\times\\frac{S_{B}}{S_{\\mathrm{N}}}=\\frac{10.5\\ \\%}{100}\\times\\frac{1000.0\\ \\text{MVA}}{20.0\\ \\text{MVA}}=5.25$$'
                    },
                    {
                      title: '计算高压侧总电抗标幺值',
                      formula:
                        '$$X_{\\Sigma*}^{(高)}=X_{\\mathrm{s*}}+X_{\\mathrm{L}{*}}=0.45+0.1331=0.5831$$'
                    },
                    {
                      title: '计算高压侧短路电流',
                      formula:
                        '$$I_{d}^{(高)}= \\frac{1}{X_{\\Sigma*}^{(高)}} \\times I_{B}^{(高)}=\\frac{1}{0.5831} \\times5.0204\\ \\text{kA}=8.6095\\ \\text{kA}$$'
                    },
                    {
                      title: '计算低压侧总电抗标幺值',
                      formula:
                        '$$X_{\\Sigma}^{(低)*}=X_{\\mathrm{s*}}+X_{\\mathrm{L}{*}}+X_{\\mathrm{b}^{*}}=0.45+0.1331+5.25=5.8331$$'
                    },
                    {
                      title: '计算低压侧短路电流',
                      formula:
                        '$$I_{d}^{(低)}= \\frac{1}{X_{\\Sigma*}^{(低)}} \\times I_{B}^{(低)}=\\frac{1}{5.8331} \\times54.9857\\ \\text{kA}=9.4265\\ \\text{kA}$$'
                    }
                  ],
                  calculation_details: {
                    Ij_hv: 5.0204,
                    Ij_lv: 54.9857,
                    Zj_hv: 13.225,
                    Zj_lv: 0.1103,
                    X_line_ohm: 1.76,
                    X_sys_star: 0.45,
                    X_line_star: 0.1331,
                    X_total_hv_star: 0.5831,
                    X_total_lv_star: 5.8331,
                    X_transformer_star: 5.25
                  }
                },
                extracted_parameters: {
                  cable_length_km: 1,
                  base_capacity_mva: 1000,
                  hv_base_voltage_kv: 115,
                  lv_base_voltage_kv: 10.5,
                  overhead_line_length_km: 4.1,
                  transformer_capacity_mva: 20,
                  normal_supply_hv_bus_Isc_ka: 9.626,
                  normal_supply_lv_bus_Isc_ka: 9.429,
                  transformer_impedance_percent: 10.5,
                  cable_unit_reactance_ohm_per_km: 0.12,
                  upstream_short_circuit_capacity_mva: 2222,
                  upstream_main_transformer_capacity_mva: null,
                  overhead_line_unit_reactance_ohm_per_km: 0.4,
                  upstream_main_transformer_impedance_percent: null
                },
                comparison_groups: [
                  {
                    items: [
                      {
                        result: '数量不一致',
                        diagram_count: 2,
                        diagram_model:
                          'SZ11-20000/110\n110±8*1.25%/10.5kV\nYN.d11\nUk%=10.5\n口口口口口口',
                        model_matched: true,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            -191798.22062829687, -148258.29517052922,
                            -191756.51480293984, -148163.64864823624
                          ],
                          [
                            -191563.66991816933, -148258.29517052922,
                            -191521.9640928123, -148163.64864823624
                          ]
                        ],
                        equipment_list_count: 3,
                        equipment_list_model:
                          'SZ11-20000/110  110±8×1.25%/10.5kV  20000kVA  \nYN,d11  容量比100/100  Uk%=10.5\n附：高压中性点LRB-60 100/5A  一只\n高压及中性点套管泄漏比距≥2.5cm/kV(按系统最高电压，下同)\n低压套管泄漏比距≥3.1cm/kV\n中性点绝缘水平   BIL 325kV \nSIL 140kV\n有载调压开关选用MR系列，额定电流 300A，档数 9档  配电动操作机构，另附发信号用温度计和测温元件PT100；远方监测装置及全套附件，变压器本体油枕装设油位发送器一只，瓦斯继电器一只，压力释放阀一只；,有载调压开关油枕装设油位发送器一只，瓦斯继电器一只。\n不带滚轮小车'
                      },
                      {
                        result: '数量不一致',
                        diagram_count: 2,
                        diagram_model:
                          'SZ11-20000/110\n110±8*1.25%/10.5kV\nYN.d11\nUk%=10.5\n口口口口口口',
                        model_matched: true,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            -191798.22062829687, -148258.29517052922,
                            -191756.51480293984, -148163.64864823624
                          ],
                          [
                            -191563.66991816933, -148258.29517052922,
                            -191521.9640928123, -148163.64864823624
                          ]
                        ],
                        equipment_list_count: 3,
                        equipment_list_model:
                          'SZ11-20000/110  110±8×1.25%/10.5kV  20000kVA  \nYN,d11  容量比100/100  Uk%=10.5\n附：高压中性点LRB-60 100/5A  一只\n高压及中性点套管泄漏比距≥2.5cm/kV(按系统最高电压，下同)\n低压套管泄漏比距≥3.1cm/kV\n中性点绝缘水平   BIL 325kV \nSIL 140kV\n有载调压开关选用MR系列，额定电流 300A，档数 9档  配电动操作机构，另附发信号用温度计和测温元件PT100；远方监测装置及全套附件，变压器本体油枕装设油位发送器一只，瓦斯继电器一只，压力释放阀一只；,有载调压开关油枕装设油位发送器一只，瓦斯继电器一只。\n不带滚轮小车'
                      }
                    ],
                    equipment_name: '电力变压器'
                  },
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '中性点隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          'GW13-72.5(W)/630A  630A/31.5kA\n附：电动操作机构  电机电源AC380V  控制电源AC220V\n绝缘爬电比距≥3.1cm/kV'
                      }
                    ],
                    equipment_name: '中性点隔离开关'
                  },
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '断路器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 7,
                        equipment_list_model: '1250A，31.5kA/4s'
                      }
                    ],
                    equipment_name: '断路器'
                  }
                ]
              }
            }
          ]
        }
      ],
      category: '设计说明'
    }
  ],
  discipline_id: 'cdbff4a3-0233-46e2-97d9-444326aed3fb'
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

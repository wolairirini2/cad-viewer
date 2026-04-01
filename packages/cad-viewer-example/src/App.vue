<template>
  <div id="app-root">
    <MlCadViewer
      locale="zh"
      :project-name="projectName"
      :url="cadUrl"
      :currentFileId="'52abc84b-eb98-44c3-b751-7b73dc77a245'"
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
      code: 'EQUIP-COMP-001',
      name: '设备清册与主接线图一致性规范',
      type: '企业标准',
      articles: [
        {
          id: 'equipment_comparison_result',
          title: '设备材料清册与主接线图对比结果',
          origin: '基于设备名称分组、型号相似度匹配与数量一致性校核。',
          content: '返回设备材料清册与主接线图的设备型号和数量对比结果。',
          violations: [
            {
              risk_level: 'high',
              suggestion: [],
              description:
                '已完成设备材料清册与主接线图自动比对，未发现数量不一致。',
              geometry_ref: {
                chapter: null,
                extents: {
                  max_point: {
                    x: -302984.677123469,
                    y: 225665.3659325138
                  },
                  min_point: {
                    x: -394484.294794503,
                    y: 174087.4868022078
                  }
                },
                file_id: '0d9cacf6-9841-4493-a086-0d022584f8a7',
                handles: null
              },
              review_trace: {
                errors: [],
                assistant_text: null,
                cad_manifest_path: null,
                comparison_groups: [
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model: 'LRB-110 200~600/5A 10P30'
                      },
                      {
                        result: '图纸缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model: 'LR-110 200~600/5A 0.5/0.2S'
                      }
                    ],
                    equipment_name: '电流互感器'
                  },
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '最高电压72.5kV，额定电流630A，爬电距离2248mm，配电动操作机构'
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model:
                          '隔离刀闸 3150A 40kA/3s\n接地刀闸 40kA/3s',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            -325945.91341731785, 218443.8472716925,
                            -325438.3416984018, 219194.76289282684
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '隔离开关'
                  },
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model: '百兆、16光口；千兆、4光口'
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model:
                          'SZ20-63000/110\n110±8x1.25%/10.5kV\n63000/63000kVA\nYNd11\nUk%=17\n附有载调压开关',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -310629.2991234272, 205027.13027179133,
                            -308767.40898671956, 207775.2224719691
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '#3主变进线',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -392192.046583206, 205039.79882758227,
                            -390300.05739728536, 207782.9416438829
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '同\n#1\n主\n变',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -358515.29699257767, 205056.99193927913,
                            -357457.1811264507, 207750.02211835785
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '#1主变',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -336655.68777764344, 221312.5518780552,
                            -335588.27776455175, 222789.69215878684
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '#2主变',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -372867.744065393, 221312.82106541854,
                            -371785.9730852571, 222777.10822983188
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '#2主变进线分支1',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -354820.9941594858, 198726.6406411708,
                            -353329.98235468566, 200381.74595109522
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '#3主变备用',
                        model_matched: false,
                        equipment_name: '主变压器',
                        diagram_world_bboxes: [
                          [
                            -378451.3479433866, 221329.55798263717,
                            -377406.6467167868, 222831.58332085138
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '主变压器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 5,
                        diagram_model:
                          '隔离刀闸 3150A 40kA/3s\n接地刀闸 40kA/3s',
                        model_matched: false,
                        equipment_name: '接地开关',
                        diagram_world_bboxes: [
                          [
                            -342321.2684608885, 221998.2639963049,
                            -341915.2756380271, 223084.17585723274
                          ],
                          [
                            -341475.67675521807, 221998.5937210268,
                            -341073.58965844545, 223085.73816021485
                          ],
                          [
                            -340621.5047415499, 221998.643781972,
                            -340212.15626703354, 223081.0036996439
                          ],
                          [
                            -369265.63508439035, 216281.25337664224,
                            -368869.2090148063, 217333.53143394698
                          ],
                          [
                            -343163.5790417246, 221997.3706781847,
                            -342753.415132125, 223072.36398348177
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '接地开关'
                  }
                ],
                annotated_image_path: null,
                equipment_list_devices: [
                  {
                    name: '电流互感器',
                    count: 6,
                    model: 'LRB-110 200~600/5A 10P30'
                  },
                  {
                    name: '电流互感器',
                    count: 6,
                    model: 'LR-110 200~600/5A 0.5/0.2S'
                  },
                  {
                    name: '隔离开关',
                    count: 2,
                    model:
                      '最高电压72.5kV，额定电流630A，爬电距离2248mm，配电动操作机构'
                  },
                  {
                    name: '主变压器',
                    count: 2,
                    model: '百兆、16光口；千兆、4光口'
                  }
                ],
                wiring_diagram_devices: [
                  {
                    name: '主变压器',
                    count: 1,
                    model:
                      'SZ20-63000/110\n110±8x1.25%/10.5kV\n63000/63000kVA\nYNd11\nUk%=17\n附有载调压开关',
                    evidence_world_bboxes: [
                      [
                        -310629.2991234272, 205027.13027179133,
                        -308767.40898671956, 207775.2224719691
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '#3主变进线',
                    evidence_world_bboxes: [
                      [
                        -392192.046583206, 205039.79882758227,
                        -390300.05739728536, 207782.9416438829
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '同\n#1\n主\n变',
                    evidence_world_bboxes: [
                      [
                        -358515.29699257767, 205056.99193927913,
                        -357457.1811264507, 207750.02211835785
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '#1主变',
                    evidence_world_bboxes: [
                      [
                        -336655.68777764344, 221312.5518780552,
                        -335588.27776455175, 222789.69215878684
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '#2主变',
                    evidence_world_bboxes: [
                      [
                        -372867.744065393, 221312.82106541854,
                        -371785.9730852571, 222777.10822983188
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '#2主变进线分支1',
                    evidence_world_bboxes: [
                      [
                        -354820.9941594858, 198726.6406411708,
                        -353329.98235468566, 200381.74595109522
                      ]
                    ]
                  },
                  {
                    name: '主变压器',
                    count: 1,
                    model: '#3主变备用',
                    evidence_world_bboxes: [
                      [
                        -378451.3479433866, 221329.55798263717,
                        -377406.6467167868, 222831.58332085138
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 1,
                    model: '隔离刀闸 3150A 40kA/3s\n接地刀闸 40kA/3s',
                    evidence_world_bboxes: [
                      [
                        -325945.91341731785, 218443.8472716925,
                        -325438.3416984018, 219194.76289282684
                      ]
                    ]
                  },
                  {
                    name: '接地开关',
                    count: 5,
                    model: '隔离刀闸 3150A 40kA/3s\n接地刀闸 40kA/3s',
                    evidence_world_bboxes: [
                      [
                        -342321.2684608885, 221998.2639963049,
                        -341915.2756380271, 223084.17585723274
                      ],
                      [
                        -341475.67675521807, 221998.5937210268,
                        -341073.58965844545, 223085.73816021485
                      ],
                      [
                        -340621.5047415499, 221998.643781972,
                        -340212.15626703354, 223081.0036996439
                      ],
                      [
                        -369265.63508439035, 216281.25337664224,
                        -368869.2090148063, 217333.53143394698
                      ],
                      [
                        -343163.5790417246, 221997.3706781847,
                        -342753.415132125, 223072.36398348177
                      ]
                    ]
                  }
                ]
              }
            }
          ]
        }
      ],
      category: '设备材料清册'
    },
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
                chapter: null,
                extents: {
                  max_point: {
                    x: -191521.9640928123,
                    y: -148163.64864823624
                  },
                  min_point: {
                    x: -191798.22062829687,
                    y: -148258.29517052922
                  }
                },
                file_id: '52abc84b-eb98-44c3-b751-7b73dc77a245',
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
      category: '设备材料清册'
    },
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
              suggestion: [
                "在设计说明的'短路电流计算'章节中补充以下参数：架空线路长度, 电缆线路长度, 系统短路容量, 上级系统主变压器容量, 上级系统主变压器短路阻抗比"
              ],
              description: '缺少短路电流计算的关键参数，无法进行计算验证。',
              geometry_ref: {
                chapter:
                  '泰州鸿庆变110kV进线2回，其中1回接入220kV通园变、1回接入220kV洋思变。\n\n查得220kV通园变110kV母线大方式下正序阻抗标幺值为0.0457，远景大方式下正序阻抗标幺值为0.013；线路阻抗标幺值为XL*=0.043；220kV洋思变110kV母线大方式下正序阻抗标幺值为0.0734，远景大方式下正序阻抗标幺值为0.013，线路阻抗标幺值为XL*=0.045。本站短路电流计算以通园变馈供为依据。\n\n1号、2号主变压器容量均为63MVA，主变阻抗电压Uk=17%，主变计算阻抗标幺值Xb*=0.27。\n\n本期各电路元件阻抗见下图，图中阻抗均已归算为基准容量为100MVA的标幺值。\n\n图3.2-1 短路电流计算阻抗图\n\n（1）本期短路电流计算结果见表3.2-2。\n\n表3.2-2 本期短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 5.66 | 14.43\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 15.33 | 39.09\n\n（2）远景短路电流计算\n\n远景鸿庆变电源来自220kV变电站。\n\n1）该220kV变电站110kV母线远景阻抗为0.013(标幺值)。\n\n2）110千伏鸿庆变电站主变压器容量为63MVA（Uk=17%），计算阻抗标幺值Xb*=0.27。\n\n3）不考虑110kV侧电源并列对本站供电，本站低压侧为无电源的负荷端。\n\n4）鸿庆变10kV侧母线在正常情况下按照分列运行方式考虑。\n\n远景各电路元件阻抗见图3.2-1，图中阻抗均按照基准电压为系统平均额定电压、基准容量为100MVA归算后的标幺值。\n\n远景短路电流计算结果见表3.2-2。\n\n表3.2-2   远景短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 8.93 | 22.77\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 16.87 | 43.01\n\n根据短路电流计算，本期及远景110kV和10kV侧短路电流均可控制在40kA、31.5kA以下。结合国网2026年版通用设备，本工程110kV、10kV设备短路电流水平按40kA、31.5kA选择。',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                defaults_applied: {
                  cable_unit_reactance_ohm_per_km: 0.12,
                  overhead_line_unit_reactance_ohm_per_km: 0.4
                },
                extracted_parameters: {
                  cable_length_km: null,
                  base_capacity_mva: 100,
                  hv_base_voltage_kv: 115,
                  lv_base_voltage_kv: 10.5,
                  overhead_line_length_km: null,
                  transformer_capacity_mva: 63,
                  normal_supply_hv_bus_Isc_ka: 5.66,
                  normal_supply_lv_bus_Isc_ka: 15.33,
                  transformer_impedance_percent: 17,
                  cable_unit_reactance_ohm_per_km: 0.12,
                  upstream_short_circuit_capacity_mva: null,
                  upstream_main_transformer_capacity_mva: null,
                  overhead_line_unit_reactance_ohm_per_km: 0.4,
                  upstream_main_transformer_impedance_percent: null
                },
                extracted_parameters_map: {
                  cable_length_km: '电缆长度 (km)',
                  base_capacity_mva: '基准容量 (MVA)',
                  hv_base_voltage_kv: '高压侧基准电压 (kV)',
                  lv_base_voltage_kv: '低压侧基准电压 (kV)',
                  overhead_line_length_km: '架空线长度 (km)',
                  transformer_capacity_mva: '变压器容量 (MVA)',
                  transformer_impedance_percent: '变压器短路阻抗百分比 (%)',
                  cable_unit_reactance_ohm_per_km: '电缆单位电抗 (Ω/km)',
                  upstream_short_circuit_capacity_mva: '上级系统短路容量 (MVA)',
                  upstream_main_transformer_capacity_mva:
                    '上级系统主变容量 (MVA)',
                  overhead_line_unit_reactance_ohm_per_km:
                    '架空线单位电抗 (Ω/km)',
                  upstream_main_transformer_impedance_percent:
                    '上级系统主变短路阻抗百分比 (%)'
                }
              }
            }
          ]
        },
        {
          id: '1',
          title: '断路器：最高工作电压审查',
          origin: 'GB/T 156-2017',
          content: '断路器设备最高工作电压审查',
          violations: [
            {
              risk_level: 'medium',
              suggestion: [
                '补充该设备的 stardard_voltage（标称电压）和 maximum_voltage（最高工作电压）。'
              ],
              description:
                '设备“SF6断路器”缺少标称电压或最高工作电压，无法完成 GB/T 156-2017 校核。',
              geometry_ref: {
                chapter:
                  '序号 | 短路点编号 | 计 算 值 | 计 算 值 | 计 算 值 | 计 算 值 | 断路器型式 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 备  注\n序号 | 短路点编号 | 标称电压 | 工作电流 | 热稳定电流值 | 短路电流冲击值 | 断路器型式 | 额定电压 | 额定电流 | 额定开断电流 | 热稳定电流 | 极限通过电流峰值 | 备  注\n序号 | 短路点编号 | (kV) | (A) | (kA) | (kA) | 断路器型式 | (kV) | (A) | (kA) | (kA/s) | (kA) | 备  注\n1 | k1 | 110 | 551 | 8.93 | 222.77 | SF6断路器 | 126 | 3150 | 40 | 7/3 | 100 | \n2 | k2 | 10 | 3031 | 16.87 | 43.01 | 真空断路器 | 12 | 4000 | 40 | 40/4 | 100 | 主变、分段\n2 | k2 | 10 | 600 | 16.87 | 43.01 | 真空断路器 | 12 | 1250 | 31.5 | 31.5/4 | 80 | 出线、电容器',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: '断路器额定电压126kV与系统标称电压110kV不匹配',
                  device_name: 'SF6断路器',
                  is_compliant: '否',
                  maximum_voltage: null,
                  stardard_voltage: 110
                },
                gb_t_156_mapping: {
                  '6.0': 7.2,
                  '10.0': 12,
                  '35.0': 40.5,
                  '110.0': 126,
                  '220.0': 252
                }
              }
            },
            {
              risk_level: 'medium',
              suggestion: [
                '补充该设备的 stardard_voltage（标称电压）和 maximum_voltage（最高工作电压）。'
              ],
              description:
                '设备“真空断路器”缺少标称电压或最高工作电压，无法完成 GB/T 156-2017 校核。',
              geometry_ref: {
                chapter:
                  '序号 | 短路点编号 | 计 算 值 | 计 算 值 | 计 算 值 | 计 算 值 | 断路器型式 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 备  注\n序号 | 短路点编号 | 标称电压 | 工作电流 | 热稳定电流值 | 短路电流冲击值 | 断路器型式 | 额定电压 | 额定电流 | 额定开断电流 | 热稳定电流 | 极限通过电流峰值 | 备  注\n序号 | 短路点编号 | (kV) | (A) | (kA) | (kA) | 断路器型式 | (kV) | (A) | (kA) | (kA/s) | (kA) | 备  注\n1 | k1 | 110 | 551 | 8.93 | 222.77 | SF6断路器 | 126 | 3150 | 40 | 7/3 | 100 | \n2 | k2 | 10 | 3031 | 16.87 | 43.01 | 真空断路器 | 12 | 4000 | 40 | 40/4 | 100 | 主变、分段\n2 | k2 | 10 | 600 | 16.87 | 43.01 | 真空断路器 | 12 | 1250 | 31.5 | 31.5/4 | 80 | 出线、电容器',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: '断路器额定电压12kV与系统标称电压10kV不匹配',
                  device_name: '真空断路器',
                  is_compliant: '否',
                  maximum_voltage: null,
                  stardard_voltage: 10
                },
                gb_t_156_mapping: {
                  '6.0': 7.2,
                  '10.0': 12,
                  '35.0': 40.5,
                  '110.0': 126,
                  '220.0': 252
                }
              }
            },
            {
              risk_level: 'medium',
              suggestion: [
                '补充该设备的 stardard_voltage（标称电压）和 maximum_voltage（最高工作电压）。'
              ],
              description:
                '设备“真空断路器”缺少标称电压或最高工作电压，无法完成 GB/T 156-2017 校核。',
              geometry_ref: {
                chapter:
                  '序号 | 短路点编号 | 计 算 值 | 计 算 值 | 计 算 值 | 计 算 值 | 断路器型式 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 保 证 值 | 备  注\n序号 | 短路点编号 | 标称电压 | 工作电流 | 热稳定电流值 | 短路电流冲击值 | 断路器型式 | 额定电压 | 额定电流 | 额定开断电流 | 热稳定电流 | 极限通过电流峰值 | 备  注\n序号 | 短路点编号 | (kV) | (A) | (kA) | (kA) | 断路器型式 | (kV) | (A) | (kA) | (kA/s) | (kA) | 备  注\n1 | k1 | 110 | 551 | 8.93 | 222.77 | SF6断路器 | 126 | 3150 | 40 | 7/3 | 100 | \n2 | k2 | 10 | 3031 | 16.87 | 43.01 | 真空断路器 | 12 | 4000 | 40 | 40/4 | 100 | 主变、分段\n2 | k2 | 10 | 600 | 16.87 | 43.01 | 真空断路器 | 12 | 1250 | 31.5 | 31.5/4 | 80 | 出线、电容器',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: '断路器额定电压12kV与系统标称电压10kV不匹配',
                  device_name: '真空断路器',
                  is_compliant: '否',
                  maximum_voltage: null,
                  stardard_voltage: 10
                },
                gb_t_156_mapping: {
                  '6.0': 7.2,
                  '10.0': 12,
                  '35.0': 40.5,
                  '110.0': 126,
                  '220.0': 252
                }
              }
            }
          ]
        },
        {
          id: '3',
          title: '断路器：短路电流冲击值（即动稳定电流峰值）审查',
          origin: 'GB/T 15544.1-2023',
          content: '断路器设备短路电流冲击值（即动稳定电流峰值）审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                '按公式 i_peak=√2×k×I_0s 重新校核该设备短路电流冲击值，并核对0秒短路电流周期分量 8.93kA 及冲击系数 1.80 的取值依据。'
              ],
              description:
                '设备“110kV SF6断路器”短路电流冲击值与公式计算值差异过大：计算值 22.73kA，设计值 222.77kA，差异 89.8%。',
              geometry_ref: {
                chapter:
                  '泰州鸿庆变110kV进线2回，其中1回接入220kV通园变、1回接入220kV洋思变。\n\n查得220kV通园变110kV母线大方式下正序阻抗标幺值为0.0457，远景大方式下正序阻抗标幺值为0.013；线路阻抗标幺值为XL*=0.043；220kV洋思变110kV母线大方式下正序阻抗标幺值为0.0734，远景大方式下正序阻抗标幺值为0.013，线路阻抗标幺值为XL*=0.045。本站短路电流计算以通园变馈供为依据。\n\n1号、2号主变压器容量均为63MVA，主变阻抗电压Uk=17%，主变计算阻抗标幺值Xb*=0.27。\n\n本期各电路元件阻抗见下图，图中阻抗均已归算为基准容量为100MVA的标幺值。\n\n图3.2-1 短路电流计算阻抗图\n\n（1）本期短路电流计算结果见表3.2-2。\n\n表3.2-2 本期短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 5.66 | 14.43\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 15.33 | 39.09\n\n（2）远景短路电流计算\n\n远景鸿庆变电源来自220kV变电站。\n\n1）该220kV变电站110kV母线远景阻抗为0.013(标幺值)。\n\n2）110千伏鸿庆变电站主变压器容量为63MVA（Uk=17%），计算阻抗标幺值Xb*=0.27。\n\n3）不考虑110kV侧电源并列对本站供电，本站低压侧为无电源的负荷端。\n\n4）鸿庆变10kV侧母线在正常情况下按照分列运行方式考虑。\n\n远景各电路元件阻抗见图3.2-1，图中阻抗均按照基准电压为系统平均额定电压、基准容量为100MVA归算后的标幺值。\n\n远景短路电流计算结果见表3.2-2。\n\n表3.2-2   远景短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 8.93 | 22.77\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 16.87 | 43.01\n\n根据短路电流计算，本期及远景110kV和10kV侧短路电流均可控制在40kA、31.5kA以下。结合国网2026年版通用设备，本工程110kV、10kV设备短路电流水平按40kA、31.5kA选择。',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: 'k1点',
                  device_name: '110kV SF6断路器',
                  shock_coefficient: null,
                  short_circuit_current_0s: 8.93,
                  short_circuit_shock_value: 222.77
                },
                formula: 'i_peak = sqrt(2) * k * I_0s',
                formula_units: {
                  shock_coefficient: '-',
                  short_circuit_current_0s: 'kA',
                  short_circuit_shock_value: 'kA'
                },
                defaults_applied: {
                  shock_coefficient: 1.8
                },
                tolerance_percent: 5,
                calculation_result: {
                  difference_percent: 89.7957,
                  declared_short_circuit_shock_value: 222.77,
                  calculated_short_circuit_shock_value: 22.7321
                }
              }
            }
          ]
        },
        {
          id: '4',
          title: '断路器：t秒热稳定电流审查',
          origin: 'GB/T 15544.1-2023',
          content: '断路器设备t秒热稳定电流审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                '按热稳定校验原则，确保设备“110kV SF6断路器”的实际t秒热稳定电流大于等于理论短路电流周期分量，并复核设备选型参数。'
              ],
              description:
                '设备“110kV SF6断路器”t秒热稳定电流不足以满足理论短路电流周期分量要求：实际t秒热稳定电流 7.00kA，理论短路电流周期分量 8.93kA，不足 21.6%。',
              geometry_ref: {
                chapter:
                  '泰州鸿庆变110kV进线2回，其中1回接入220kV通园变、1回接入220kV洋思变。\n\n查得220kV通园变110kV母线大方式下正序阻抗标幺值为0.0457，远景大方式下正序阻抗标幺值为0.013；线路阻抗标幺值为XL*=0.043；220kV洋思变110kV母线大方式下正序阻抗标幺值为0.0734，远景大方式下正序阻抗标幺值为0.013，线路阻抗标幺值为XL*=0.045。本站短路电流计算以通园变馈供为依据。\n\n1号、2号主变压器容量均为63MVA，主变阻抗电压Uk=17%，主变计算阻抗标幺值Xb*=0.27。\n\n本期各电路元件阻抗见下图，图中阻抗均已归算为基准容量为100MVA的标幺值。\n\n图3.2-1 短路电流计算阻抗图\n\n（1）本期短路电流计算结果见表3.2-2。\n\n表3.2-2 本期短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 5.66 | 14.43\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 15.33 | 39.09\n\n（2）远景短路电流计算\n\n远景鸿庆变电源来自220kV变电站。\n\n1）该220kV变电站110kV母线远景阻抗为0.013(标幺值)。\n\n2）110千伏鸿庆变电站主变压器容量为63MVA（Uk=17%），计算阻抗标幺值Xb*=0.27。\n\n3）不考虑110kV侧电源并列对本站供电，本站低压侧为无电源的负荷端。\n\n4）鸿庆变10kV侧母线在正常情况下按照分列运行方式考虑。\n\n远景各电路元件阻抗见图3.2-1，图中阻抗均按照基准电压为系统平均额定电压、基准容量为100MVA归算后的标幺值。\n\n远景短路电流计算结果见表3.2-2。\n\n表3.2-2   远景短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 8.93 | 22.77\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 16.87 | 43.01\n\n根据短路电流计算，本期及远景110kV和10kV侧短路电流均可控制在40kA、31.5kA以下。结合国网2026年版通用设备，本工程110kV、10kV设备短路电流水平按40kA、31.5kA选择。',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: 'k1短路点，额定开断电流40kA',
                  t_seconds: 3,
                  device_name: '110kV SF6断路器',
                  thermal_stable_current: 7,
                  short_circuit_current_0s: 8.93
                },
                formula: 'I_thermal_actual(t) >= I_0s_theoretical',
                formula_scope: '无穷大电源供电系统热稳定校验',
                formula_units: {
                  t_seconds: 's',
                  thermal_stable_current: 'kA',
                  short_circuit_current_0s: 'kA'
                },
                tolerance_percent: 5,
                calculation_result: {
                  is_satisfied: false,
                  margin_current: -1.93,
                  margin_percent: -21.6125,
                  deficit_percent: 21.6125,
                  declared_thermal_stable_current: 7,
                  theoretical_short_circuit_current_0s: 8.93
                }
              }
            }
          ]
        },
        {
          id: '5',
          title: '断路器：额定电流选型审查',
          origin:
            'GB 50060-2008、DL/T 615-2013、GB/T 156-2017、GB/T 15544 1-2023',
          content: '断路器设备额定电流选型审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                '按 I_rated >= I_load×1.2×2 重新校核断路器“10kV主变、分段真空断路器”选型，将额定电流提高至不低于 7274.40A。'
              ],
              description:
                '断路器“10kV主变、分段真空断路器”额定电流选型不足：额定电流 4000.00A，小于最小需求值 7274.40A，不足 45.0%。',
              geometry_ref: {
                chapter:
                  '泰州鸿庆变110kV进线2回，其中1回接入220kV通园变、1回接入220kV洋思变。\n\n查得220kV通园变110kV母线大方式下正序阻抗标幺值为0.0457，远景大方式下正序阻抗标幺值为0.013；线路阻抗标幺值为XL*=0.043；220kV洋思变110kV母线大方式下正序阻抗标幺值为0.0734，远景大方式下正序阻抗标幺值为0.013，线路阻抗标幺值为XL*=0.045。本站短路电流计算以通园变馈供为依据。\n\n1号、2号主变压器容量均为63MVA，主变阻抗电压Uk=17%，主变计算阻抗标幺值Xb*=0.27。\n\n本期各电路元件阻抗见下图，图中阻抗均已归算为基准容量为100MVA的标幺值。\n\n图3.2-1 短路电流计算阻抗图\n\n（1）本期短路电流计算结果见表3.2-2。\n\n表3.2-2 本期短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 5.66 | 14.43\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 15.33 | 39.09\n\n（2）远景短路电流计算\n\n远景鸿庆变电源来自220kV变电站。\n\n1）该220kV变电站110kV母线远景阻抗为0.013(标幺值)。\n\n2）110千伏鸿庆变电站主变压器容量为63MVA（Uk=17%），计算阻抗标幺值Xb*=0.27。\n\n3）不考虑110kV侧电源并列对本站供电，本站低压侧为无电源的负荷端。\n\n4）鸿庆变10kV侧母线在正常情况下按照分列运行方式考虑。\n\n远景各电路元件阻抗见图3.2-1，图中阻抗均按照基准电压为系统平均额定电压、基准容量为100MVA归算后的标幺值。\n\n远景短路电流计算结果见表3.2-2。\n\n表3.2-2   远景短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 8.93 | 22.77\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 16.87 | 43.01\n\n根据短路电流计算，本期及远景110kV和10kV侧短路电流均可控制在40kA、31.5kA以下。结合国网2026年版通用设备，本工程110kV、10kV设备短路电流水平按40kA、31.5kA选择。',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: '短路点k2，额定开断电流40kA',
                  device_name: '10kV主变、分段真空断路器',
                  load_current: 3031,
                  rated_current: 4000,
                  overload_current: null,
                  short_circuit_current: 16870
                },
                formula: 'I_rated >= I_load * 1.2 * 2',
                formula_units: {
                  load_current: 'A',
                  rated_current: 'A',
                  required_min_rated_current: 'A'
                },
                formula_factors: {
                  safety_factor: 1.2,
                  parallel_factor: 2
                },
                calculation_result: {
                  is_satisfied: false,
                  margin_current: -3274.4,
                  margin_percent: -45.0126,
                  declared_load_current: 3031,
                  declared_rated_current: 4000,
                  required_min_rated_current: 7274.4
                }
              }
            },
            {
              risk_level: 'high',
              suggestion: [
                '按 I_rated >= I_load×1.2×2 重新校核断路器“10kV出线、电容器真空断路器”选型，将额定电流提高至不低于 1440.00A。'
              ],
              description:
                '断路器“10kV出线、电容器真空断路器”额定电流选型不足：额定电流 1250.00A，小于最小需求值 1440.00A，不足 13.2%。',
              geometry_ref: {
                chapter:
                  '泰州鸿庆变110kV进线2回，其中1回接入220kV通园变、1回接入220kV洋思变。\n\n查得220kV通园变110kV母线大方式下正序阻抗标幺值为0.0457，远景大方式下正序阻抗标幺值为0.013；线路阻抗标幺值为XL*=0.043；220kV洋思变110kV母线大方式下正序阻抗标幺值为0.0734，远景大方式下正序阻抗标幺值为0.013，线路阻抗标幺值为XL*=0.045。本站短路电流计算以通园变馈供为依据。\n\n1号、2号主变压器容量均为63MVA，主变阻抗电压Uk=17%，主变计算阻抗标幺值Xb*=0.27。\n\n本期各电路元件阻抗见下图，图中阻抗均已归算为基准容量为100MVA的标幺值。\n\n图3.2-1 短路电流计算阻抗图\n\n（1）本期短路电流计算结果见表3.2-2。\n\n表3.2-2 本期短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 5.66 | 14.43\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 15.33 | 39.09\n\n（2）远景短路电流计算\n\n远景鸿庆变电源来自220kV变电站。\n\n1）该220kV变电站110kV母线远景阻抗为0.013(标幺值)。\n\n2）110千伏鸿庆变电站主变压器容量为63MVA（Uk=17%），计算阻抗标幺值Xb*=0.27。\n\n3）不考虑110kV侧电源并列对本站供电，本站低压侧为无电源的负荷端。\n\n4）鸿庆变10kV侧母线在正常情况下按照分列运行方式考虑。\n\n远景各电路元件阻抗见图3.2-1，图中阻抗均按照基准电压为系统平均额定电压、基准容量为100MVA归算后的标幺值。\n\n远景短路电流计算结果见表3.2-2。\n\n表3.2-2   远景短路电流计算结果表\n\n短路点编号 | 短路位置 | 基准容量 | 基准电压 | 短路形式 | 暂态短路电流(有效值) | 短路电流冲击值(峰值)\n短路点编号 | 短路位置 | Si | Ui | 短路形式 | I” | Ich\n短路点编号 | 短路位置 | MVA | kV | 短路形式 | kA | kA\nk1 | 110kV母线 | 100 | 115 | 三相短路 | 8.93 | 22.77\nK2 | 10kV母线分列 | 100 | 10.5 | 三相短路 | 16.87 | 43.01\n\n根据短路电流计算，本期及远景110kV和10kV侧短路电流均可控制在40kA、31.5kA以下。结合国网2026年版通用设备，本工程110kV、10kV设备短路电流水平按40kA、31.5kA选择。',
                extents: null,
                file_id: 'e220a503-8ba2-4b77-841b-804177c2e76d',
                handles: null
              },
              review_trace: {
                item: {
                  remark: '短路点k2，额定开断电流31.5kA',
                  device_name: '10kV出线、电容器真空断路器',
                  load_current: 600,
                  rated_current: 1250,
                  overload_current: null,
                  short_circuit_current: 16870
                },
                formula: 'I_rated >= I_load * 1.2 * 2',
                formula_units: {
                  load_current: 'A',
                  rated_current: 'A',
                  required_min_rated_current: 'A'
                },
                formula_factors: {
                  safety_factor: 1.2,
                  parallel_factor: 2
                },
                calculation_result: {
                  is_satisfied: false,
                  margin_current: -190,
                  margin_percent: -13.1944,
                  declared_load_current: 600,
                  declared_rated_current: 1250,
                  required_min_rated_current: 1440
                }
              }
            }
          ]
        },
        {
          id: '6',
          title: '断路器：额定开断电流选型审查',
          origin: 'GB/T 15544.1-2023',
          content: '断路器设备额定开断电流选型审查',
          violations: []
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

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
        "code": "DESIGN-SPEC-001",
        "name": "工程设计说明编制规范",
        "type": "行业标准",
        "articles": [
            {
                "id": "0",
                "title": "短路电流审查",
                "origin": "GB/T 15544.1-2023",
                "content": "短路电流审查",
                "violations": [
                    {
                        "risk_level": "high",
                        "suggestion": [
                            "检查设计说明中的高压母线侧短路电流计算是否正确"
                        ],
                        "description": "高压侧母线计算值与设计说明差异过大：计算值8.61kA与设计值9.63kA 差异10.6%",
                        "geometry_ref": {
                            "chapter": "按照《城市电力网规划设计导则》要求,为了取得合理的经济效益,各级电压的短路容量应该从网络设计、电压等级、变压器容量、短路阻抗和运行方式等多方面控制,使各级电压断路器的开断电流以及设备的动稳定电流得到配合,并根据计算结果进行设备选择及校验。\n\n220kV七里庙变2008年最大方式下110kV短路容量为2221MVA，新建架空线路8.30km，导线型号LGJ-300，电缆线路1.0km，电缆采用单芯400mm2；220kV福前变2008年最大方式下110kV短路容量为2222MVA，新建架空线路4.10km，导线型号LGJ-300，电缆线路1.0km，电缆采用单芯400mm2。\n\n根据《电力工程电气设计手册》电气一次部分中短路电流计算条件的一般规定：确定短路电流时，应按可能发生最大短路电流的正常接线方式，而不应按仅在切换过程中可能并列运行的接线方式。\n\n根据上述情况，本期短路电流计算按较大的接入方式即福前变供电情况下计算。\n\n本设计按照如下的条件计算：\n\n1、220kV福前变至110kV彩虹平板变电站的110kV架空线路长度为4.10km，导线型号为LGJ-300。电缆长度1.0km，电缆为单芯400 mm2。\n\n2、主变容量为20MVA，主变短路阻抗按Uk%=10.5计算。\n\n3、基准容量Sj＝1000MVA，基准电压Uj=115kV，Uj=10.5kV\n\n正常供电情况下计算阻抗图如下（已归算为标么值）:\n\n计算结果\n\n经计算，得到如下的110kV彩虹平板变电站三相短路电流值：\n\n变电站110kV母线短路电流：I1”=9.626kA,\n\n变电站10kV母线短路电流: I2”=9.429kA。\n\n合环运行情况下计算阻抗图如下（已归算为标么值）:\n\n经计算，得到如下的110kV彩虹平板变电站三相短路电流值：\n\n变电站110kV母线短路电流：I1”=14.50kA,\n\n变电站10kV母线短路电流: I2”=18.51kA。\n\n设备选择时按正常供电情况考虑。",
                            "extents": null,
                            "file_id": "e4666691-26de-4702-ad53-ff44588bcf7a",
                            "handles": null
                        },
                        "review_trace": {
                            "defaults_applied": {
                                "cable_unit_reactance_ohm_per_km": 0.12,
                                "overhead_line_unit_reactance_ohm_per_km": 0.4
                            },
                            "calculation_result": {
                                "calculation_data": {
                                    "hv_bus_Isc_ka": 8.6095,
                                    "lv_bus_Isc_ka": 9.4265
                                },
                                "calculation_steps": [
                                    {
                                        "title": "计算高压侧基准电流",
                                        "formula": "$$I_{B}^{(高)}=\\frac{S_{B}}{\\sqrt{3} \\cdot U_{B}^{(高)}}=\\frac{1000.0\\ \\text{MVA}}{\\sqrt{3}\\times115.0\\ \\text{kV}}=5.0204\\ \\text{kA}$$"
                                    },
                                    {
                                        "title": "计算高压侧基准电抗",
                                        "formula": "$$X_{B}^{(高)}=\\frac{\\left(U_{B}^{(高)}\\right)^2}{S_{B}}=\\frac{(115.0\\ \\text{kV})^2}{1000.0\\ \\text{MVA}}=13.225\\ \\Omega$$"
                                    },
                                    {
                                        "title": "计算低压侧基准电流",
                                        "formula": "$$I_{B}^{(低)}=\\frac{S_{B}}{\\sqrt{3} \\cdot U_{B}^{(低)}}=\\frac{1000.0\\ \\text{MVA}}{\\sqrt{3}\\times10.5\\ \\text{kV}}=54.9857\\ \\text{kA}$$"
                                    },
                                    {
                                        "title": "计算低压侧基准电抗",
                                        "formula": "$$X_{B}^{(低)}=\\frac{\\left(U_{B}^{(低)}\\right)^2}{S_{B}}=\\frac{(10.5\\ \\text{kV})^2}{1000.0\\ \\text{MVA}}=0.1103\\ \\Omega$$"
                                    },
                                    {
                                        "title": "计算系统电抗标幺值",
                                        "formula": "$$X_{\\mathrm{s}{*}}=\\frac{S_{B}}{S_{\\mathrm{k}}^{\\prime\\prime}}=\\frac{1000.0\\ \\text{MVA}}{2222.0\\ \\text{MVA}}=0.45$$"
                                    },
                                    {
                                        "title": "计算线路电抗有名值",
                                        "formula": "$$X_{\\mathrm{有名值}}=L_{\\mathrm{架空}}\\times x_{\\mathrm{架空}}+L_{\\mathrm{电缆}}\\times x_{\\mathrm{电缆}}=4.1\\ \\text{km}\\times0.4\\ \\Omega/\\text{km}+1.0\\ \\text{km}\\times0.12\\ \\Omega/\\text{km}=1.76\\ \\Omega$$"
                                    },
                                    {
                                        "title": "计算线路电抗标幺值",
                                        "formula": "$$X_{\\ell{*}}=\\frac{X_{\\mathrm{有名值}}}{X_{B}^{(高)}}=\\frac{1.76\\ \\Omega}{13.225\\ \\Omega}=0.1331$$"
                                    },
                                    {
                                        "title": "计算变压器电抗标幺值",
                                        "formula": "$$X_{\\mathrm{b}{*}}=\\frac{U_{k}{(\\%)}}{100}\\times\\frac{S_{B}}{S_{\\mathrm{N}}}=\\frac{10.5\\ \\%}{100}\\times\\frac{1000.0\\ \\text{MVA}}{20.0\\ \\text{MVA}}=5.25$$"
                                    },
                                    {
                                        "title": "计算高压侧总电抗标幺值",
                                        "formula": "$$X_{\\Sigma*}^{(高)}=X_{\\mathrm{s*}}+X_{\\mathrm{L}{*}}=0.45+0.1331=0.5831$$"
                                    },
                                    {
                                        "title": "计算高压侧短路电流",
                                        "formula": "$$I_{d}^{(高)}= \\frac{1}{X_{\\Sigma*}^{(高)}} \\times I_{B}^{(高)}=\\frac{1}{0.5831} \\times5.0204\\ \\text{kA}=8.6095\\ \\text{kA}$$"
                                    },
                                    {
                                        "title": "计算低压侧总电抗标幺值",
                                        "formula": "$$X_{\\Sigma}^{(低)*}=X_{\\mathrm{s*}}+X_{\\mathrm{L}{*}}+X_{\\mathrm{b}^{*}}=0.45+0.1331+5.25=5.8331$$"
                                    },
                                    {
                                        "title": "计算低压侧短路电流",
                                        "formula": "$$I_{d}^{(低)}= \\frac{1}{X_{\\Sigma*}^{(低)}} \\times I_{B}^{(低)}=\\frac{1}{5.8331} \\times54.9857\\ \\text{kA}=9.4265\\ \\text{kA}$$"
                                    }
                                ],
                                "calculation_details": {
                                    "Ij_hv": 5.0204,
                                    "Ij_lv": 54.9857,
                                    "Zj_hv": 13.225,
                                    "Zj_lv": 0.1103,
                                    "X_line_ohm": 1.76,
                                    "X_sys_star": 0.45,
                                    "X_line_star": 0.1331,
                                    "X_total_hv_star": 0.5831,
                                    "X_total_lv_star": 5.8331,
                                    "X_transformer_star": 5.25
                                },
                                "calculation_data_map": {
                                    "hv_bus_Isc_ka": "高压侧母线短路电流 (kA)",
                                    "lv_bus_Isc_ka": "低压侧母线短路电流 (kA)"
                                },
                                "calculation_details_map": {
                                    "Ij_hv": "高压侧基准电流 (kA)",
                                    "Ij_lv": "低压侧基准电流 (kA)",
                                    "Zj_hv": "高压侧基准电抗 (Ω)",
                                    "Zj_lv": "低压侧基准电抗 (Ω)",
                                    "X_line_ohm": "线路有名电抗 (Ω)",
                                    "X_sys_star": "系统标幺电抗",
                                    "X_line_star": "线路标幺电抗",
                                    "X_total_hv_star": "高压侧总标幺电抗",
                                    "X_total_lv_star": "低压侧总标幺电抗",
                                    "X_transformer_star": "变压器标幺电抗"
                                }
                            },
                            "extracted_parameters": {
                                "cable_length_km": 1,
                                "base_capacity_mva": 1000,
                                "hv_base_voltage_kv": 115,
                                "lv_base_voltage_kv": 10.5,
                                "overhead_line_length_km": 4.1,
                                "transformer_capacity_mva": 20,
                                "normal_supply_hv_bus_Isc_ka": 9.626,
                                "normal_supply_lv_bus_Isc_ka": 9.429,
                                "transformer_impedance_percent": 10.5,
                                "cable_unit_reactance_ohm_per_km": 0.12,
                                "upstream_short_circuit_capacity_mva": 2222,
                                "upstream_main_transformer_capacity_mva": null,
                                "overhead_line_unit_reactance_ohm_per_km": 0.4,
                                "upstream_main_transformer_impedance_percent": null
                            },
                            "extracted_parameters_map": {
                                "cable_length_km": "电缆长度 (km)",
                                "base_capacity_mva": "基准容量 (MVA)",
                                "hv_base_voltage_kv": "高压侧基准电压 (kV)",
                                "lv_base_voltage_kv": "低压侧基准电压 (kV)",
                                "overhead_line_length_km": "架空线长度 (km)",
                                "transformer_capacity_mva": "变压器容量 (MVA)",
                                "transformer_impedance_percent": "变压器短路阻抗百分比 (%)",
                                "cable_unit_reactance_ohm_per_km": "电缆单位电抗 (Ω/km)",
                                "upstream_short_circuit_capacity_mva": "上级系统短路容量 (MVA)",
                                "upstream_main_transformer_capacity_mva": "上级系统主变容量 (MVA)",
                                "overhead_line_unit_reactance_ohm_per_km": "架空线单位电抗 (Ω/km)",
                                "upstream_main_transformer_impedance_percent": "上级系统主变短路阻抗百分比 (%)"
                            }
                        }
                    }
                ]
            },
            {
                "id": "1",
                "title": "断路器：最高工作电压审查",
                "origin": "GB/T 156-2017",
                "content": "断路器设备最高工作电压审查",
                "violations": []
            },
            {
                "id": "3",
                "title": "断路器：短路电流冲击值（即动稳定电流峰值）审查",
                "origin": "GB/T 15544.1-2023",
                "content": "断路器设备短路电流冲击值（即动稳定电流峰值）审查",
                "violations": []
            },
            {
                "id": "4",
                "title": "断路器：t秒热稳定电流审查",
                "origin": "GB/T 15544.1-2023",
                "content": "断路器设备t秒热稳定电流审查",
                "violations": []
            },
            {
                "id": "5",
                "title": "断路器：额定电流选型审查",
                "origin": "GB 50060-2008、DL/T 615-2013、GB/T 156-2017、GB/T 15544 1-2023",
                "content": "断路器设备额定电流选型审查",
                "violations": []
            },
            {
                "id": "6",
                "title": "断路器：额定开断电流选型审查",
                "origin": "GB/T 15544.1-2023",
                "content": "断路器设备额定开断电流选型审查",
                "violations": []
            }
        ],
        "category": "设计说明"
    },
    {
        "code": "EQUIP-COMP-001",
        "name": "设备清册与主接线图一致性规范",
        "type": "企业标准",
        "articles": [
            {
                "id": "equipment_comparison_result",
                "title": "设备材料清册与主接线图对比结果",
                "origin": "基于设备名称分组、型号相似度匹配与数量一致性校核。",
                "content": "返回设备材料清册与主接线图的设备型号和数量对比结果。",
                "violations": [
                    {
                        "risk_level": "high",
                        "suggestion": [],
                        "description": "已完成设备材料清册与主接线图自动比对，未发现数量不一致。",
                        "geometry_ref": {
                            "chapter": null,
                            "extents": null,
                            "file_id": "7f4bb383-f238-4a22-82a7-ef6ba06a0e7b",
                            "handles": null
                        },
                        "review_trace": {
                            "errors": [
                                "Wiring diagram device extraction failed: [Errno 13] Permission denied: 'dwg2dxf'"
                            ],
                            "assistant_text": null,
                            "cad_manifest_path": null,
                            "comparison_groups": [
                                {
                                    "items": [
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "隔离开关",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 2,
                                            "equipment_list_model": "最高电压72.5kV，额定电流630A，爬电距离2248mm，配电动操作机构"
                                        }
                                    ],
                                    "equipment_name": "隔离开关"
                                },
                                {
                                    "items": [
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "避雷器",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 6,
                                            "equipment_list_model": "YH5WZ-17/45"
                                        }
                                    ],
                                    "equipment_name": "避雷器"
                                },
                                {
                                    "items": [
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "电缆附件",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 6,
                                            "equipment_list_model": "126kV，复合绝缘式电缆终端，户内用, 爬电距离：3906mm"
                                        },
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "电缆附件",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 6,
                                            "equipment_list_model": "126kV，GIS用电缆终端, 爬电距离：3150mm"
                                        },
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "电缆附件",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 8,
                                            "equipment_list_model": "12kV，户内冷缩型三芯电缆终端头，3*300电容器电缆用"
                                        }
                                    ],
                                    "equipment_name": "电缆附件"
                                },
                                {
                                    "items": [
                                        {
                                            "result": "图纸缺失",
                                            "match_reason": null,
                                            "match_source": "unmatched",
                                            "diagram_count": 0,
                                            "diagram_model": "",
                                            "model_matched": false,
                                            "equipment_name": "电力变压器",
                                            "diagram_world_bboxes": [],
                                            "equipment_list_count": 2,
                                            "equipment_list_model": "百兆、16光口；千兆、4光口"
                                        }
                                    ],
                                    "equipment_name": "电力变压器"
                                }
                            ],
                            "annotated_image_path": null,
                            "equipment_list_devices": [
                                {
                                    "name": "隔离开关",
                                    "count": 2,
                                    "model": "最高电压72.5kV，额定电流630A，爬电距离2248mm，配电动操作机构",
                                    "canonical_model": "隔离开关"
                                },
                                {
                                    "name": "避雷器",
                                    "count": 6,
                                    "model": "YH5WZ-17/45",
                                    "canonical_model": "避雷器"
                                },
                                {
                                    "name": "电缆附件",
                                    "count": 6,
                                    "model": "126kV，复合绝缘式电缆终端，户内用, 爬电距离：3906mm",
                                    "canonical_model": null
                                },
                                {
                                    "name": "电缆附件",
                                    "count": 6,
                                    "model": "126kV，GIS用电缆终端, 爬电距离：3150mm",
                                    "canonical_model": null
                                },
                                {
                                    "name": "电缆附件",
                                    "count": 8,
                                    "model": "12kV，户内冷缩型三芯电缆终端头，3*300电容器电缆用",
                                    "canonical_model": null
                                },
                                {
                                    "name": "电力变压器",
                                    "count": 2,
                                    "model": "百兆、16光口；千兆、4光口",
                                    "canonical_model": "电力变压器"
                                }
                            ],
                            "wiring_diagram_devices": []
                        }
                    }
                ]
            }
        ],
        "category": "设备材料清册"
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

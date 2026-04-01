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
    // 'http://192.168.3.184:9000/temp/2026/01/15/0df91a45-038a-47ee-8cc0-1cf682117588.dwg'
    'http://192.168.3.184:9000/temp/2026/03/10/98d8d552-bea7-4b3f-9df0-908283876654.dwg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20260401%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260401T095641Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=3f9517a87cba936a11260150cb667b6b8e2bb448eb0a99c2d9f7334e7404a783'
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
              suggestion: [
                '核对设备“电流互感器”在设备材料清册与主接线图中的型号和数量，并统一后重新审查。'
              ],
              description:
                '设备“电流互感器”数量不一致：清册型号“电流互感器:300-600/1A,5P30/5P30/0.2/0.2S,15/15/5/5VA”，图纸型号“电流互感器\n300-600/1A\n5P30/5P30/0.2/0.2S”，清册数量 30，图纸数量 3。',
              geometry_ref: {
                chapter: null,
                extents: {
                  max_point: {
                    x: 714200.2580520292,
                    y: -161529.6295513494
                  },
                  min_point: {
                    x: 429723.5425581365,
                    y: -215344.3789175358
                  }
                },
                file_id: '1caf1385-eabb-4083-91e0-1f686ace7068',
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
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 479379.33313840616,
                            y: -177160.58314587717
                          },
                          min_point: {
                            x: 474549.467163983,
                            y: -182753.40275059815
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model:
                          'SSZ□-63000kVA\n100/100/100\n115±8×1.25%/38.5\n±2×2.5%/10.5kV\nU12%=10.5\nU13%=18\nU23%=6.5\nYN,yn0,d11',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            474549.467163983, -182753.40275059815,
                            479379.33313840616, -177160.58314587717
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 470304.96857804735,
                            y: -192990.51345942053
                          },
                          min_point: {
                            x: 463556.8122056373,
                            y: -195612.18406283372
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model:
                          'DKSC-1200-200/10\nZNyn11，Uk=4%\n10.5±2×2.5%/0.4kV\nXHDCZ-1000/10',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            463556.8122056373, -195612.18406283372,
                            470304.96857804735, -192990.51345942053
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 436154.80744180194,
                            y: -169293.27204635539
                          },
                          min_point: {
                            x: 435042.2725185593,
                            y: -177547.96446528062
                          }
                        },
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '同#1主变',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            435042.2725185593, -177547.96446528062,
                            436154.80744180194, -169293.27204635539
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 457952.53492324264,
                            y: -178026.3268952687
                          },
                          min_point: {
                            x: 456840,
                            y: -182761.01931419387
                          }
                        },
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '同#1主变',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [
                          [
                            456840, -182761.01931419387, 457952.53492324264,
                            -178026.3268952687
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '一体式三相三绕组油浸自冷式有载调压 SSZ口-63000/110（2级能效）'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电力变压器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          'DKSC-1200/10.5-200/0.4  10.5±2×2.5%/0.4kV  ZNyn11  Uk=4%'
                      }
                    ],
                    equipment_name: '电力变压器'
                  },
                  {
                    items: [
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 448821.9181302765,
                            y: -166755.14538050693
                          },
                          min_point: {
                            x: 443508.8726027276,
                            y: -168897.23295441433
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n300-600/1A\n5P30/5P30/0.2/0.2S',
                        model_matched: true,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            443508.8726027276, -168897.23295441433,
                            448821.9181302765, -166755.14538050693
                          ]
                        ],
                        equipment_list_count: 30,
                        equipment_list_model:
                          '电流互感器:300-600/1A,5P30/5P30/0.2/0.2S,15/15/5/5VA'
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 467731.6638180079,
                            y: -166840.00000002846
                          },
                          min_point: {
                            x: 461855.934616913,
                            y: -169519.99999989226
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n600-1200/1A\n5P/0.2S\n15/5VA',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            461855.934616913, -169519.99999989226,
                            467731.6638180079, -166840.00000002846
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 474705.4064641663,
                            y: -167437.59119540753
                          },
                          min_point: {
                            x: 468817.7249551114,
                            y: -169265.73268636977
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n600-1200/1A\n5P/0.2S/0.2S 15/5/5VA',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            468817.7249551114, -169265.73268636977,
                            474705.4064641663, -167437.59119540753
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 440191.8175615228,
                            y: -166965.0069976234
                          },
                          min_point: {
                            x: 434315.4753112816,
                            y: -169853.7810545074
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n1200/1A\n5P30/5P30/0.2',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            434315.4753112816, -169853.7810545074,
                            440191.8175615228, -166965.0069976234
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 450760.59467208333,
                            y: -171831.0830415431
                          },
                          min_point: {
                            x: 445447.5491445347,
                            y: -174011.0830415431
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n1200/1A\n5P/5P/0.2S/0.2S',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            445447.5491445347, -174011.0830415431,
                            450760.59467208333, -171831.0830415431
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 479375.1226688585,
                            y: -172220.55761383218
                          },
                          min_point: {
                            x: 473490.8584683796,
                            y: -174936.69444482395
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器 400-800/1A\n5P30/5P30/0.2S/0.2S,\n15/15/5/5VA\n接地开关\n126kV，3150A，40kA/3s',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            473490.8584683796, -174936.69444482395,
                            479375.1226688585, -172220.55761383218
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 450760.5946757761,
                            y: -174347.65971537447
                          },
                          min_point: {
                            x: 445447.5491414576,
                            y: -176197.02085387666
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n5P30\n1200/1A',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            445447.5491414576, -176197.02085387666,
                            450760.5946757761, -174347.65971537447
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 481925.0165150618,
                            y: -182393.8046005653
                          },
                          min_point: {
                            x: 476209.72380410257,
                            y: -184948.35904522368
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器(预留母线保护)\n4000/1A，5P30\n15VA',
                        model_matched: true,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            476209.72380410257, -184948.35904522368,
                            481925.0165150618, -182393.8046005653
                          ]
                        ],
                        equipment_list_count: 6,
                        equipment_list_model: '电流互感器：4000/1A,5P30,15VA'
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 481925.0165150618,
                            y: -185463.71889468734
                          },
                          min_point: {
                            x: 475666.0353561523,
                            y: -188018.27333934556
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n4000A/1A\n5P30/5P30/0.2S/0.2S',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            475666.0353561523, -188018.27333934556,
                            481925.0165150618, -185463.71889468734
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 475430.3210241666,
                            y: -185583.55017960205
                          },
                          min_point: {
                            x: 469355.3214977631,
                            y: -188237.11914348742
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n400-800/1A\n5P30/5P30/0.2/0.2S',
                        model_matched: true,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            469355.3214977631, -188237.11914348742,
                            475430.3210241666, -185583.55017960205
                          ]
                        ],
                        equipment_list_count: 48,
                        equipment_list_model:
                          '电流互感器：400-800/1A,5P30/5P30/0.2/0.2S,15/15/5/5VA'
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 482079.9046438938,
                            y: -189546.58204404183
                          },
                          min_point: {
                            x: 476004.9051175232,
                            y: -192006.65776200645
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n400-800/1A\n5P30/5P30/0.2/0.2S\n15/15/5/5VA',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            476004.9051175232, -192006.65776200645,
                            482079.9046438938, -189546.58204404183
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 469937.7921157895,
                            y: -189605.84864401183
                          },
                          min_point: {
                            x: 463862.7925893862,
                            y: -192065.92436201603
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model:
                          '电流互感器\n300-600/1A\n5P30/5P30/0.2/0.2S\n15/15/5/5VA',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            463862.7925893862, -192065.92436201603,
                            469937.7921157895, -189605.84864401183
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 457025.1519477963,
                            y: -189891.31475569544
                          },
                          min_point: {
                            x: 453794.0948084942,
                            y: -192380.98651062246
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n4000/1A\n5P/0.2\n15/15VA',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [
                          [
                            453794.0948084942, -192380.98651062246,
                            457025.1519477963, -189891.31475569544
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '中性点零序CT：12kV 100/1A  5P30/5P30级 15/15VA 附:中性点保护间隙'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '间隙电流互感器：12kV 100-300/1A  5P30/5P30级 15/15VA 附:中性点保护间隙'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 9,
                        equipment_list_model:
                          '电流互感器 126kV  600-1200/1A，5P30/0.2S/0.2S 15/5/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '电流互感器 126kV 600-1200/1A，5P30/5P30/0.2S/0.2S，15/15/15/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 3,
                        equipment_list_model:
                          '电流互感器 126kV 600-1200/1A，5P30/0.2S，15/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '电流互感器: 额定电流比:600-1200/1A,5P30,15VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '电流互感器: 额定电流比:600-1200/1A,5P30/5P30/0.2/0.2S,15/15/5/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 3,
                        equipment_list_model:
                          '电流互感器: 额定电流比:600-1200/1A,5P30/5P30/0.2,15/5/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 9,
                        equipment_list_model:
                          '电流互感器：4000/1A,5P30/5P30/0.2S/0.2S,15/15/5/5VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电流互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 66,
                        equipment_list_model:
                          '零序电流互感器：LXK-φ180 50/5A 5P10 5VA'
                      }
                    ],
                    equipment_name: '电流互感器'
                  },
                  {
                    items: [
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 474697.0572305201,
                            y: -162428.48328119682
                          },
                          min_point: {
                            x: 468817.7249704927,
                            y: -163541.6210086076
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_product_model',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器\nY10W-102/266',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            468817.7249704927, -163541.6210086076,
                            474697.0572305201, -162428.48328119682
                          ]
                        ],
                        equipment_list_count: 9,
                        equipment_list_model: 'Y10W-102/266'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 448821.9181302765,
                            y: -166728.59673734504
                          },
                          min_point: {
                            x: 443508.8726027276,
                            y: -167478.02411953005
                          }
                        },
                        match_reason:
                          '主接线图型号"氧化锌避雷器,51/134"与候选1"YH5WZ-51/134，带在线监测仪"核心参数51/134完全匹配，且都是氧化锌避雷器。虽然格式有差异（主接线图没有具体型号前缀，只有参数），但关键电压等级参数51/134一致，其他候选的电压参数都不匹配。',
                        match_source: 'llm_same_name',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器,51/134',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            443508.8726027276, -167478.02411953005,
                            448821.9181302765, -166728.59673734504
                          ]
                        ],
                        equipment_list_count: 6,
                        equipment_list_model: 'YH5WZ-51/134，带在线监测仪'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 483643.7637545919,
                            y: -180815.00977402233
                          },
                          min_point: {
                            x: 474290.1907872841,
                            y: -181589.4091265715
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_product_model',
                        diagram_count: 1,
                        diagram_model: '避雷器YH1.5W-72/186W',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            474290.1907872841, -181589.4091265715,
                            483643.7637545919, -180815.00977402233
                          ]
                        ],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '氧化锌避雷器YH1.5W-72/186W(附放电监测器)'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 479379.3331510221,
                            y: -181186.69088345257
                          },
                          min_point: {
                            x: 474549.4671766043,
                            y: -182937.65236947793
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器,51/134\n附：在线监测仪',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            474549.4671766043, -182937.65236947793,
                            479379.3331510221, -181186.69088345257
                          ]
                        ],
                        equipment_list_count: 18,
                        equipment_list_model:
                          '氧化锌避雷器：HY5WZ1-51/134，附放电计数器'
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 481990.0000039712,
                            y: -181368.1970806401
                          },
                          min_point: {
                            x: 463862.7925893862,
                            y: -192260.5044965373
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model: '氧化锌避雷器,17/45\n附：在线监测仪',
                        model_matched: false,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            476274.70728802896, -182863.9343064533,
                            481990.0000039712, -181368.1970806401
                          ],
                          [
                            463862.7925893862, -192260.5044965373,
                            469937.7921157895, -191181.0390778409
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 475430.3210241666,
                            y: -185638.26272244984
                          },
                          min_point: {
                            x: 469355.3214977631,
                            y: -186449.83565328125
                          }
                        },
                        match_reason:
                          '主接线图型号"氧化锌避雷器：17/45"与候选1"氧化锌避雷器：HY5WZ1-17/45 附放电监测器"核心参数一致（17/45），且都是氧化锌避雷器。虽然候选1有具体型号前缀HY5WZ1和附加说明，但核心电压等级参数匹配，格式差异和附加说明不影响归属判断。',
                        match_source: 'llm_same_name',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器：17/45',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            469355.3214977631, -186449.83565328125,
                            475430.3210241666, -185638.26272244984
                          ]
                        ],
                        equipment_list_count: 72,
                        equipment_list_model:
                          '氧化锌避雷器：HY5WZ1-17/45  附放电监测器'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 468824.2712988285,
                            y: -186516.2077961458
                          },
                          min_point: {
                            x: 462749.2717724248,
                            y: -187341.7229663286
                          }
                        },
                        match_reason:
                          '主接线图型号"氧化锌避雷器：17/45"与候选0"YH5WZ-17/45"核心参数完全一致（17/45），允许格式差异（冒号vs连字符）、前缀差异（氧化锌避雷器vsYH5WZ）、附加说明差异。候选1电压参数为17/46不匹配，候选2电压参数为10/27不匹配。',
                        match_source: 'llm_same_name',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器：17/45',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            462749.2717724248, -187341.7229663286,
                            468824.2712988285, -186516.2077961458
                          ]
                        ],
                        equipment_list_count: 6,
                        equipment_list_model: 'YH5WZ-17/45，带在线监测仪'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 482039.9394276385,
                            y: -194738.58393981121
                          },
                          min_point: {
                            x: 475964.939901268,
                            y: -195345.6177837876
                          }
                        },
                        match_reason:
                          '主接线图型号YH5WR-17/46与候选0的YH5WR-17/46完全一致，附加的"附在线监测仪"不影响核心型号匹配',
                        match_source: 'llm_same_name',
                        diagram_count: 1,
                        diagram_model: 'YH5WR-17/46',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            475964.939901268, -195345.6177837876,
                            482039.9394276385, -194738.58393981121
                          ]
                        ],
                        equipment_list_count: 12,
                        equipment_list_model: 'YH5WR-17/46,附在线监测仪'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 482079.9046438938,
                            y: -191127.10984747836
                          },
                          min_point: {
                            x: 476004.9051175232,
                            y: -192185.22578762614
                          }
                        },
                        match_reason: null,
                        match_source: 'canonical_model_fallback',
                        diagram_count: 1,
                        diagram_model: '氧化锌避雷器：17/45',
                        model_matched: true,
                        equipment_name: '避雷器',
                        diagram_world_bboxes: [
                          [
                            476004.9051175232, -192185.22578762614,
                            482079.9046438938, -191127.10984747836
                          ]
                        ],
                        equipment_list_count: 2,
                        equipment_list_model: 'YH5WZ-10/27,附在线监测仪'
                      }
                    ],
                    equipment_name: '避雷器'
                  },
                  {
                    items: [
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 479378.5399866613,
                            y: -166591.4862189609
                          },
                          min_point: {
                            x: 461843.9823098234,
                            y: -174393.57739927364
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 4,
                        diagram_model:
                          '断路器\n126kV，3150A，40kA\n电流互感器 400-800/1A\n5P30/5P30/0.2S/0.2S,\n15/15/5/5VA',
                        model_matched: true,
                        equipment_name: '断路器',
                        diagram_world_bboxes: [
                          [
                            461843.9823098234, -167816.17126033892,
                            467731.6638180079, -166591.4862189609
                          ],
                          [
                            468817.7249551114, -169692.52393484785,
                            474693.4541462639, -168514.08843988966
                          ],
                          [
                            473490.8584683796, -173182.1739623224,
                            479378.5399866613, -172051.8453993532
                          ],
                          [
                            473490.8584683796, -174393.57739927364,
                            479378.5399866613, -171648.0442537028
                          ]
                        ],
                        equipment_list_count: 6,
                        equipment_list_model: '断路器 126kV，3150A，40kA/3s'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 448821.9181302765,
                            y: -168427.72285263718
                          },
                          min_point: {
                            x: 434315.4753112816,
                            y: -170317.96772668452
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 2,
                        diagram_model: '真空断路器\n40.5kV，1250A，31.5kA',
                        model_matched: true,
                        equipment_name: '断路器',
                        diagram_world_bboxes: [
                          [
                            443508.8726027276, -169617.24561491417,
                            448821.9181302765, -168427.72285263718
                          ],
                          [
                            434315.4753112816, -170317.96772668452,
                            440191.8175623569, -168736.12747815368
                          ]
                        ],
                        equipment_list_count: 7,
                        equipment_list_model:
                          '真空断路器:40.5kV,1250A,31.5kA/4S'
                      },
                      {
                        result: '匹配',
                        extents: {
                          max_point: {
                            x: 481925.0165150618,
                            y: -183880.28254486594
                          },
                          min_point: {
                            x: 453794.0948084942,
                            y: -190997.39261901384
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 2,
                        diagram_model: '真空断路器\n4000A，40kA',
                        model_matched: true,
                        equipment_name: '断路器',
                        diagram_world_bboxes: [
                          [
                            476209.72380410257, -185598.03410163856,
                            481925.0165150618, -183880.28254486594
                          ],
                          [
                            453794.0948084942, -190997.39261901384,
                            457025.1519477963, -189062.75292066723
                          ]
                        ],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '真空断路器:  ZN□-12/4000A-40kA ，附：弹操一体化机构'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 482079.9046438938,
                            y: -187198.75179172662
                          },
                          min_point: {
                            x: 463862.7925893862,
                            y: -190555.79895151983
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 3,
                        diagram_model: '真空断路器 1250A 31.5kA',
                        model_matched: true,
                        equipment_name: '断路器',
                        diagram_world_bboxes: [
                          [
                            469355.3214977631, -188698.65223488444,
                            475430.3210241666, -187198.75179172662
                          ],
                          [
                            476004.9051175232, -190496.53235153994,
                            482079.9046438938, -189156.80683951214
                          ],
                          [
                            463862.7925893862, -190555.79895151983,
                            469937.7921157895, -189216.07343949203
                          ]
                        ],
                        equipment_list_count: 22,
                        equipment_list_model:
                          '真空断路器:  ZN□-12/1250A-31.5kA ，附：弹操一体化机构'
                      }
                    ],
                    equipment_name: '断路器'
                  },
                  {
                    items: [
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 479375.04655931704,
                            y: -165936.94460237655
                          },
                          min_point: {
                            x: 461843.9823098234,
                            y: -175147.49424651105
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 5,
                        diagram_model:
                          '隔离开关\n126kV，3150A，40kA/3s\n带电显示（三相）',
                        model_matched: true,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            461843.9823098234, -167217.89510494837,
                            467731.6638180079, -165936.94460237655
                          ],
                          [
                            468817.7249551114, -167527.31407282298,
                            474705.32383095124, -166404.8169806642
                          ],
                          [
                            461850.4603179277, -170819.93938033056,
                            467731.6638180079, -169008.95724210556
                          ],
                          [
                            468817.7249551114, -170798.35061416874,
                            474698.9284560675, -169684.94815756613
                          ],
                          [
                            473490.8584683796, -175147.49424651105,
                            479375.04655931704, -173961.04890059764
                          ]
                        ],
                        equipment_list_count: 12,
                        equipment_list_model:
                          '隔离开关 126kV，3150A，40kA/3s，配置2只微动开关'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 450760.59467208333,
                            y: -169018.54355398117
                          },
                          min_point: {
                            x: 439560.189957999,
                            y: -172647.68920018937
                          }
                        },
                        match_reason:
                          '主接线图型号"三工位隔离开关 40.5kV，1250A，31.5kA"与候选1"隔离开关:40.5kV,1250A,31.5kA/4S"核心参数完全匹配：电压等级40.5kV、额定电流1250A、短路电流31.5kA。虽然主接线图没有标注时间参数，但核心参数一致，且候选1明确标注为隔离开关。候选2参数也匹配但格式略有差异，但候选1更完整包含时间参数。',
                        match_source: 'llm_same_name',
                        diagram_count: 3,
                        diagram_model:
                          '三工位隔离开关\n40.5kV，1250A，31.5kA\n带电显示器',
                        model_matched: true,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            443508.8726027276, -170223.82903543615,
                            448821.9181302765, -169018.54355398117
                          ],
                          [
                            445447.5491445347, -172484.81042964052,
                            450760.59467208333, -170850.58728021733
                          ],
                          [
                            439560.189957999, -172647.68920018937,
                            444873.2354855422, -170796.29435670597
                          ]
                        ],
                        equipment_list_count: 9,
                        equipment_list_model:
                          '隔离开关:40.5kV,1250A,31.5kA/4S，配置2只微动开关，满足一键顺控功能'
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 483643.7637545919,
                            y: -178958.2501358944
                          },
                          min_point: {
                            x: 477945.0889125864,
                            y: -180329.2924358952
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '中性点隔离开关\n72.5kV 630A 31.5kA',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            477945.0889125864, -180329.2924358952,
                            483643.7637545919, -178958.2501358944
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 481925.0165150618,
                            y: -186950.19683898782
                          },
                          min_point: {
                            x: 476209.72380410257,
                            y: -188667.9483957606
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '隔离手车:4000A',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            476209.72380410257, -188667.9483957606,
                            481925.0165150618, -186950.19683898782
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 463135.9051915058,
                            y: -188486.99286439328
                          },
                          min_point: {
                            x: 459904.8480522037,
                            y: -192911.30431766692
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '隔离手车\n4000A',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            459904.8480522037, -192911.30431766692,
                            463135.9051915058, -188486.99286439328
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 442302.5492897942,
                            y: -166569.54693523038
                          },
                          min_point: {
                            x: 438413.5034403299,
                            y: -171040.16124168638
                          }
                        },
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '隔离手车\n1250A',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [
                          [
                            438413.5034403299, -171040.16124168638,
                            442302.5492897942, -166569.54693523038
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          '126kV，3150A，40kA/3s，双接地,配置6只微动开关,外绝缘爬电距离不小于25mm/kV'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 3,
                        equipment_list_model:
                          '隔离开关:40.5kV 1250A 31.5kA，配置2只微动开关，满足一键顺控功能'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 4,
                        equipment_list_model: 'GW4-40.5DW/1250A-4，附钢支架'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '隔离开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model: 'GN19-12/630A'
                      }
                    ],
                    equipment_name: '隔离开关'
                  },
                  {
                    items: [
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 479378.5399866613,
                            y: -165840.4078816378
                          },
                          min_point: {
                            x: 461850.4603179277,
                            y: -174532.89329917353
                          }
                        },
                        match_reason: null,
                        match_source: 'structured_fields',
                        diagram_count: 6,
                        diagram_model: '快速接地开关\n126kV，3150A，40kA/3s',
                        model_matched: true,
                        equipment_name: '接地开关',
                        diagram_world_bboxes: [
                          [
                            468817.7249551114, -166967.1190443926,
                            474705.32383095124, -165840.4078816378
                          ],
                          [
                            468817.7249551114, -168218.5949523305,
                            474705.4064641663, -166922.72141560088
                          ],
                          [
                            461850.4603179277, -169767.55416502955,
                            467731.6638180079, -168544.14861155854
                          ],
                          [
                            468817.7249551114, -170245.99062702106,
                            474698.9284560675, -169115.22320580407
                          ],
                          [
                            473490.8584683796, -172617.17943845637,
                            479378.5399866613, -171486.1718450128
                          ],
                          [
                            473490.8584683796, -174532.89329917353,
                            479375.1226688585, -173431.96105078337
                          ]
                        ],
                        equipment_list_count: 17,
                        equipment_list_model:
                          '检修接地开关 126kV，40kA/3s，配置2只微动开关'
                      },
                      {
                        result: '数量不一致',
                        extents: {
                          max_point: {
                            x: 482079.9046438938,
                            y: -185232.47625703324
                          },
                          min_point: {
                            x: 463862.7925893862,
                            y: -192812.754587417
                          }
                        },
                        match_reason:
                          '主接线图型号"JN15 31.5kA"与候选0的"31.5kA"核心参数一致，JN15是型号前缀，不影响匹配。候选1有额外的"2kV"电压等级参数，与主接线图型号冲突。',
                        match_source: 'llm_same_name',
                        diagram_count: 3,
                        diagram_model: '接地开关：JN15 31.5kA',
                        model_matched: true,
                        equipment_name: '接地开关',
                        diagram_world_bboxes: [
                          [
                            469355.3214977631, -186044.04918786586,
                            475430.3210241666, -185232.47625703324
                          ],
                          [
                            476004.9051175232, -192619.5830438717,
                            482079.9046438938, -191687.7347221617
                          ],
                          [
                            463862.7925893862, -192812.754587417,
                            469937.7921157895, -191716.5993266786
                          ]
                        ],
                        equipment_list_count: 4,
                        equipment_list_model:
                          '接地开关： 31.5kA ，配置电动接地刀，配置2只微动开关，满足一键顺控功能'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '接地开关',
                        diagram_world_bboxes: [],
                        equipment_list_count: 22,
                        equipment_list_model:
                          '接地开关：2kV,31.5kA，配置电动接地刀，配置2只微动开关，满足一键顺控功能'
                      }
                    ],
                    equipment_name: '接地开关'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 479364.67390739964,
                            y: -162583.4013115521
                          },
                          min_point: {
                            x: 468818.4519102417,
                            y: -177966.113026988
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model:
                          '电容式电压互感器(三相)\n/3110//30.1//30.1//30.1/0.1kV\n0.2/0.5(3P)/0.5(3P)/3P\n10/10/10/10VA',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [
                          [
                            468818.4519102417, -166208.0880148433,
                            474694.79415904044, -162583.4013115521
                          ],
                          [
                            473490.8584776407, -177966.113026988,
                            479364.67390739964, -174693.4464159676
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: 472157.89121739264,
                            y: -171934.40152343965
                          },
                          min_point: {
                            x: 467883.290126512,
                            y: -174603.20817278544
                          }
                        },
                        match_reason: 'structured_fields_mismatch',
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model:
                          '电容式电压互感器\n110/3/30.1/30.10.1/30.1kV\n0.2/0.5(3P)/0.5(3P)/3P\n10/10/10/10VA',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [
                          [
                            467883.290126512, -174603.20817278544,
                            472157.89121739264, -171934.40152343965
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 21,
                        equipment_list_model:
                          '20000pF,110/√3/0.1/√3/0.1/√3/0.1/√3/0.1kV  0.2/0.5（3P）/0.5（3P）/3P  10/10/10/10VA,外绝缘爬电距离不小于1812.5mm'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '电压互感器：35/√3/0.1/√3/0.1/√3/0.1/√3/0.1/3kV，0.2/0.5(3P)/0.5(3P)/3P,50/50/50/50VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '消谐电压互感器：35/√3/0.1/√3/0.1/√3/0.1/√3/0.1kV，0.2/0.5(3P)/0.5(3P)/3P,50/50/50/50VA'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '电压互感器10/√3/0.1/√3/0.1/√3/0.1/√3/0.1/3，0.2/0.5(3P)/0.5(3P)/3P ，50/50/50/50VA，全绝缘'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        model_matched: false,
                        equipment_name: '电压互感器',
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model:
                          '消谐电压互感器:10/√3/0.1/√3/0.1/√3/0.1/√3/0.1，0.2/0.5(3P)/0.5(3P)/3P，50/50/50/50VA，全绝缘'
                      }
                    ],
                    equipment_name: '电压互感器'
                  }
                ],
                annotated_image_path: null,
                wiring_diagram_devices: [
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器\nY10W-102/266',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '氧化锌避雷器',
                      product_model: 'Y10W-102/266',
                      rated_voltage_kv: null,
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: '避雷器|product_model|Y10W-102/266',
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        468817.7249704927, -163541.6210086076,
                        474697.0572305201, -162428.48328119682
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器,51/134',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '51/134 氧化锌避雷器',
                      product_model: null,
                      rated_voltage_kv: null,
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: null,
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        443508.8726027276, -167478.02411953005,
                        448821.9181302765, -166728.59673734504
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '避雷器YH1.5W-72/186W',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: null,
                      product_model: 'YH1.5W-72/186W',
                      rated_voltage_kv: '72kV',
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: '避雷器|product_model|YH1.5W-72/186W',
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        474290.1907872841, -181589.4091265715,
                        483643.7637545919, -180815.00977402233
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器,51/134\n附：在线监测仪',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '51/134 附：在线监测仪',
                      product_model: null,
                      rated_voltage_kv: '51',
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature:
                      '避雷器|fields|{"rated_voltage_kv":"51"}',
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        474549.4671766043, -182937.65236947793,
                        479379.3331510221, -181186.69088345257
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 2,
                    model: '氧化锌避雷器,17/45\n附：在线监测仪',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '附：在线监测仪',
                      product_model: null,
                      rated_voltage_kv: '17',
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: '45'
                    },
                    comparison_signature:
                      '避雷器|fields|{"continuous_operating_voltage_kv":"45","rated_voltage_kv":"17"}',
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        476274.70728802896, -182863.9343064533,
                        481990.0000039712, -181368.1970806401
                      ],
                      [
                        463862.7925893862, -192260.5044965373,
                        469937.7921157895, -191181.0390778409
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器：17/45',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '17/45 氧化锌避雷器',
                      product_model: null,
                      rated_voltage_kv: null,
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: null,
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        469355.3214977631, -186449.83565328125,
                        475430.3210241666, -185638.26272244984
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器：17/45',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '17/45 氧化锌避雷器',
                      product_model: null,
                      rated_voltage_kv: null,
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: null,
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        462749.2717724248, -187341.7229663286,
                        468824.2712988285, -186516.2077961458
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: '氧化锌避雷器：17/45',
                    name_source: 'llm_cache',
                    canonical_model: '避雷器',
                    extraction_result: {
                      remark: '17/45 氧化锌避雷器',
                      product_model: null,
                      rated_voltage_kv: null,
                      nominal_discharge_current_ka: null,
                      continuous_operating_voltage_kv: null
                    },
                    comparison_signature: null,
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        476004.9051175232, -192185.22578762614,
                        482079.9046438938, -191127.10984747836
                      ]
                    ]
                  },
                  {
                    name: '避雷器',
                    count: 1,
                    model: 'YH5WR-17/46',
                    name_source: 'model_pattern_rule',
                    canonical_model: '避雷器',
                    extraction_result: null,
                    comparison_signature: null,
                    resolved_device_type: '避雷器',
                    evidence_world_bboxes: [
                      [
                        475964.939901268, -195345.6177837876, 482039.9394276385,
                        -194738.58393981121
                      ]
                    ]
                  },
                  {
                    name: '电压互感器',
                    count: 2,
                    model:
                      '电容式电压互感器(三相)\n/3110//30.1//30.1//30.1/0.1kV\n0.2/0.5(3P)/0.5(3P)/3P\n10/10/10/10VA',
                    name_source: 'llm_cache',
                    canonical_model: '电压互感器',
                    extraction_result: {
                      remark: '三相',
                      product_model: null,
                      voltage_ratio: '/3110//30.1//30.1//30.1/0.1kV',
                      burden_va_config: '10/10/10/10VA',
                      accuracy_class_config: '0.2/0.5(3P)/0.5(3P)/3P'
                    },
                    comparison_signature:
                      '电压互感器|fields|{"accuracy_class_config":"0.2/0.5(3P)/0.5(3P)/3P","burden_va_config":"10/10/10/10VA","voltage_ratio":"/3110//30.1//30.1//30.1/0.1KV"}',
                    resolved_device_type: '电压互感器',
                    evidence_world_bboxes: [
                      [
                        468818.4519102417, -166208.0880148433,
                        474694.79415904044, -162583.4013115521
                      ],
                      [
                        473490.8584776407, -177966.113026988,
                        479364.67390739964, -174693.4464159676
                      ]
                    ]
                  },
                  {
                    name: '电压互感器',
                    count: 1,
                    model:
                      '电容式电压互感器\n110/3/30.1/30.10.1/30.1kV\n0.2/0.5(3P)/0.5(3P)/3P\n10/10/10/10VA',
                    name_source: 'llm_cache',
                    canonical_model: '电压互感器',
                    extraction_result: {
                      remark: '电容式电压互感器',
                      product_model: null,
                      voltage_ratio: '110/3/30.1/30.10.1/30.1kV',
                      burden_va_config: '10/10/10/10VA',
                      accuracy_class_config: '0.2/0.5(3P)/0.5(3P)/3P'
                    },
                    comparison_signature:
                      '电压互感器|fields|{"accuracy_class_config":"0.2/0.5(3P)/0.5(3P)/3P","burden_va_config":"10/10/10/10VA","voltage_ratio":"110/3/30.1/30.10.1/30.1KV"}',
                    resolved_device_type: '电压互感器',
                    evidence_world_bboxes: [
                      [
                        467883.290126512, -174603.20817278544,
                        472157.89121739264, -171934.40152343965
                      ]
                    ]
                  },
                  {
                    name: '接地开关',
                    count: 6,
                    model: '快速接地开关\n126kV，3150A，40kA/3s',
                    name_source: 'llm_cache',
                    canonical_model: '接地开关',
                    extraction_result: {
                      remark: '快速接地开关',
                      product_model: null,
                      rated_current_a: '3150A',
                      rated_voltage_kv: '126kV',
                      short_time_withstand_current: '40kA/3s'
                    },
                    comparison_signature:
                      '接地开关|fields|{"rated_current_a":"3150A","rated_voltage_kv":"126KV","short_time_withstand_current":"40KA/3S"}',
                    resolved_device_type: '接地开关',
                    evidence_world_bboxes: [
                      [
                        468817.7249551114, -166967.1190443926,
                        474705.32383095124, -165840.4078816378
                      ],
                      [
                        468817.7249551114, -168218.5949523305,
                        474705.4064641663, -166922.72141560088
                      ],
                      [
                        461850.4603179277, -169767.55416502955,
                        467731.6638180079, -168544.14861155854
                      ],
                      [
                        468817.7249551114, -170245.99062702106,
                        474698.9284560675, -169115.22320580407
                      ],
                      [
                        473490.8584683796, -172617.17943845637,
                        479378.5399866613, -171486.1718450128
                      ],
                      [
                        473490.8584683796, -174532.89329917353,
                        479375.1226688585, -173431.96105078337
                      ]
                    ]
                  },
                  {
                    name: '接地开关',
                    count: 3,
                    model: '接地开关：JN15 31.5kA',
                    name_source: 'llm_cache',
                    canonical_model: '接地开关',
                    extraction_result: {
                      remark: null,
                      product_model: 'JN15',
                      rated_current_a: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: '31.5kA'
                    },
                    comparison_signature: '接地开关|product_model|JN15',
                    resolved_device_type: '接地开关',
                    evidence_world_bboxes: [
                      [
                        469355.3214977631, -186044.04918786586,
                        475430.3210241666, -185232.47625703324
                      ],
                      [
                        476004.9051175232, -192619.5830438717,
                        482079.9046438938, -191687.7347221617
                      ],
                      [
                        463862.7925893862, -192812.754587417, 469937.7921157895,
                        -191716.5993266786
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 5,
                    model: '隔离开关\n126kV，3150A，40kA/3s\n带电显示（三相）',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '3150',
                      grounding_config: null,
                      rated_voltage_kv: '126',
                      short_time_withstand_current: '40kA/3s'
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"3150","rated_voltage_kv":"126","short_time_withstand_current":"40KA/3S"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        461843.9823098234, -167217.89510494837,
                        467731.6638180079, -165936.94460237655
                      ],
                      [
                        468817.7249551114, -167527.31407282298,
                        474705.32383095124, -166404.8169806642
                      ],
                      [
                        461850.4603179277, -170819.93938033056,
                        467731.6638180079, -169008.95724210556
                      ],
                      [
                        468817.7249551114, -170798.35061416874,
                        474698.9284560675, -169684.94815756613
                      ],
                      [
                        473490.8584683796, -175147.49424651105,
                        479375.04655931704, -173961.04890059764
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 1,
                    model: '隔离手车\n1250A',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: '隔离手车',
                      product_model: null,
                      rated_current_a: '1250',
                      grounding_config: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: null
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"1250"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        438413.5034403299, -171040.16124168638,
                        442302.5492897942, -166569.54693523038
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 3,
                    model: '三工位隔离开关\n40.5kV，1250A，31.5kA\n带电显示器',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: '三工位隔离开关',
                      product_model: null,
                      rated_current_a: '1250',
                      grounding_config: null,
                      rated_voltage_kv: '40.5',
                      short_time_withstand_current: '31.5kA'
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"1250","rated_voltage_kv":"40.5","short_time_withstand_current":"31.5KA"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        443508.8726027276, -170223.82903543615,
                        448821.9181302765, -169018.54355398117
                      ],
                      [
                        445447.5491445347, -172484.81042964052,
                        450760.59467208333, -170850.58728021733
                      ],
                      [
                        439560.189957999, -172647.68920018937,
                        444873.2354855422, -170796.29435670597
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 1,
                    model: '中性点隔离开关\n72.5kV 630A 31.5kA',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: '中性点隔离开关',
                      product_model: null,
                      rated_current_a: '630',
                      grounding_config: null,
                      rated_voltage_kv: '72.5',
                      short_time_withstand_current: '31.5kA'
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"630","rated_voltage_kv":"72.5","short_time_withstand_current":"31.5KA"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        477945.0889125864, -180329.2924358952,
                        483643.7637545919, -178958.2501358944
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 1,
                    model: '隔离手车:4000A',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: '隔离手车',
                      product_model: null,
                      rated_current_a: '4000A',
                      grounding_config: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: null
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"4000A"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        476209.72380410257, -188667.9483957606,
                        481925.0165150618, -186950.19683898782
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 1,
                    model: '隔离手车\n4000A',
                    name_source: 'llm_cache',
                    canonical_model: '隔离开关',
                    extraction_result: {
                      remark: '隔离手车',
                      product_model: null,
                      rated_current_a: '4000',
                      grounding_config: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: null
                    },
                    comparison_signature:
                      '隔离开关|fields|{"rated_current_a":"4000"}',
                    resolved_device_type: '隔离开关',
                    evidence_world_bboxes: [
                      [
                        459904.8480522037, -192911.30431766692,
                        463135.9051915058, -188486.99286439328
                      ]
                    ]
                  },
                  {
                    name: '断路器',
                    count: 4,
                    model:
                      '断路器\n126kV，3150A，40kA\n电流互感器 400-800/1A\n5P30/5P30/0.2S/0.2S,\n15/15/5/5VA',
                    name_source: 'llm_cache',
                    canonical_model: '断路器',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '3150A',
                      rated_voltage_kv: '126kV',
                      breaking_current_ka: '40kA'
                    },
                    comparison_signature:
                      '断路器|fields|{"breaking_current_ka":"40KA","rated_current_a":"3150A","rated_voltage_kv":"126KV"}',
                    resolved_device_type: '断路器',
                    evidence_world_bboxes: [
                      [
                        461843.9823098234, -167816.17126033892,
                        467731.6638180079, -166591.4862189609
                      ],
                      [
                        468817.7249551114, -169692.52393484785,
                        474693.4541462639, -168514.08843988966
                      ],
                      [
                        473490.8584683796, -173182.1739623224,
                        479378.5399866613, -172051.8453993532
                      ],
                      [
                        473490.8584683796, -174393.57739927364,
                        479378.5399866613, -171648.0442537028
                      ]
                    ]
                  },
                  {
                    name: '断路器',
                    count: 2,
                    model: '真空断路器\n40.5kV，1250A，31.5kA',
                    name_source: 'llm_cache',
                    canonical_model: '断路器',
                    extraction_result: {
                      remark: '真空断路器',
                      product_model: null,
                      rated_current_a: '1250A',
                      rated_voltage_kv: '40.5kV',
                      breaking_current_ka: '31.5kA'
                    },
                    comparison_signature:
                      '断路器|fields|{"breaking_current_ka":"31.5KA","rated_current_a":"1250A","rated_voltage_kv":"40.5KV"}',
                    resolved_device_type: '断路器',
                    evidence_world_bboxes: [
                      [
                        443508.8726027276, -169617.24561491417,
                        448821.9181302765, -168427.72285263718
                      ],
                      [
                        434315.4753112816, -170317.96772668452,
                        440191.8175623569, -168736.12747815368
                      ]
                    ]
                  },
                  {
                    name: '断路器',
                    count: 2,
                    model: '真空断路器\n4000A，40kA',
                    name_source: 'llm_cache',
                    canonical_model: '断路器',
                    extraction_result: {
                      remark: '真空断路器',
                      product_model: null,
                      rated_current_a: '4000A',
                      rated_voltage_kv: null,
                      breaking_current_ka: '40kA'
                    },
                    comparison_signature:
                      '断路器|fields|{"breaking_current_ka":"40KA","rated_current_a":"4000A"}',
                    resolved_device_type: '断路器',
                    evidence_world_bboxes: [
                      [
                        476209.72380410257, -185598.03410163856,
                        481925.0165150618, -183880.28254486594
                      ],
                      [
                        453794.0948084942, -190997.39261901384,
                        457025.1519477963, -189062.75292066723
                      ]
                    ]
                  },
                  {
                    name: '断路器',
                    count: 3,
                    model: '真空断路器 1250A 31.5kA',
                    name_source: 'llm_cache',
                    canonical_model: '断路器',
                    extraction_result: {
                      remark: '真空断路器',
                      product_model: null,
                      rated_current_a: '1250A',
                      rated_voltage_kv: null,
                      breaking_current_ka: '31.5kA'
                    },
                    comparison_signature:
                      '断路器|fields|{"breaking_current_ka":"31.5KA","rated_current_a":"1250A"}',
                    resolved_device_type: '断路器',
                    evidence_world_bboxes: [
                      [
                        469355.3214977631, -188698.65223488444,
                        475430.3210241666, -187198.75179172662
                      ],
                      [
                        476004.9051175232, -190496.53235153994,
                        482079.9046438938, -189156.80683951214
                      ],
                      [
                        463862.7925893862, -190555.79895151983,
                        469937.7921157895, -189216.07343949203
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n300-600/1A\n5P30/5P30/0.2/0.2S',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '300-600/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30/5P30/0.2/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2/0.2S","current_ratio":"300-600/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        443508.8726027276, -168897.23295441433,
                        448821.9181302765, -166755.14538050693
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n600-1200/1A\n5P/0.2S\n15/5VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '600-1200/1A',
                      product_model: null,
                      burden_va_config: '15/5VA',
                      accuracy_class_config: '5P/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P/0.2S","burden_va_config":"15/5VA","current_ratio":"600-1200/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        461855.934616913, -169519.99999989226,
                        467731.6638180079, -166840.00000002846
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n600-1200/1A\n5P/0.2S/0.2S 15/5/5VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '600-1200/1A',
                      product_model: null,
                      burden_va_config: '15/5/5VA',
                      accuracy_class_config: '5P/0.2S/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P/0.2S/0.2S","burden_va_config":"15/5/5VA","current_ratio":"600-1200/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        468817.7249551114, -169265.73268636977,
                        474705.4064641663, -167437.59119540753
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n1200/1A\n5P30/5P30/0.2',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '1200/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30/5P30/0.2'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2","current_ratio":"1200/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        434315.4753112816, -169853.7810545074,
                        440191.8175615228, -166965.0069976234
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n1200/1A\n5P/5P/0.2S/0.2S',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '1200/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P/5P/0.2S/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P/5P/0.2S/0.2S","current_ratio":"1200/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        445447.5491445347, -174011.0830415431,
                        450760.59467208333, -171831.0830415431
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model:
                      '电流互感器 400-800/1A\n5P30/5P30/0.2S/0.2S,\n15/15/5/5VA\n接地开关\n126kV，3150A，40kA/3s',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '400-800/1A',
                      product_model: null,
                      burden_va_config: '15/15/5/5VA',
                      accuracy_class_config: '5P30/5P30/0.2S/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2S/0.2S","burden_va_config":"15/15/5/5VA","current_ratio":"400-800/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        473490.8584683796, -174936.69444482395,
                        479375.1226688585, -172220.55761383218
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n5P30\n1200/1A',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '1200/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30","current_ratio":"1200/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        445447.5491414576, -176197.02085387666,
                        450760.5946757761, -174347.65971537447
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器(预留母线保护)\n4000/1A，5P30\n15VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: '预留母线保护',
                      current_ratio: '4000/1A',
                      product_model: null,
                      burden_va_config: '15VA',
                      accuracy_class_config: '5P30'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30","burden_va_config":"15VA","current_ratio":"4000/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        476209.72380410257, -184948.35904522368,
                        481925.0165150618, -182393.8046005653
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n4000A/1A\n5P30/5P30/0.2S/0.2S',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '4000A/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30/5P30/0.2S/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2S/0.2S","current_ratio":"4000A/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        475666.0353561523, -188018.27333934556,
                        481925.0165150618, -185463.71889468734
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n400-800/1A\n5P30/5P30/0.2/0.2S',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '400-800/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30/5P30/0.2/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2/0.2S","current_ratio":"400-800/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        469355.3214977631, -188237.11914348742,
                        475430.3210241666, -185583.55017960205
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model:
                      '电流互感器\n400-800/1A\n5P30/5P30/0.2/0.2S\n15/15/5/5VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '400-800/1A',
                      product_model: null,
                      burden_va_config: '15/15/5/5VA',
                      accuracy_class_config: '5P30/5P30/0.2/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2/0.2S","burden_va_config":"15/15/5/5VA","current_ratio":"400-800/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        476004.9051175232, -192006.65776200645,
                        482079.9046438938, -189546.58204404183
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model:
                      '电流互感器\n300-600/1A\n5P30/5P30/0.2/0.2S\n15/15/5/5VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '300-600/1A',
                      product_model: null,
                      burden_va_config: '15/15/5/5VA',
                      accuracy_class_config: '5P30/5P30/0.2/0.2S'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P30/5P30/0.2/0.2S","burden_va_config":"15/15/5/5VA","current_ratio":"300-600/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        463862.7925893862, -192065.92436201603,
                        469937.7921157895, -189605.84864401183
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n4000/1A\n5P/0.2\n15/15VA',
                    name_source: 'llm_cache',
                    canonical_model: null,
                    extraction_result: {
                      remark: null,
                      current_ratio: '4000/1A',
                      product_model: null,
                      burden_va_config: '15/15VA',
                      accuracy_class_config: '5P/0.2'
                    },
                    comparison_signature:
                      '电流互感器|fields|{"accuracy_class_config":"5P/0.2","burden_va_config":"15/15VA","current_ratio":"4000/1A"}',
                    resolved_device_type: '电流互感器',
                    evidence_world_bboxes: [
                      [
                        453794.0948084942, -192380.98651062246,
                        457025.1519477963, -189891.31475569544
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 1,
                    model: '同#1主变',
                    name_source: 'kb_contains',
                    canonical_model: '电力变压器',
                    extraction_result: null,
                    comparison_signature: null,
                    resolved_device_type: '电力变压器',
                    evidence_world_bboxes: [
                      [
                        435042.2725185593, -177547.96446528062,
                        436154.80744180194, -169293.27204635539
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 1,
                    model:
                      'SSZ□-63000kVA\n100/100/100\n115±8×1.25%/38.5\n±2×2.5%/10.5kV\nU12%=10.5\nU13%=18\nU23%=6.5\nYN,yn0,d11',
                    name_source: 'llm_cache',
                    canonical_model: '电力变压器',
                    extraction_result: {
                      remark: null,
                      wiring_group: 'YN,yn0,d11',
                      product_model: 'SSZ□-63000kVA',
                      voltage_ratio: '115±8×1.25%/38.5±2×2.5%/10.5kV',
                      cooling_method: null,
                      short_circuit_impedance_config:
                        'U12%=10.5 U13%=18 U23%=6.5'
                    },
                    comparison_signature:
                      '电力变压器|product_model|SSZ□-63000KVA',
                    resolved_device_type: '电力变压器',
                    evidence_world_bboxes: [
                      [
                        474549.467163983, -182753.40275059815,
                        479379.33313840616, -177160.58314587717
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 1,
                    model: '同#1主变',
                    name_source: 'kb_contains',
                    canonical_model: '电力变压器',
                    extraction_result: null,
                    comparison_signature: null,
                    resolved_device_type: '电力变压器',
                    evidence_world_bboxes: [
                      [
                        456840, -182761.01931419387, 457952.53492324264,
                        -178026.3268952687
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 1,
                    model:
                      'DKSC-1200-200/10\nZNyn11，Uk=4%\n10.5±2×2.5%/0.4kV\nXHDCZ-1000/10',
                    name_source: 'llm_cache',
                    canonical_model: '电力变压器',
                    extraction_result: {
                      remark: 'ZNyn11，Uk=4%',
                      wiring_group: 'ZNyn11',
                      product_model: 'DKSC-1200-200/10',
                      voltage_ratio: '10.5±2×2.5%/0.4kV',
                      cooling_method: null,
                      short_circuit_impedance_config: 'Uk=4%'
                    },
                    comparison_signature:
                      '电力变压器|product_model|DKSC-1200-200/10',
                    resolved_device_type: '电力变压器',
                    evidence_world_bboxes: [
                      [
                        463556.8122056373, -195612.18406283372,
                        470304.96857804735, -192990.51345942053
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
    }
  ],
  discipline_id: '0174120b-78f9-4944-b522-9c7d201c1584'
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

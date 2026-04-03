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
          origin:
            '基于设备类型分组、产品型号 embedding 相似度匹配与结构化字段校核。',
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
                    x: -191209.8115356336,
                    y: -147893.8507374082
                  },
                  min_point: {
                    x: -192050.8115356336,
                    y: -148487.8507374082
                  }
                },
                file_id: '52abc84b-eb98-44c3-b751-7b73dc77a245',
                handles: null
              },
              review_trace: {
                errors: [],
                assistant_text: null,
                bbox_filter_stats: {
                  total_entities: 5231,
                  indexed_entities: 5231,
                  main_view_entities: 2681,
                  text_support_entities: 339,
                  geometry_seed_entities: 2342,
                  base_candidate_entities: 5231,
                  hidden_layer_excluded_entities: 0,
                  tiny_geometry_excluded_entities: 2550
                },
                cad_manifest_path: null,
                comparison_groups: [
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191533.35575292652,
                            y: -148177.45352007766
                          },
                          min_point: {
                            x: -191797.81284850018,
                            y: -148235.07651187014
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason: 'product_model_missing_on_one_side',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 2,
                        diagram_model:
                          'SZ11-20000/110\n110±8*1.25%/10.5kV\nYN.d11\nUk%=10.5\n附有载调压开关',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电力变压器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191797.81284850018, -148235.07651187014,
                            -191765.80430332405, -148177.61053095447
                          ],
                          [
                            -191565.36429810262, -148235.07651187014,
                            -191533.35575292652, -148177.45352007766
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191692.96061626292,
                            y: -148370.20759266155
                          },
                          min_point: {
                            x: -191699.6457652988,
                            y: -148381.70610291313
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason: 'product_model_missing_on_one_side',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 1,
                        diagram_model: 'DKSC-350/10.5\n-100/0.4 ZNyn11',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电力变压器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191699.6457652988, -148381.70610291313,
                            -191692.96061626292, -148370.20759266155
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电力变压器',
                        similarity_score: null,
                        diagram_world_bboxes: [],
                        equipment_list_count: 7,
                        equipment_list_model:
                          'SZ11-20000/110  110±8×1.25%/10.5kV  20000kVA  \nYN,d11  容量比100/100  Uk%=10.5\n附：高压中性点LRB-60 100/5A  一只\n高压及中性点套管泄漏比距≥2.5cm/kV(按系统最高电压，下同)\n低压套管泄漏比距≥3.1cm/kV\n中性点绝缘水平   BIL 325kV \nSIL 140kV\n有载调压开关选用MR系列，额定电流 300A，档数 9档  配电动操作机构，另附发信号用温度计和测温元件PT100；远方监测装置及全套附件，变压器本体油枕装设油位发送器一只，瓦斯继电器一只，压力释放阀一只；,有载调压开关油枕装设油位发送器一只，瓦斯继电器一只。\n不带滚轮小车'
                      }
                    ],
                    equipment_name: '电力变压器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191424.42038445952,
                            y: -147988.0880246978
                          },
                          min_point: {
                            x: -191867.44346734212,
                            y: -148155.66065077673
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason:
                          'structured_field_missing:rated_current_a',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 6,
                        diagram_model: '隔离开关 1250A 40kA/4s',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '隔离开关',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191776.73125233882, -147994.10832407392,
                            -191773.25390888035, -147988.08802469785
                          ],
                          [
                            -191544.28270194132, -147994.10832407387,
                            -191540.80535848284, -147988.0880246978
                          ],
                          [
                            -191867.44346734212, -148103.98211224217,
                            -191863.56280670303, -148099.1661874652
                          ],
                          [
                            -191428.30104509863, -148103.98211224217,
                            -191424.42038445952, -148099.1661874652
                          ],
                          [
                            -191774.0222173206, -148155.66065077673,
                            -191770.00774076008, -148149.77452049378
                          ],
                          [
                            -191541.57366692304, -148155.66065077673,
                            -191537.55919036252, -148149.77452049378
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191323.7001384339,
                            y: -148146.29635259928
                          },
                          min_point: {
                            x: -191916.44493251725,
                            y: -148155.66065077673
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason:
                          'structured_field_missing:rated_current_a',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 2,
                        diagram_model: '隔离开关 1250A 40kA',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '隔离开关',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191916.44493251725, -148152.3162585705,
                            -191912.83515351996, -148146.29635259928
                          ],
                          [
                            -191327.44698322372, -148155.66065077673,
                            -191323.7001384339, -148150.30962324678
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '隔离开关',
                        similarity_score: null,
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          'GW13-72.5(W)/630A  630A/31.5kA\n附：电动操作机构  电机电源AC380V  控制电源AC220V\n绝缘爬电比距≥3.1cm/kV'
                      }
                    ],
                    equipment_name: '隔离开关'
                  },
                  {
                    items: [
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '避雷器',
                        similarity_score: null,
                        diagram_world_bboxes: [],
                        equipment_list_count: 2,
                        equipment_list_model:
                          'YH1.5WZ-72/186  附放电记录器\n绝缘爬电比距≥2.5cm/kV'
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '避雷器',
                        similarity_score: null,
                        diagram_world_bboxes: [],
                        equipment_list_count: 12,
                        equipment_list_model: '102/266kV 10kA'
                      }
                    ],
                    equipment_name: '避雷器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191572.78392622655,
                            y: -147961.36057552454
                          },
                          min_point: {
                            x: -191812.2740186278,
                            y: -147972.01098255583
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason:
                          'structured_field_missing:accuracy_class_config',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 2,
                        diagram_model:
                          '计量PT1100.10.1kV\n333\n0.2/0.2 30/30VA',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电压互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191579.82546822992, -147972.0109825556,
                            -191572.78392622655, -147961.36057552454
                          ],
                          [
                            -191812.2740186278, -147972.01098255583,
                            -191803.68677228218, -147961.36057552474
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191445.0157909558,
                            y: -148289.60968141534
                          },
                          min_point: {
                            x: -191457.19062418622,
                            y: -148306.4727399769
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason:
                          'structured_field_missing:accuracy_class_config',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 1,
                        diagram_model: '电压互感器（A、C相）\n10/0.1kV 6P',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电压互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191457.19062418622, -148306.4727399769,
                            -191445.0157909558, -148289.60968141534
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191693.09431924365,
                            y: -148370.484190896
                          },
                          min_point: {
                            x: -191699.6457652988,
                            y: -148381.58455491028
                          }
                        },
                        match_stage: 'structured_fields',
                        match_reason: 'structured_field_missing:voltage_ratio',
                        match_source: 'structured_fields_mismatch',
                        diagram_count: 1,
                        diagram_model: '电压互感器 10/0.1kV',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电压互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191699.6457652988, -148381.58455491028,
                            -191693.09431924365, -148370.484190896
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '图纸缺失',
                        extents: null,
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 0,
                        diagram_model: '',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电压互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [],
                        equipment_list_count: 6,
                        equipment_list_model: '0.5/3P (110/√3)/(0.1/√3)/0.1 kV'
                      }
                    ],
                    equipment_name: '电压互感器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191534.65313544095,
                            y: -147968.68545485655
                          },
                          min_point: {
                            x: -191778.73741202638,
                            y: -147975.1070395815
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model: '故障接地开关 40kA',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '接地开关',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191778.73741202638, -147975.1070395815,
                            -191767.10168583845, -147968.68545485663
                          ],
                          [
                            -191546.28886162888, -147975.1070395814,
                            -191534.65313544095, -147968.68545485655
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191442.21789704575,
                            y: -147969.0905647225
                          },
                          min_point: {
                            x: -191886.57913876942,
                            y: -148106.64987229084
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 6,
                        diagram_model: '接地开关 1250A 40kA/4s',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '接地开关',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191778.87115600557, -147975.24381609497,
                            -191767.2354298176, -147969.09056472252
                          ],
                          [
                            -191546.42260560807, -147975.24381609494,
                            -191534.7868794201, -147969.0905647225
                          ],
                          [
                            -191600.58891779263, -148067.95267557155,
                            -191592.29679104293, -148063.40585287023
                          ],
                          [
                            -191600.3188405919, -148067.86923361465,
                            -191592.28988747086, -148063.3211782524
                          ],
                          [
                            -191886.57913876942, -148106.64987229084,
                            -191881.36031928923, -148092.06934186482
                          ],
                          [
                            -191447.57053241003, -148106.64987229084,
                            -191442.21789704575, -148092.06934186482
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
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
                            x: -191540.54758696744,
                            y: -148002.93065367755
                          },
                          min_point: {
                            x: -191788.51958383634,
                            y: -148016.52280137045
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 6,
                        diagram_model:
                          '电流互感器\n2*200/5A 0.2S 20VA\n2*300/5A 0.5/5P30/5P30',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191778.12441878853, -148016.38410598584,
                            -191772.99613736494, -148002.93065367758
                          ],
                          [
                            -191783.39130241275, -148016.38410598584,
                            -191778.67882759107, -148003.06934906222
                          ],
                          [
                            -191788.51958383634, -148016.52280137045,
                            -191783.80710901465, -148002.93065367758
                          ],
                          [
                            -191545.67586839103, -148016.3841059858,
                            -191540.54758696744, -148002.93065367755
                          ],
                          [
                            -191550.94275201525, -148016.3841059858,
                            -191546.23027719356, -148003.06934906216
                          ],
                          [
                            -191555.9324312382, -148016.52280137042,
                            -191551.35855861715, -148002.93065367755
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191326.51027202627,
                            y: -148103.6970470462
                          },
                          min_point: {
                            x: -191921.39166669868,
                            y: -148113.8616560997
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 12,
                        diagram_model: '电流互感器2*150/5A\n5P30/5P30/0.5',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191921.39166669868, -148113.8616560997,
                            -191916.9797145909, -148103.83079190218
                          ],
                          [
                            -191916.57862803564, -148113.72791124374,
                            -191912.16667592787, -148103.6970470462
                          ],
                          [
                            -191911.6318938542, -148113.72791124374,
                            -191906.2840731175, -148103.96453675814
                          ],
                          [
                            -191778.0366938811, -148113.59416638777,
                            -191773.2193220085, -148103.6970470462
                          ],
                          [
                            -191783.25551340976, -148113.72791124374,
                            -191778.5719574225, -148103.83079190218
                          ],
                          [
                            -191788.2067011677, -148113.8616560997,
                            -191783.6569610658, -148103.6970470462
                          ],
                          [
                            -191545.58814348353, -148113.72791124374,
                            -191540.63695572558, -148103.6970470462
                          ],
                          [
                            -191550.8069630122, -148113.72791124374,
                            -191546.12340702495, -148103.6970470462
                          ],
                          [
                            -191555.75815077018, -148113.8616560997,
                            -191551.20841066827, -148103.6970470462
                          ],
                          [
                            -191331.99672332563, -148113.72791124374,
                            -191326.51027202627, -148103.6970470462
                          ],
                          [
                            -191336.94791108358, -148113.72791124374,
                            -191332.53198686702, -148103.83079190218
                          ],
                          [
                            -191341.89909884153, -148113.72791124374,
                            -191337.61699051035, -148103.83079190218
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191576.4959522418,
                            y: -148217.28288028273
                          },
                          min_point: {
                            x: -191815.3669272491,
                            y: -148223.3011173648
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model: 'LRB-60\n100/5A,10P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191815.3669272491, -148223.3011173648,
                            -191808.94450263935, -148217.28288028273
                          ],
                          [
                            -191582.91837685154, -148223.3011173648,
                            -191576.4959522418, -148217.28288028273
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191576.4959522418,
                            y: -148217.42871139382
                          },
                          min_point: {
                            x: -191815.3669272491,
                            y: -148223.45069718995
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model: '间隙105-115mm\n间隙CT 100/5A,10P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191815.3669272491, -148223.45069718995,
                            -191808.94450263935, -148217.42871139382
                          ],
                          [
                            -191582.91837685154, -148223.45069718995,
                            -191576.4959522418, -148217.42871139382
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191774.90383481528,
                            y: -148299.4966907078
                          },
                          min_point: {
                            x: -191789.30459694433,
                            y: -148309.0650500828
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n3000/5A\n0.5/5P20/5P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191789.30459694433, -148308.9302844578,
                            -191784.59406727593, -148299.6314563328
                          ],
                          [
                            -191784.32489415203, -148309.0650500828,
                            -191779.88353760756, -148299.4966907078
                          ],
                          [
                            -191779.4797779217, -148308.9302844578,
                            -191774.90383481528, -148299.6314563328
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191916.5151499326,
                            y: -148308.4733850218
                          },
                          min_point: {
                            x: -191921.77349378457,
                            y: -148311.5729943968
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 1,
                        diagram_model: '电流互感器\n400/5A\n0.2/0.5/5P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191921.77349378457, -148311.5729943968,
                            -191916.5151499326, -148308.4733850218
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191352.6259972765,
                            y: -148305.1042443968
                          },
                          min_point: {
                            x: -191367.45722352574,
                            y: -148311.7077600218
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n300/5A\n0.5/5P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191367.45722352574, -148311.5729943968,
                            -191362.46853833282, -148305.1042443968
                          ],
                          [
                            -191362.19887967373, -148311.5729943968,
                            -191357.4798531399, -148305.1042443968
                          ],
                          [
                            -191357.4798531399, -148311.7077600218,
                            -191352.6259972765, -148305.2390100218
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191736.4524367053,
                            y: -148382.6789116616
                          },
                          min_point: {
                            x: -191751.55332161358,
                            y: -148389.4171929116
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 2,
                        diagram_model: '电流互感器\n100/5A\n0.5/5P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191751.55332161358, -148389.1476616616,
                            -191746.2949777616, -148382.6789116616
                          ],
                          [
                            -191741.84560988683, -148389.4171929116,
                            -191736.4524367053, -148382.8136772866
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      },
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191786.99814945488,
                            y: -148384.8957085366
                          },
                          min_point: {
                            x: -191801.79156739984,
                            y: -148391.5968804116
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 3,
                        diagram_model: '电流互感器\n3000/5A\n0.5/5P20',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '电流互感器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191801.79156739984, -148391.3117241616,
                            -191796.52852447712, -148385.1808647866
                          ],
                          [
                            -191796.10179126717, -148391.4543022866,
                            -191791.69221476433, -148384.8957085366
                          ],
                          [
                            -191791.54997036103, -148391.5968804116,
                            -191786.99814945488, -148385.0382866616
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '电流互感器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191332.7996186377,
                            y: -148027.29532087536
                          },
                          min_point: {
                            x: -191916.8460190725,
                            y: -148130.00938394203
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 6,
                        diagram_model: '断路器\n1250A 40kA',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '断路器',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191551.07003420146, -148037.49203857675,
                            -191546.5871600711, -148027.29532087536
                          ],
                          [
                            -191783.51858459896, -148037.4920385768,
                            -191779.0357104686, -148027.43127711143
                          ],
                          [
                            -191916.8460190725, -148127.8695981893,
                            -191912.70145800154, -148120.6478212739
                          ],
                          [
                            -191782.98788163907, -148128.00333479885,
                            -191779.1072209639, -148120.91529449297
                          ],
                          [
                            -191550.67314712686, -148128.13707140842,
                            -191546.524854681, -148120.78155788343
                          ],
                          [
                            -191336.81409519824, -148130.00938394203,
                            -191332.7996186377, -148120.78155788343
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '断路器'
                  },
                  {
                    items: [
                      {
                        result: '清册缺失',
                        extents: {
                          max_point: {
                            x: -191356.66539652273,
                            y: -148265.79450459505
                          },
                          min_point: {
                            x: -191915.66017115323,
                            y: -148389.12741330435
                          }
                        },
                        match_stage: null,
                        match_reason: null,
                        match_source: 'unmatched',
                        diagram_count: 4,
                        diagram_model: '零序CT∅120 100/1A',
                        llm_cache_hit: null,
                        model_matched: false,
                        equipment_name: '中性点零序CT',
                        similarity_score: null,
                        diagram_world_bboxes: [
                          [
                            -191915.66017115323, -148270.60942443323,
                            -191910.84683745203, -148265.79450459505
                          ],
                          [
                            -191361.47873022393, -148270.60942443323,
                            -191356.66539652273, -148265.79450459505
                          ],
                          [
                            -191751.4397818745, -148389.12741330435,
                            -191746.22533703153, -148382.97501573333
                          ],
                          [
                            -191741.81311447208, -148389.12741330435,
                            -191736.33126220127, -148382.84126796006
                          ]
                        ],
                        equipment_list_count: 0,
                        equipment_list_model: ''
                      }
                    ],
                    equipment_name: '中性点零序CT'
                  }
                ],
                default_world_bbox: {
                  max_point: {
                    x: -191209.8115356336,
                    y: -147893.8507374082
                  },
                  min_point: {
                    x: -192050.8115356336,
                    y: -148487.8507374082
                  }
                },
                bbox_selection_mode: 'main_view',
                annotated_image_path: null,
                bbox_outlier_handles: [
                  'FE72B',
                  'FE72C',
                  'FE730',
                  'FE83A',
                  '1016F0',
                  '1016F1',
                  '1016C2',
                  '1016ED',
                  '1016DF',
                  '1016EC',
                  'FEC07',
                  'FEC0A',
                  'FE76A',
                  'FE835',
                  'FE7FB',
                  'FE834',
                  '1012C3',
                  'FE75A',
                  '1012CD',
                  'FE7DF'
                ],
                main_view_world_bbox: {
                  max_point: {
                    x: -191209.8115356336,
                    y: -147893.8507374082
                  },
                  min_point: {
                    x: -192050.8115356336,
                    y: -148487.8507374082
                  }
                },
                equipment_list_devices: [
                  {
                    name: '电力变压器',
                    count: 7,
                    model:
                      'SZ11-20000/110  110±8×1.25%/10.5kV  20000kVA  \nYN,d11  容量比100/100  Uk%=10.5\n附：高压中性点LRB-60 100/5A  一只\n高压及中性点套管泄漏比距≥2.5cm/kV(按系统最高电压，下同)\n低压套管泄漏比距≥3.1cm/kV\n中性点绝缘水平   BIL 325kV \nSIL 140kV\n有载调压开关选用MR系列，额定电流 300A，档数 9档  配电动操作机构，另附发信号用温度计和测温元件PT100；远方监测装置及全套附件，变压器本体油枕装设油位发送器一只，瓦斯继电器一只，压力释放阀一只；,有载调压开关油枕装设油位发送器一只，瓦斯继电器一只。\n不带滚轮小车',
                    source_text:
                      'SZ11-20000/110  110±8×1.25%/10.5kV  20000kVA  \nYN,d11  容量比100/100  Uk%=10.5\n附：高压中性点LRB-60 100/5A  一只\n高压及中性点套管泄漏比距≥2.5cm/kV(按系统最高电压，下同)\n低压套管泄漏比距≥3.1cm/kV\n中性点绝缘水平   BIL 325kV \nSIL 140kV\n有载调压开关选用MR系列，额定电流 300A，档数 9档  配电动操作机构，另附发信号用温度计和测温元件PT100；远方监测装置及全套附件，变压器本体油枕装设油位发送器一只，瓦斯继电器一只，压力释放阀一只；,有载调压开关油枕装设油位发送器一只，瓦斯继电器一只。\n不带滚轮小车',
                    extraction_result: null
                  },
                  {
                    name: '隔离开关',
                    count: 2,
                    model:
                      'GW13-72.5(W)/630A  630A/31.5kA\n附：电动操作机构  电机电源AC380V  控制电源AC220V\n绝缘爬电比距≥3.1cm/kV',
                    source_text:
                      'GW13-72.5(W)/630A  630A/31.5kA\n附：电动操作机构  电机电源AC380V  控制电源AC220V\n绝缘爬电比距≥3.1cm/kV',
                    extraction_result: null
                  },
                  {
                    name: '避雷器',
                    count: 2,
                    model:
                      'YH1.5WZ-72/186  附放电记录器\n绝缘爬电比距≥2.5cm/kV',
                    source_text:
                      'YH1.5WZ-72/186  附放电记录器\n绝缘爬电比距≥2.5cm/kV',
                    extraction_result: null
                  },
                  {
                    name: '避雷器',
                    count: 12,
                    model: '102/266kV 10kA',
                    source_text: 'HY5WZ-17/45',
                    extraction_result: null
                  },
                  {
                    name: '电压互感器',
                    count: 6,
                    model: '0.5/3P (110/√3)/(0.1/√3)/0.1 kV',
                    source_text: '0.5/3P (110/√3)/(0.1/√3)/0.1 kV',
                    extraction_result: null
                  }
                ],
                full_entity_world_bbox: {
                  max_point: {
                    x: -191209.8115356336,
                    y: -147893.8507374082
                  },
                  min_point: {
                    x: -192050.8115356336,
                    y: -148487.8507374082
                  }
                },
                wiring_diagram_devices: [
                  {
                    name: '电压互感器',
                    count: 2,
                    model: '计量PT1100.10.1kV\n333\n0.2/0.2 30/30VA',
                    name_source: 'llm_extract',
                    source_text: '计量PT1100.10.1kV\n333\n0.2/0.2 30/30VA',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      voltage_ratio: '110/0.1/0.1kV',
                      burden_va_config: '30/30VA',
                      accuracy_class_config: '0.2/0.2'
                    },
                    evidence_world_bboxes: [
                      [
                        -191579.82546822992, -147972.0109825556,
                        -191572.78392622655, -147961.36057552454
                      ],
                      [
                        -191812.2740186278, -147972.01098255583,
                        -191803.68677228218, -147961.36057552474
                      ]
                    ]
                  },
                  {
                    name: '电压互感器',
                    count: 1,
                    model: '电压互感器（A、C相）\n10/0.1kV 6P',
                    name_source: 'llm_extract',
                    source_text: '电压互感器（A、C相）\n10/0.1kV 6P',
                    extraction_result: {
                      remark: 'A、C相',
                      product_model: null,
                      voltage_ratio: '10/0.1kV',
                      burden_va_config: null,
                      accuracy_class_config: '6P'
                    },
                    evidence_world_bboxes: [
                      [
                        -191457.19062418622, -148306.4727399769,
                        -191445.0157909558, -148289.60968141534
                      ]
                    ]
                  },
                  {
                    name: '电压互感器',
                    count: 1,
                    model: '电压互感器 10/0.1kV',
                    name_source: 'llm_extract',
                    source_text: '电压互感器 10/0.1kV',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      voltage_ratio: '10/0.1kV',
                      burden_va_config: null,
                      accuracy_class_config: null
                    },
                    evidence_world_bboxes: [
                      [
                        -191699.6457652988, -148381.58455491028,
                        -191693.09431924365, -148370.484190896
                      ]
                    ]
                  },
                  {
                    name: '接地开关',
                    count: 2,
                    model: '故障接地开关 40kA',
                    name_source: 'llm_extract',
                    source_text: '故障接地开关 40kA',
                    extraction_result: {
                      remark: '故障接地开关',
                      product_model: null,
                      rated_current_a: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: '40kA'
                    },
                    evidence_world_bboxes: [
                      [
                        -191778.73741202638, -147975.1070395815,
                        -191767.10168583845, -147968.68545485663
                      ],
                      [
                        -191546.28886162888, -147975.1070395814,
                        -191534.65313544095, -147968.68545485655
                      ]
                    ]
                  },
                  {
                    name: '接地开关',
                    count: 6,
                    model: '接地开关 1250A 40kA/4s',
                    name_source: 'llm_extract',
                    source_text: '接地开关 1250A 40kA/4s',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '1250A',
                      rated_voltage_kv: null,
                      short_time_withstand_current: '40kA/4s'
                    },
                    evidence_world_bboxes: [
                      [
                        -191778.87115600557, -147975.24381609497,
                        -191767.2354298176, -147969.09056472252
                      ],
                      [
                        -191546.42260560807, -147975.24381609494,
                        -191534.7868794201, -147969.0905647225
                      ],
                      [
                        -191600.58891779263, -148067.95267557155,
                        -191592.29679104293, -148063.40585287023
                      ],
                      [
                        -191600.3188405919, -148067.86923361465,
                        -191592.28988747086, -148063.3211782524
                      ],
                      [
                        -191886.57913876942, -148106.64987229084,
                        -191881.36031928923, -148092.06934186482
                      ],
                      [
                        -191447.57053241003, -148106.64987229084,
                        -191442.21789704575, -148092.06934186482
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 6,
                    model: '隔离开关 1250A 40kA/4s',
                    name_source: 'llm_extract',
                    source_text: '隔离开关 1250A 40kA/4s',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '1250A',
                      grounding_config: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: '40kA/4s'
                    },
                    evidence_world_bboxes: [
                      [
                        -191776.73125233882, -147994.10832407392,
                        -191773.25390888035, -147988.08802469785
                      ],
                      [
                        -191544.28270194132, -147994.10832407387,
                        -191540.80535848284, -147988.0880246978
                      ],
                      [
                        -191867.44346734212, -148103.98211224217,
                        -191863.56280670303, -148099.1661874652
                      ],
                      [
                        -191428.30104509863, -148103.98211224217,
                        -191424.42038445952, -148099.1661874652
                      ],
                      [
                        -191774.0222173206, -148155.66065077673,
                        -191770.00774076008, -148149.77452049378
                      ],
                      [
                        -191541.57366692304, -148155.66065077673,
                        -191537.55919036252, -148149.77452049378
                      ]
                    ]
                  },
                  {
                    name: '隔离开关',
                    count: 2,
                    model: '隔离开关 1250A 40kA',
                    name_source: 'llm_extract',
                    source_text: '隔离开关 1250A 40kA',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '1250A',
                      grounding_config: null,
                      rated_voltage_kv: null,
                      short_time_withstand_current: '40kA'
                    },
                    evidence_world_bboxes: [
                      [
                        -191916.44493251725, -148152.3162585705,
                        -191912.83515351996, -148146.29635259928
                      ],
                      [
                        -191327.44698322372, -148155.66065077673,
                        -191323.7001384339, -148150.30962324678
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 6,
                    model:
                      '电流互感器\n2*200/5A 0.2S 20VA\n2*300/5A 0.5/5P30/5P30',
                    name_source: 'llm_extract',
                    source_text:
                      '电流互感器\n2*200/5A 0.2S 20VA\n2*300/5A 0.5/5P30/5P30',
                    extraction_result: {
                      remark: null,
                      current_ratio: '2*200/5A',
                      product_model: null,
                      burden_va_config: '20VA',
                      accuracy_class_config: '0.2S'
                    },
                    evidence_world_bboxes: [
                      [
                        -191778.12441878853, -148016.38410598584,
                        -191772.99613736494, -148002.93065367758
                      ],
                      [
                        -191783.39130241275, -148016.38410598584,
                        -191778.67882759107, -148003.06934906222
                      ],
                      [
                        -191788.51958383634, -148016.52280137045,
                        -191783.80710901465, -148002.93065367758
                      ],
                      [
                        -191545.67586839103, -148016.3841059858,
                        -191540.54758696744, -148002.93065367755
                      ],
                      [
                        -191550.94275201525, -148016.3841059858,
                        -191546.23027719356, -148003.06934906216
                      ],
                      [
                        -191555.9324312382, -148016.52280137042,
                        -191551.35855861715, -148002.93065367755
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 12,
                    model: '电流互感器2*150/5A\n5P30/5P30/0.5',
                    name_source: 'llm_extract',
                    source_text: '电流互感器2*150/5A\n5P30/5P30/0.5',
                    extraction_result: {
                      remark: null,
                      current_ratio: '2*150/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '5P30/5P30/0.5'
                    },
                    evidence_world_bboxes: [
                      [
                        -191921.39166669868, -148113.8616560997,
                        -191916.9797145909, -148103.83079190218
                      ],
                      [
                        -191916.57862803564, -148113.72791124374,
                        -191912.16667592787, -148103.6970470462
                      ],
                      [
                        -191911.6318938542, -148113.72791124374,
                        -191906.2840731175, -148103.96453675814
                      ],
                      [
                        -191778.0366938811, -148113.59416638777,
                        -191773.2193220085, -148103.6970470462
                      ],
                      [
                        -191783.25551340976, -148113.72791124374,
                        -191778.5719574225, -148103.83079190218
                      ],
                      [
                        -191788.2067011677, -148113.8616560997,
                        -191783.6569610658, -148103.6970470462
                      ],
                      [
                        -191545.58814348353, -148113.72791124374,
                        -191540.63695572558, -148103.6970470462
                      ],
                      [
                        -191550.8069630122, -148113.72791124374,
                        -191546.12340702495, -148103.6970470462
                      ],
                      [
                        -191555.75815077018, -148113.8616560997,
                        -191551.20841066827, -148103.6970470462
                      ],
                      [
                        -191331.99672332563, -148113.72791124374,
                        -191326.51027202627, -148103.6970470462
                      ],
                      [
                        -191336.94791108358, -148113.72791124374,
                        -191332.53198686702, -148103.83079190218
                      ],
                      [
                        -191341.89909884153, -148113.72791124374,
                        -191337.61699051035, -148103.83079190218
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 2,
                    model: 'LRB-60\n100/5A,10P20',
                    name_source: 'llm_cache',
                    source_text: 'LRB-60\n100/5A,10P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '100/5A',
                      product_model: 'LRB-60',
                      burden_va_config: null,
                      accuracy_class_config: '10P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191815.3669272491, -148223.3011173648,
                        -191808.94450263935, -148217.28288028273
                      ],
                      [
                        -191582.91837685154, -148223.3011173648,
                        -191576.4959522418, -148217.28288028273
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 2,
                    model: '间隙105-115mm\n间隙CT 100/5A,10P20',
                    name_source: 'llm_extract',
                    source_text: '间隙105-115mm\n间隙CT 100/5A,10P20',
                    extraction_result: null,
                    evidence_world_bboxes: [
                      [
                        -191815.3669272491, -148223.45069718995,
                        -191808.94450263935, -148217.42871139382
                      ],
                      [
                        -191582.91837685154, -148223.45069718995,
                        -191576.4959522418, -148217.42871139382
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n3000/5A\n0.5/5P20/5P20',
                    name_source: 'llm_extract',
                    source_text: '电流互感器\n3000/5A\n0.5/5P20/5P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '3000/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '0.5/5P20/5P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191789.30459694433, -148308.9302844578,
                        -191784.59406727593, -148299.6314563328
                      ],
                      [
                        -191784.32489415203, -148309.0650500828,
                        -191779.88353760756, -148299.4966907078
                      ],
                      [
                        -191779.4797779217, -148308.9302844578,
                        -191774.90383481528, -148299.6314563328
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 1,
                    model: '电流互感器\n400/5A\n0.2/0.5/5P20',
                    name_source: 'llm_extract',
                    source_text: '电流互感器\n400/5A\n0.2/0.5/5P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '400/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '0.2/0.5/5P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191921.77349378457, -148311.5729943968,
                        -191916.5151499326, -148308.4733850218
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n300/5A\n0.5/5P20',
                    name_source: 'llm_extract',
                    source_text: '电流互感器\n300/5A\n0.5/5P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '300/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '0.5/5P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191367.45722352574, -148311.5729943968,
                        -191362.46853833282, -148305.1042443968
                      ],
                      [
                        -191362.19887967373, -148311.5729943968,
                        -191357.4798531399, -148305.1042443968
                      ],
                      [
                        -191357.4798531399, -148311.7077600218,
                        -191352.6259972765, -148305.2390100218
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 2,
                    model: '电流互感器\n100/5A\n0.5/5P20',
                    name_source: 'llm_extract',
                    source_text: '电流互感器\n100/5A\n0.5/5P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '100/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '0.5/5P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191751.55332161358, -148389.1476616616,
                        -191746.2949777616, -148382.6789116616
                      ],
                      [
                        -191741.84560988683, -148389.4171929116,
                        -191736.4524367053, -148382.8136772866
                      ]
                    ]
                  },
                  {
                    name: '电流互感器',
                    count: 3,
                    model: '电流互感器\n3000/5A\n0.5/5P20',
                    name_source: 'llm_extract',
                    source_text: '电流互感器\n3000/5A\n0.5/5P20',
                    extraction_result: {
                      remark: null,
                      current_ratio: '3000/5A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: '0.5/5P20'
                    },
                    evidence_world_bboxes: [
                      [
                        -191801.79156739984, -148391.3117241616,
                        -191796.52852447712, -148385.1808647866
                      ],
                      [
                        -191796.10179126717, -148391.4543022866,
                        -191791.69221476433, -148384.8957085366
                      ],
                      [
                        -191791.54997036103, -148391.5968804116,
                        -191786.99814945488, -148385.0382866616
                      ]
                    ]
                  },
                  {
                    name: '断路器',
                    count: 6,
                    model: '断路器\n1250A 40kA',
                    name_source: 'llm_extract',
                    source_text: '断路器\n1250A 40kA',
                    extraction_result: {
                      remark: null,
                      product_model: null,
                      rated_current_a: '1250A',
                      rated_voltage_kv: null,
                      breaking_current_ka: '40kA'
                    },
                    evidence_world_bboxes: [
                      [
                        -191551.07003420146, -148037.49203857675,
                        -191546.5871600711, -148027.29532087536
                      ],
                      [
                        -191783.51858459896, -148037.4920385768,
                        -191779.0357104686, -148027.43127711143
                      ],
                      [
                        -191916.8460190725, -148127.8695981893,
                        -191912.70145800154, -148120.6478212739
                      ],
                      [
                        -191782.98788163907, -148128.00333479885,
                        -191779.1072209639, -148120.91529449297
                      ],
                      [
                        -191550.67314712686, -148128.13707140842,
                        -191546.524854681, -148120.78155788343
                      ],
                      [
                        -191336.81409519824, -148130.00938394203,
                        -191332.7996186377, -148120.78155788343
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 2,
                    model:
                      'SZ11-20000/110\n110±8*1.25%/10.5kV\nYN.d11\nUk%=10.5\n附有载调压开关',
                    name_source: 'llm_cache',
                    source_text:
                      'SZ11-20000/110\n110±8*1.25%/10.5kV\nYN.d11\nUk%=10.5\n附有载调压开关',
                    extraction_result: {
                      remark: '附有载调压开关',
                      wiring_group: 'YN.d11',
                      product_model: 'SZ11-20000/110',
                      voltage_ratio: '110±8*1.25%/10.5kV',
                      cooling_method: null,
                      short_circuit_impedance_config: 'Uk%=10.5'
                    },
                    evidence_world_bboxes: [
                      [
                        -191797.81284850018, -148235.07651187014,
                        -191765.80430332405, -148177.61053095447
                      ],
                      [
                        -191565.36429810262, -148235.07651187014,
                        -191533.35575292652, -148177.45352007766
                      ]
                    ]
                  },
                  {
                    name: '电力变压器',
                    count: 1,
                    model: 'DKSC-350/10.5\n-100/0.4 ZNyn11',
                    name_source: 'llm_cache',
                    source_text: 'DKSC-350/10.5\n-100/0.4 ZNyn11',
                    extraction_result: {
                      remark: 'ZNyn11',
                      wiring_group: 'ZNyn11',
                      product_model: 'DKSC-350/10.5',
                      voltage_ratio: '100/0.4',
                      cooling_method: null,
                      short_circuit_impedance_config: null
                    },
                    evidence_world_bboxes: [
                      [
                        -191699.6457652988, -148381.70610291313,
                        -191692.96061626292, -148370.20759266155
                      ]
                    ]
                  },
                  {
                    name: '中性点零序CT',
                    count: 4,
                    model: '零序CT∅120 100/1A',
                    name_source: 'llm_extract',
                    source_text: '零序CT∅120 100/1A',
                    extraction_result: {
                      remark: '零序CT∅120',
                      current_ratio: '100/1A',
                      product_model: null,
                      burden_va_config: null,
                      accuracy_class_config: null
                    },
                    evidence_world_bboxes: [
                      [
                        -191915.66017115323, -148270.60942443323,
                        -191910.84683745203, -148265.79450459505
                      ],
                      [
                        -191361.47873022393, -148270.60942443323,
                        -191356.66539652273, -148265.79450459505
                      ],
                      [
                        -191751.4397818745, -148389.12741330435,
                        -191746.22533703153, -148382.97501573333
                      ],
                      [
                        -191741.81311447208, -148389.12741330435,
                        -191736.33126220127, -148382.84126796006
                      ]
                    ]
                  }
                ],
                filtered_equipment_list_devices: []
              },
              param_key_map: null
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
          title: '核查设计分界点',
          origin: 'Q/GDW 10166-2025',
          content: '设计分界点应定义明确，责任边界无模糊或遗漏',
          violations: []
        },
        {
          id: '5',
          title:
            '检查是否具备事件顺序记录（SOE）、事故追忆、无功电压自动控制（VQC）、防误闭锁、操作票、GPS对时等功能',
          origin: 'DL/T 5149-2020',
          content:
            '检查是否具备事件顺序记录（SOE）、事故追忆、无功电压自动控制（VQC）、防误闭锁、操作票、GPS对时等功能',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                '在设计说明中明确是否配置无功电压自动控制（VQC）功能',
                '如配置VQC，应说明其控制策略、调节范围、与无功补偿装置的配合方式',
                '如不配置，应说明原因及替代方案'
              ],
              description:
                "设计说明中缺少关于'无功电压自动控制（VQC）'功能的具体描述，无法确认是否配置该功能。",
              geometry_ref: {
                chapter:
                  '本工程采用支持DL/T860标准的数字式继电保护装置，保护装置以DL/T860规约直接接入站控层和过程层的以太网，在过程层通过光纤以DL/T860.92（IEC61850-9-2）协议接收合并单元发出电流、电压采样信号；保护跳闸采用直接跳闸方式，保护之间的联闭锁信息、失灵启动等信息采用GOOSE网络传输方式；保护柜中不配置操作箱，采用智能终端就地安装模式；110kV采用保护测控一体化装置。\n\n根据本变电站接入系统情况和《继电保护和安全自动装置技术规程（GB/T 14285）》、《国家电网公司2011年新建变电站设计补充规定》（国家电网基建〔2011〕58号）、《智能变电站继电保护技术规范（Q/GDW441）》的规定，系统继电保护装置配置如下：',
                extents: null,
                file_id: '4b6b2033-8c4a-4b24-a762-d7240b9c511d',
                handles: null
              },
              review_trace: null,
              param_key_map: null
            },
            {
              risk_level: 'medium',
              suggestion: [
                '在设计说明中明确是否具备操作票功能',
                '如具备操作票功能，应说明其实现方式（如基于监控系统的操作票管理、与五防系统的集成等）',
                '如不具备，应说明原因及替代方案'
              ],
              description:
                "设计说明中缺少关于'操作票'功能的具体描述，无法确认是否具备操作票功能。",
              geometry_ref: {
                chapter:
                  '本工程采用支持DL/T860标准的数字式继电保护装置，保护装置以DL/T860规约直接接入站控层和过程层的以太网，在过程层通过光纤以DL/T860.92（IEC61850-9-2）协议接收合并单元发出电流、电压采样信号；保护跳闸采用直接跳闸方式，保护之间的联闭锁信息、失灵启动等信息采用GOOSE网络传输方式；保护柜中不配置操作箱，采用智能终端就地安装模式；110kV采用保护测控一体化装置。\n\n根据本变电站接入系统情况和《继电保护和安全自动装置技术规程（GB/T 14285）》、《国家电网公司2011年新建变电站设计补充规定》（国家电网基建〔2011〕58号）、《智能变电站继电保护技术规范（Q/GDW441）》的规定，系统继电保护装置配置如下：',
                extents: null,
                file_id: '4b6b2033-8c4a-4b24-a762-d7240b9c511d',
                handles: null
              },
              review_trace: null,
              param_key_map: null
            }
          ]
        },
        {
          id: '6',
          title:
            '检查电流回路导线截面是否不小于4mm²，电压回路不小于2.5mm²。控制电缆是否为屏蔽铠装电缆',
          origin: 'DL/T 5136-2012',
          content:
            '检查电流回路导线截面是否不小于4mm²，电压回路不小于2.5mm²。控制电缆是否为屏蔽铠装电缆',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                '在设计说明中补充二次回路电缆选型章节',
                '明确电流回路导线截面要求（一般测量回路二次电流为5A时不宜小于4mm²，二次电流为1A时不宜小于2.5mm²；计量回路不应小于4mm²）',
                '明确电压回路导线截面不小于2.5mm²的要求',
                '明确控制电缆应采用屏蔽电缆的要求，并说明是否采用铠装电缆',
                '明确二次电缆屏蔽层接地要求（使用截面不小于4mm²多股铜质软导线可靠连接至接地铜排）'
              ],
              description:
                "设计说明中缺少关于'检查电流回路导线截面是否不小于4mm²，电压回路不小于2.5mm²。控制电缆是否为屏蔽铠装电缆'的相关内容，无法进行审查。",
              geometry_ref: {
                chapter:
                  '根据系统规划，本工程主变终期容量为4×240MVA。220kV远景出线10回，110kV远景出线14回，10kV远景出线30回。\n\n站址位于福清市江镜镇，根据《福建省电力系统污区分布图》（2024年版），本站处于e级污区，距海仅1km。为了提高变电站设备运行的可靠性，减少占地面积，减少对周围环境的影响，满足在规划用地中进行变电站总平面布置，并结合《基建技术〔2024〕54号 国网基建部关于发布输变电工程通用设计通用设备应用目录（2025年版）的通知》通用设计方案，考虑本工程系统规模、线路出线等工程实际情况，并结合可研阶段方案比选结论，本工程初设阶段方案采用省公司通用设计实施方案FJ-220-A2-7方案进行优化设计。',
                extents: null,
                file_id: '4b6b2033-8c4a-4b24-a762-d7240b9c511d',
                handles: null
              },
              review_trace: null,
              param_key_map: null
            }
          ]
        },
        {
          id: '7',
          title: '短路电流审查',
          origin: 'GB/T 15544.1-2023',
          content: '短路电流审查',
          violations: [
            {
              risk_level: 'high',
              suggestion: [
                "在设计说明的'短路电流计算'章节中补充以下参数：基准容量, 高压侧基准电压, 低压侧基准电压, 架空线路长度, 电缆线路长度, 系统短路容量, 上级系统主变压器容量, 上级系统主变压器短路阻抗比"
              ],
              description: '缺少短路电流计算的关键参数，无法进行计算验证。',
              geometry_ref: {
                chapter:
                  '根据系统规划，本工程主变终期容量为4×240MVA。220kV远景出线10回，110kV远景出线14回，10kV远景出线30回。\n\n站址位于福清市江镜镇，根据《福建省电力系统污区分布图》（2024年版），本站处于e级污区，距海仅1km。为了提高变电站设备运行的可靠性，减少占地面积，减少对周围环境的影响，满足在规划用地中进行变电站总平面布置，并结合《基建技术〔2024〕54号 国网基建部关于发布输变电工程通用设计通用设备应用目录（2025年版）的通知》通用设计方案，考虑本工程系统规模、线路出线等工程实际情况，并结合可研阶段方案比选结论，本工程初设阶段方案采用省公司通用设计实施方案FJ-220-A2-7方案进行优化设计。',
                extents: null,
                file_id: '4b6b2033-8c4a-4b24-a762-d7240b9c511d',
                handles: null
              },
              review_trace: {
                defaults_applied: {
                  cable_unit_reactance_ohm_per_km: 0.12,
                  overhead_line_unit_reactance_ohm_per_km: 0.4
                },
                extracted_parameters: {
                  cable_length_km: null,
                  base_capacity_mva: null,
                  hv_base_voltage_kv: null,
                  lv_base_voltage_kv: null,
                  overhead_line_length_km: null,
                  transformer_capacity_mva: 240,
                  normal_supply_hv_bus_Isc_ka: 45.5,
                  normal_supply_lv_bus_Isc_ka: 24.07,
                  transformer_impedance_percent: 14,
                  cable_unit_reactance_ohm_per_km: 0.12,
                  upstream_short_circuit_capacity_mva: null,
                  upstream_main_transformer_capacity_mva: null,
                  overhead_line_unit_reactance_ohm_per_km: 0.4,
                  upstream_main_transformer_impedance_percent: null
                }
              },
              param_key_map: {
                calculation_data_map: {
                  hv_bus_Isc_ka: '高压侧母线短路电流 (kA)',
                  lv_bus_Isc_ka: '低压侧母线短路电流 (kA)'
                },
                calculation_details_map: {
                  Ij_hv: '高压侧基准电流 (kA)',
                  Ij_lv: '低压侧基准电流 (kA)',
                  Zj_hv: '高压侧基准电抗 (Ω)',
                  Zj_lv: '低压侧基准电抗 (Ω)',
                  X_line_ohm: '线路有名电抗 (Ω)',
                  X_sys_star: '系统标幺电抗',
                  X_line_star: '线路标幺电抗',
                  X_total_hv_star: '高压侧总标幺电抗',
                  X_total_lv_star: '低压侧总标幺电抗',
                  X_transformer_star: '变压器标幺电抗'
                },
                extracted_parameters_map: {
                  cable_length_km: '电缆长度 (km)',
                  base_capacity_mva: '基准容量 (MVA)',
                  hv_base_voltage_kv: '高压侧基准电压 (kV)',
                  lv_base_voltage_kv: '低压侧基准电压 (kV)',
                  overhead_line_length_km: '架空线长度 (km)',
                  transformer_capacity_mva: '变压器容量 (MVA)',
                  normal_supply_hv_bus_Isc_ka:
                    '正常运行高压侧母线短路电流 (kA)',
                  normal_supply_lv_bus_Isc_ka:
                    '正常运行低压侧母线短路电流 (kA)',
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
        }
      ],
      category: '设计说明'
    }
  ],
  discipline_id: '5a584a7f-b999-4f61-9344-216c51bbb736'
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

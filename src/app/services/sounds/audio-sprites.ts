import { AudioSprite } from 'src/app/types/pointmotion';

type Set = 'set1' | 'set2';

export const audioSprites: {
  ambientSprite: AudioSprite[];
  danceSprite: AudioSprite[];
  rockSprite: AudioSprite[];
  jazzSprite: AudioSprite[];
  classicalSprite: AudioSprite[];
  beatBoxer: AudioSprite;
} = {
  ambientSprite: [
    {
      ambient1: [0, 6295.510204081633],
      ambient2: [8000, 6295.510204081634],
      ambient3: [16000, 6295.510204081634],
      ambient4: [24000, 6295.510204081634],
      ambient5: [32000, 6295.51020408163],
      ambient6: [40000, 6295.51020408163],
      ambient7: [48000, 6295.51020408163],
      ambient8: [56000, 6295.51020408163],
      ambient9: [64000, 6295.510204081637],
      ambient10: [72000, 6295.510204081637],
      ambient11: [80000, 6295.510204081637],
      ambient12: [88000, 6295.510204081637],
      ambient13: [96000, 6295.510204081637],
      ambient14: [104000, 6295.510204081637],
      ambient15: [112000, 6295.510204081637],
      ambient16: [120000, 11284.897959183667],
    },
    {
      ambient1: [186000, 10057.14285714285],
      ambient2: [198000, 10057.14285714285],
      ambient3: [210000, 10057.14285714285],
      ambient4: [0, 10057.142857142857],
      ambient5: [12000, 10057.142857142857],
      ambient6: [24000, 10057.142857142857],
      ambient7: [36000, 10057.142857142857],
      ambient8: [48000, 10057.142857142857],
      ambient9: [60000, 10057.14285714285],
      ambient10: [72000, 10057.14285714285],
      ambientBacktrack: [84000, 100075.10204081632, true],
    },
  ],
  danceSprite: [
    {
      dance1: [0, 3448.1632653061224],
      dance2: [5000, 3448.163265306123],
      dance3: [10000, 3448.163265306123],
      dance4: [15000, 3448.163265306121],
      dance5: [20000, 3448.163265306121],
      dance6: [25000, 3448.163265306121],
      dance7: [30000, 3448.163265306121],
      dance8: [35000, 3448.163265306121],
      dance9: [40000, 3448.163265306121],
      dance10: [45000, 3448.163265306121],
      dance11: [50000, 3448.163265306121],
      dance12: [55000, 3448.163265306121],
      dance13: [60000, 3448.163265306121],
      dance14: [65000, 3448.163265306121],
      dance15: [70000, 3448.163265306121],
      dance16: [75000, 3448.163265306121],
      dance17: [80000, 3448.163265306121],
      dance18: [85000, 3448.163265306121],
      dance19: [90000, 3448.163265306121],
      dance20: [95000, 3448.163265306121],
      dance21: [100000, 3448.163265306121],
      dance22: [105000, 3448.163265306121],
      dance23: [110000, 3448.163265306121],
      dance24: [115000, 3448.163265306121],
      dance25: [120000, 3448.163265306121],
      dance26: [125000, 3448.163265306135],
      dance27: [130000, 3448.163265306135],
      dance28: [135000, 3448.163265306135],
      dance29: [140000, 3448.163265306135],
      dance30: [145000, 3448.163265306135],
      dance31: [150000, 3448.163265306135],
      dance32: [155000, 3448.163265306135],
      danceBacktrack: [160000, 108225.30612244895, true],
    },
    {
      danceBacktrack: [0, 80065.30612244898, true],
      dance1: [82000, 8071.836734693875],
      dance2: [92000, 8071.836734693875],
      dance3: [102000, 8071.836734693875],
      dance4: [112000, 8071.836734693875],
      dance5: [122000, 8071.836734693875],
      dance6: [132000, 8071.836734693875],
      dance7: [142000, 8071.836734693875],
      dance8: [152000, 8071.836734693875],
      dance9: [162000, 8071.836734693875],
      dance10: [172000, 8071.836734693875],
    },
  ],
  rockSprite: [
    {
      rock1: [0, 3186.9387755102043],
      rock2: [5000, 3186.9387755102034],
      rock3: [10000, 3186.9387755102034],
      rock4: [15000, 3186.9387755102034],
      rock5: [20000, 3186.9387755102034],
      rock6: [25000, 3186.9387755102034],
      rock7: [30000, 3186.9387755102066],
      rock8: [35000, 3186.9387755102066],
      rock9: [40000, 3186.9387755102066],
      rock10: [45000, 3186.9387755102066],
      rock11: [50000, 3186.9387755102066],
      rock12: [55000, 3186.9387755102066],
      rock13: [60000, 3186.9387755102066],
      rock14: [65000, 3186.9387755102],
      rock15: [70000, 3186.9387755102],
      rock16: [75000, 3186.9387755102],
      rockBacktrack: [80000, 56137.14285714286, true],
    },
    {
      rockBacktrack: [0, 88946.9387755102, true],
      rock1: [90000, 8960.000000000007],
      rock2: [100000, 8960.000000000007],
      rock3: [110000, 8960.000000000007],
      rock4: [120000, 8960.000000000007],
      rock5: [130000, 8960.000000000007],
      rock6: [140000, 8960.000000000007],
      rock7: [150000, 8960.000000000007],
      rock8: [160000, 8960.000000000007],
      rock9: [170000, 8960.000000000007],
      rock10: [180000, 8960.000000000007],
    },
  ],

  jazzSprite: [
    {
      jazzBacktrack: [0, 65567.34693877552, true],
      jazz1: [67000, 8071.836734693875],
      jazz2: [77000, 8071.836734693875],
      jazz3: [87000, 8071.836734693875],
      jazz4: [97000, 8071.836734693875],
      jazz5: [107000, 8071.836734693875],
      jazz6: [117000, 8071.836734693875],
      jazz7: [127000, 8071.836734693875],
      jazz8: [137000, 8071.836734693875],
      jazz9: [147000, 8071.836734693875],
    },
    {
      jazzBacktrack: [0, 87327.3469387755, true],
      jazz1: [89000, 8803.265306122456],
      jazz2: [99000, 8803.265306122456],
      jazz3: [109000, 8803.265306122456],
      jazz4: [119000, 8803.265306122456],
      jazz5: [129000, 8803.265306122456],
      jazz6: [139000, 8803.265306122456],
      jazz7: [149000, 8803.265306122456],
      jazz8: [159000, 8803.265306122456],
      jazz9: [169000, 8803.265306122456],
      jazz10: [179000, 8803.265306122456],
    },
  ],

  classicalSprite: [
    {
      set1classical10: [0, 4519.183673469388],
      set1classical11: [6000, 4519.183673469389],
      set1classical12: [12000, 4519.183673469389],
      set2classical1: [18000, 4519.183673469389],
      set2classical2: [24000, 4519.183673469389],
      set2classical3: [30000, 4519.183673469385],
      set2classical4: [36000, 4519.183673469385],
      set2classical5: [42000, 4519.183673469385],
      set2classical6: [48000, 4519.183673469385],
      set2classical7: [54000, 4519.183673469385],
      set2classical8: [60000, 4519.183673469385],
      set2classical9: [66000, 4519.183673469385],
      set2classical10: [72000, 4519.183673469385],
      set2classical11: [78000, 4519.183673469385],
      set2classical12: [84000, 4519.183673469385],
      set3classical1: [90000, 4519.183673469385],
      set3classical2: [96000, 4519.183673469385],
      set3classical3: [102000, 4519.183673469385],
      set3classical4: [108000, 4519.183673469385],
      set3classical5: [114000, 4519.183673469385],
      set3classical6: [120000, 4519.183673469385],
      set3classical7: [126000, 4519.183673469399],
      set3classical8: [132000, 4519.183673469399],
      set3classical9: [138000, 4519.183673469399],
      set3classical10: [144000, 4519.183673469399],
      set3classical11: [150000, 4519.183673469399],
      set3classical12: [156000, 4519.183673469399],
      set3classical13: [162000, 4519.183673469399],
      set3classical14: [168000, 4519.183673469399],
      classicalBacktrack1: [174000, 62275.918367346945, true],
      classicalBacktrack2: [238000, 53394.28571428573, true],
      classicalBacktrack3: [293000, 62275.918367346945, true],
      set1classical1: [357000, 4519.183673469399],
      set1classical2: [363000, 4519.183673469399],
      set1classical3: [369000, 4519.183673469399],
      set1classical4: [375000, 4519.183673469399],
      set1classical5: [381000, 4519.183673469399],
      set1classical6: [387000, 4519.183673469399],
      set1classical7: [393000, 4519.183673469399],
      set1classical8: [399000, 4519.183673469399],
      set1classical9: [405000, 4519.183673469399],
    },
    {
      classicalBacktrack: [0, 106736.32653061225, true],
      classical1: [108000, 10736.326530612245],
      classical2: [120000, 10736.326530612245],
      classical3: [132000, 10736.326530612245],
      classical4: [144000, 10736.326530612245],
      classical5: [156000, 10736.326530612245],
      classical6: [168000, 10736.326530612245],
      classical7: [180000, 10736.326530612245],
      classical8: [192000, 10736.326530612245],
      classical9: [204000, 10736.326530612245],
      classical10: [216000, 10736.326530612245],
    },
  ],

  beatBoxer: {
    note_1: [0, 2880],
    note_2: [4000, 3072.018140589569],
    note_3: [9000, 2495.986394557823],
    note_4: [13000, 2135.9863945578236],
    note_5: [17000, 2304.013605442176],
    note_6: [21000, 1944.0136054421764],
    note_7: [24000, 2688.0045351473923],
    note_8: [28000, 2304.013605442176],
    note_9: [32000, 2304.013605442179],
    note_10: [36000, 2495.986394557825],
    note_11: [40000, 2495.986394557825],
    note_12: [44000, 1944.01360544218],
    note_13: [47000, 1752.0181405895698],
    note_14: [50000, 1560.0000000000023],
    note_15: [53000, 1560.0000000000023],
    note_16: [56000, 1008.0045351473927],
    note_17: [59000, 1560.0000000000023],
    note_18: [62000, 1752.0181405895698],
    note_19: [65000, 1368.0045351473923],
    note_20: [68000, 1368.0045351473923],
    note_21: [71000, 1368.0045351473923],
    note_22: [74000, 1079.9999999999982],
    note_23: [77000, 1008.0045351473927],
    note_24: [80000, 2304.013605442179],
    note_25: [84000, 1368.0045351473923],
    note_26: [87000, 1368.0045351473923],
    note_27: [90000, 1944.01360544218],
    note_28: [93000, 2304.013605442179],
    note_29: [97000, 1752.0181405895698],
    note_30: [100000, 1560.0000000000023],
    note_31: [103000, 2112.018140589569],
    note_32: [107000, 1560.0000000000023],
    note_33: [110000, 1368.0045351473923],
    note_34: [113000, 1560.0000000000023],
    note_35: [116000, 1560.0000000000023],
    note_36: [119000, 1368.0045351473923],
    note_37: [122000, 1560.0000000000023],
    note_38: [125000, 1752.0181405895698],
    note_39: [128000, 1560.0000000000023],
    note_40: [131000, 1752.0181405895698],
    note_41: [134000, 2112.018140589555],
    note_42: [138000, 1944.0136054421657],
    note_43: [141000, 1008.0045351473927],
    note_44: [144000, 2304.013605442179],
    note_45: [148000, 2688.0045351473996],
    note_46: [152000, 1752.0181405895698],
    note_47: [155000, 1368.0045351474064],
    note_48: [158000, 3815.9863945578254],
    note_49: [163000, 2112.018140589555],
    note_50: [167000, 1752.0181405895698],
    note_51: [170000, 3048.0045351473846],
    note_52: [175000, 1752.0181405895698],
    note_53: [178000, 2495.9863945578318],
    note_54: [182000, 1560.0000000000023],
    note_55: [185000, 1944.0136054421657],
    note_56: [188000, 2304.013605442179],
    note_57: [192000, 2495.9863945578318],
    note_58: [196000, 2495.9863945578318],
    note_59: [200000, 3624.013605442173],
    note_60: [205000, 2495.9863945578318],
    note_61: [209000, 2304.013605442179],
    note_62: [213000, 2304.013605442179],
    note_63: [217000, 2304.013605442179],
    note_64: [221000, 1752.0181405895698],
    note_65: [224000, 1752.0181405895698],
    note_66: [227000, 2304.013605442179],
    note_67: [231000, 2495.9863945578318],
    note_68: [235000, 1944.0136054421657],
    note_69: [238000, 4560.000000000002],
    note_70: [244000, 2784.013605442169],
    note_71: [248000, 1752.0181405895698],
    note_72: [251000, 2304.013605442179],
    note_73: [255000, 2639.9999999999864],
    note_74: [259000, 2688.0045351473996],
    note_75: [263000, 2112.018140589555],
    note_76: [267000, 3048.004535147413],
    note_77: [272000, 3048.004535147413],
    note_78: [277000, 3815.9863945577968],
    note_79: [282000, 2399.9999999999773],
    note_80: [286000, 1752.0181405895414],
    note_81: [289000, 2304.013605442151],
    note_82: [293000, 2040.0000000000205],
    note_83: [297000, 1944.0136054421941],
    note_84: [300000, 1944.0136054421941],
    note_85: [303000, 1368.0045351474064],
    note_86: [306000, 2688.0045351473996],
    note_87: [310000, 2495.9863945578036],
    note_88: [314000, 2975.9863945578218],
    note_89: [318000, 1944.0136054421941],
    note_90: [321000, 2688.0045351473996],
    note_91: [325000, 3744.0136054421487],
    note_92: [330000, 2112.018140589555],
    note_93: [334000, 1944.0136054421941],
    note_94: [337000, 1368.0045351474064],
    note_95: [340000, 2304.013605442151],
    note_96: [344000, 1752.0181405895414],
    note_97: [347000, 1368.0045351474064],
    note_98: [350000, 1752.0181405895414],
    note_99: [353000, 2040.0000000000205],
    note_100: [357000, 2975.9863945578218],
    note_101: [361000, 2879.9999999999955],
    note_102: [365000, 4655.986394557829],
    note_103: [371000, 2879.9999999999955],
    note_104: [375000, 3432.0181405895482],
    note_105: [380000, 3432.0181405895482],
    note_106: [385000, 2879.9999999999955],
    note_107: [389000, 1944.0136054421941],
    note_108: [392000, 2495.9863945578036],
    note_109: [396000, 1752.0181405895414],
    note_110: [399000, 2304.013605442151],
    note_111: [403000, 2304.013605442151],
    note_112: [407000, 2112.018140589555],
    note_113: [411000, 2304.013605442151],
    note_114: [415000, 2112.018140589555],
    note_115: [419000, 1368.0045351474064],
    note_116: [422000, 2688.0045351473996],
    note_117: [426000, 3432.0181405895482],
    note_118: [431000, 3240.000000000009],
    note_119: [436000, 2688.0045351473996],
    note_120: [440000, 1752.0181405895414],
    note_121: [443000, 2879.9999999999955],
    note_122: [447000, 1752.0181405895414],
    note_123: [450000, 2304.013605442151],
    note_124: [454000, 2112.018140589555],
    note_125: [458000, 2304.013605442151],
    note_126: [462000, 2304.013605442151],
    note_127: [466000, 2304.013605442151],
    note_128: [470000, 1560.0000000000023],
    note_129: [473000, 3048.004535147413],
    note_130: [478000, 2495.9863945578036],
    note_131: [482000, 3432.0181405895482],
    note_132: [487000, 2688.0045351473996],
    note_133: [491000, 1944.0136054421941],
    note_134: [494000, 2688.0045351473996],
    note_135: [498000, 1752.0181405895414],
    note_136: [501000, 2112.018140589555],
    note_137: [505000, 2304.013605442151],
    note_138: [509000, 2304.013605442151],
    note_139: [513000, 2112.018140589612],
    note_140: [517000, 1944.0136054421373],
    note_141: [520000, 1559.9999999999454],
    note_142: [523000, 1944.0136054421373],
    note_143: [526000, 1944.0136054421373],
    note_144: [529000, 1368.0045351474064],
    note_145: [532000, 2879.9999999999955],
    note_146: [536000, 2495.9863945578036],
    note_147: [540000, 4559.999999999945],
    note_148: [546000, 3240.000000000009],
  },
};

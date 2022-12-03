import { AudioSprite, Genre } from 'src/app/types/pointmotion';

type ChordType = 'alto' | 'bass' | 'tenor' | 'soprano';

export const soundExporerAudio: {
  [genre in Genre]: { [key in ChordType]: AudioSprite }[];
} = {
  classical: [
    {
      alto: {
        Alto_10: [0, 2873.4693877551017],
        Alto_11: [4000, 2873.4693877551017],
        Alto_12: [8000, 2873.469387755101],
        Alto_13: [12000, 2873.469387755101],
        Alto_14: [16000, 2873.469387755101],
        Alto_15: [20000, 2873.469387755101],
        Alto_16: [24000, 2873.469387755101],
        Alto_1: [28000, 2873.469387755101],
        Alto_2: [32000, 2873.469387755101],
        Alto_3: [36000, 2873.469387755101],
        Alto_4: [40000, 2873.469387755101],
        Alto_5: [44000, 2873.469387755101],
        Alto_6: [48000, 2873.469387755101],
        Alto_7: [52000, 2873.469387755101],
        Alto_8: [56000, 2873.469387755101],
        Alto_9: [60000, 2873.469387755101],
      },
      bass: {
        Bass_10: [0, 2873.4693877551017],
        Bass_11: [4000, 2873.4693877551017],
        Bass_12: [8000, 2873.469387755101],
        Bass_13: [12000, 2873.469387755101],
        Bass_14: [16000, 2873.469387755101],
        Bass_15: [20000, 2873.469387755101],
        Bass_16: [24000, 2873.469387755101],
        Bass_1: [28000, 2873.469387755101],
        Bass_2: [32000, 2873.469387755101],
        Bass_3: [36000, 2873.469387755101],
        Bass_4: [40000, 2873.469387755101],
        Bass_5: [44000, 2873.469387755101],
        Bass_6: [48000, 2873.469387755101],
        Bass_7: [52000, 2873.469387755101],
        Bass_8: [56000, 2873.469387755101],
        Bass_9: [60000, 2873.469387755101],
      },
      soprano: {
        Soprano_10: [0, 2873.4693877551017],
        Soprano_11: [4000, 2873.4693877551017],
        Soprano_12: [8000, 2873.469387755101],
        Soprano_13: [12000, 2873.469387755101],
        Soprano_14: [16000, 2873.469387755101],
        Soprano_15: [20000, 2873.469387755101],
        Soprano_16: [24000, 2873.469387755101],
        Soprano_1: [28000, 2873.469387755101],
        Soprano_2: [32000, 2873.469387755101],
        Soprano_3: [36000, 2873.469387755101],
        Soprano_4: [40000, 2873.469387755101],
        Soprano_5: [44000, 2873.469387755101],
        Soprano_6: [48000, 2873.469387755101],
        Soprano_7: [52000, 2873.469387755101],
        Soprano_8: [56000, 2873.469387755101],
        Soprano_9: [60000, 2873.469387755101],
      },
      tenor: {
        Tenor_10: [0, 2873.4693877551017],
        Tenor_11: [4000, 2873.4693877551017],
        Tenor_12: [8000, 2873.469387755101],
        Tenor_13: [12000, 2873.469387755101],
        Tenor_14: [16000, 2873.469387755101],
        Tenor_15: [20000, 2873.469387755101],
        Tenor_16: [24000, 2873.469387755101],
        Tenor_1: [28000, 2873.469387755101],
        Tenor_2: [32000, 2873.469387755101],
        Tenor_3: [36000, 2873.469387755101],
        Tenor_4: [40000, 2873.469387755101],
        Tenor_5: [44000, 2873.469387755101],
        Tenor_6: [48000, 2873.469387755101],
        Tenor_7: [52000, 2873.469387755101],
        Tenor_8: [56000, 2873.469387755101],
        Tenor_9: [60000, 2873.469387755101],
      },
    },
    {
      alto: {
        Alto_1: [0, 6048.004535147392],
        Alto_2: [8000, 6048.004535147392],
        Alto_3: [16000, 6048.004535147392],
        Alto_4: [24000, 6048.004535147392],
        Alto_5: [32000, 6048.004535147392],
        Alto_6: [40000, 6048.004535147392],
        Alto_7: [48000, 6048.004535147392],
        Alto_8: [56000, 6048.004535147392],
        Alto_9: [64000, 6048.004535147385],
        Alto_10: [72000, 6048.004535147385],
        Alto_11: [80000, 6048.004535147385],
        Alto_12: [88000, 6048.004535147385],
        Alto_13: [96000, 6048.004535147385],
        Alto_14: [104000, 6048.004535147385],
        Alto_15: [112000, 6048.004535147385],
        Alto_16: [120000, 6048.004535147385],
        Alto_17: [128000, 12048.004535147385],
      },
      bass: {
        Bass_1: [0, 6048.004535147392],
        Bass_2: [8000, 6048.004535147392],
        Bass_3: [16000, 6048.004535147392],
        Bass_4: [24000, 6048.004535147392],
        Bass_5: [32000, 6048.004535147392],
        Bass_6: [40000, 6048.004535147392],
        Bass_7: [48000, 6048.004535147392],
        Bass_8: [56000, 6048.004535147392],
        Bass_9: [64000, 6048.004535147385],
        Bass_10: [72000, 6048.004535147385],
        Bass_11: [80000, 6048.004535147385],
        Bass_12: [88000, 6048.004535147385],
        Bass_13: [96000, 6048.004535147385],
        Bass_14: [104000, 6048.004535147385],
        Bass_15: [112000, 6048.004535147385],
        Bass_16: [120000, 6048.004535147385],
        Bass_17: [128000, 12048.004535147385],
      },
      soprano: {
        Soprano_1: [0, 6048.004535147392],
        Soprano_2: [8000, 6048.004535147392],
        Soprano_3: [16000, 6048.004535147392],
        Soprano_4: [24000, 6048.004535147392],
        Soprano_5: [32000, 6048.004535147392],
        Soprano_6: [40000, 6048.004535147392],
        Soprano_7: [48000, 6048.004535147392],
        Soprano_8: [56000, 6048.004535147392],
        Soprano_9: [64000, 6048.004535147385],
        Soprano_10: [72000, 6048.004535147385],
        Soprano_11: [80000, 6048.004535147385],
        Soprano_12: [88000, 6048.004535147385],
        Soprano_13: [96000, 6048.004535147385],
        Soprano_14: [104000, 6048.004535147385],
        Soprano_15: [112000, 6048.004535147385],
        Soprano_16: [120000, 6048.004535147385],
        Soprano_17: [128000, 12048.004535147385],
      },
      tenor: {
        Tenor_1: [0, 6048.004535147392],
        Tenor_2: [8000, 6048.004535147392],
        Tenor_3: [16000, 6048.004535147392],
        Tenor_4: [24000, 6048.004535147392],
        Tenor_5: [32000, 6048.004535147392],
        Tenor_6: [40000, 6048.004535147392],
        Tenor_7: [48000, 6048.004535147392],
        Tenor_8: [56000, 5952.018140589573],
        Tenor_9: [63000, 6048.004535147385],
        Tenor_10: [71000, 6048.004535147385],
        Tenor_11: [79000, 6048.004535147385],
        Tenor_12: [87000, 6048.004535147385],
        Tenor_13: [95000, 6048.004535147385],
        Tenor_14: [103000, 6048.004535147385],
        Tenor_15: [111000, 6048.004535147385],
        Tenor_16: [119000, 6048.004535147385],
        Tenor_17: [127000, 12048.004535147385],
      },
    },
  ],
  'surprise me!': [
    {
      alto: {
        Alto_10: [0, 2873.4693877551017],
        Alto_11: [4000, 2873.4693877551017],
        Alto_12: [8000, 2873.469387755101],
        Alto_13: [12000, 2873.469387755101],
        Alto_14: [16000, 2873.469387755101],
        Alto_15: [20000, 2873.469387755101],
        Alto_16: [24000, 2873.469387755101],
        Alto_1: [28000, 2873.469387755101],
        Alto_2: [32000, 2873.469387755101],
        Alto_3: [36000, 2873.469387755101],
        Alto_4: [40000, 2873.469387755101],
        Alto_5: [44000, 2873.469387755101],
        Alto_6: [48000, 2873.469387755101],
        Alto_7: [52000, 2873.469387755101],
        Alto_8: [56000, 2873.469387755101],
        Alto_9: [60000, 2873.469387755101],
      },
      bass: {
        Bass_10: [0, 2873.4693877551017],
        Bass_11: [4000, 2873.4693877551017],
        Bass_12: [8000, 2873.469387755101],
        Bass_13: [12000, 2873.469387755101],
        Bass_14: [16000, 2873.469387755101],
        Bass_15: [20000, 2873.469387755101],
        Bass_16: [24000, 2873.469387755101],
        Bass_1: [28000, 2873.469387755101],
        Bass_2: [32000, 2873.469387755101],
        Bass_3: [36000, 2873.469387755101],
        Bass_4: [40000, 2873.469387755101],
        Bass_5: [44000, 2873.469387755101],
        Bass_6: [48000, 2873.469387755101],
        Bass_7: [52000, 2873.469387755101],
        Bass_8: [56000, 2873.469387755101],
        Bass_9: [60000, 2873.469387755101],
      },
      soprano: {
        Soprano_10: [0, 2873.4693877551017],
        Soprano_11: [4000, 2873.4693877551017],
        Soprano_12: [8000, 2873.469387755101],
        Soprano_13: [12000, 2873.469387755101],
        Soprano_14: [16000, 2873.469387755101],
        Soprano_15: [20000, 2873.469387755101],
        Soprano_16: [24000, 2873.469387755101],
        Soprano_1: [28000, 2873.469387755101],
        Soprano_2: [32000, 2873.469387755101],
        Soprano_3: [36000, 2873.469387755101],
        Soprano_4: [40000, 2873.469387755101],
        Soprano_5: [44000, 2873.469387755101],
        Soprano_6: [48000, 2873.469387755101],
        Soprano_7: [52000, 2873.469387755101],
        Soprano_8: [56000, 2873.469387755101],
        Soprano_9: [60000, 2873.469387755101],
      },
      tenor: {
        Tenor_10: [0, 2873.4693877551017],
        Tenor_11: [4000, 2873.4693877551017],
        Tenor_12: [8000, 2873.469387755101],
        Tenor_13: [12000, 2873.469387755101],
        Tenor_14: [16000, 2873.469387755101],
        Tenor_15: [20000, 2873.469387755101],
        Tenor_16: [24000, 2873.469387755101],
        Tenor_1: [28000, 2873.469387755101],
        Tenor_2: [32000, 2873.469387755101],
        Tenor_3: [36000, 2873.469387755101],
        Tenor_4: [40000, 2873.469387755101],
        Tenor_5: [44000, 2873.469387755101],
        Tenor_6: [48000, 2873.469387755101],
        Tenor_7: [52000, 2873.469387755101],
        Tenor_8: [56000, 2873.469387755101],
        Tenor_9: [60000, 2873.469387755101],
      },
    },
  ],
  dance: [
    {
      alto: {
        Alto_10: [0, 2873.4693877551017],
        Alto_11: [4000, 2873.4693877551017],
        Alto_12: [8000, 2873.469387755101],
        Alto_13: [12000, 2873.469387755101],
        Alto_14: [16000, 2873.469387755101],
        Alto_15: [20000, 2873.469387755101],
        Alto_16: [24000, 2873.469387755101],
        Alto_1: [28000, 2873.469387755101],
        Alto_2: [32000, 2873.469387755101],
        Alto_3: [36000, 2873.469387755101],
        Alto_4: [40000, 2873.469387755101],
        Alto_5: [44000, 2873.469387755101],
        Alto_6: [48000, 2873.469387755101],
        Alto_7: [52000, 2873.469387755101],
        Alto_8: [56000, 2873.469387755101],
        Alto_9: [60000, 2873.469387755101],
      },
      bass: {
        Bass_10: [0, 2873.4693877551017],
        Bass_11: [4000, 2873.4693877551017],
        Bass_12: [8000, 2873.469387755101],
        Bass_13: [12000, 2873.469387755101],
        Bass_14: [16000, 2873.469387755101],
        Bass_15: [20000, 2873.469387755101],
        Bass_16: [24000, 2873.469387755101],
        Bass_1: [28000, 2873.469387755101],
        Bass_2: [32000, 2873.469387755101],
        Bass_3: [36000, 2873.469387755101],
        Bass_4: [40000, 2873.469387755101],
        Bass_5: [44000, 2873.469387755101],
        Bass_6: [48000, 2873.469387755101],
        Bass_7: [52000, 2873.469387755101],
        Bass_8: [56000, 2873.469387755101],
        Bass_9: [60000, 2873.469387755101],
      },
      soprano: {
        Soprano_10: [0, 2873.4693877551017],
        Soprano_11: [4000, 2873.4693877551017],
        Soprano_12: [8000, 2873.469387755101],
        Soprano_13: [12000, 2873.469387755101],
        Soprano_14: [16000, 2873.469387755101],
        Soprano_15: [20000, 2873.469387755101],
        Soprano_16: [24000, 2873.469387755101],
        Soprano_1: [28000, 2873.469387755101],
        Soprano_2: [32000, 2873.469387755101],
        Soprano_3: [36000, 2873.469387755101],
        Soprano_4: [40000, 2873.469387755101],
        Soprano_5: [44000, 2873.469387755101],
        Soprano_6: [48000, 2873.469387755101],
        Soprano_7: [52000, 2873.469387755101],
        Soprano_8: [56000, 2873.469387755101],
        Soprano_9: [60000, 2873.469387755101],
      },
      tenor: {
        Tenor_10: [0, 2873.4693877551017],
        Tenor_11: [4000, 2873.4693877551017],
        Tenor_12: [8000, 2873.469387755101],
        Tenor_13: [12000, 2873.469387755101],
        Tenor_14: [16000, 2873.469387755101],
        Tenor_15: [20000, 2873.469387755101],
        Tenor_16: [24000, 2873.469387755101],
        Tenor_1: [28000, 2873.469387755101],
        Tenor_2: [32000, 2873.469387755101],
        Tenor_3: [36000, 2873.469387755101],
        Tenor_4: [40000, 2873.469387755101],
        Tenor_5: [44000, 2873.469387755101],
        Tenor_6: [48000, 2873.469387755101],
        Tenor_7: [52000, 2873.469387755101],
        Tenor_8: [56000, 2873.469387755101],
        Tenor_9: [60000, 2873.469387755101],
      },
    },
  ],
  rock: [
    {
      alto: {
        Alto_10: [0, 2873.4693877551017],
        Alto_11: [4000, 2873.4693877551017],
        Alto_12: [8000, 2873.469387755101],
        Alto_13: [12000, 2873.469387755101],
        Alto_14: [16000, 2873.469387755101],
        Alto_15: [20000, 2873.469387755101],
        Alto_16: [24000, 2873.469387755101],
        Alto_1: [28000, 2873.469387755101],
        Alto_2: [32000, 2873.469387755101],
        Alto_3: [36000, 2873.469387755101],
        Alto_4: [40000, 2873.469387755101],
        Alto_5: [44000, 2873.469387755101],
        Alto_6: [48000, 2873.469387755101],
        Alto_7: [52000, 2873.469387755101],
        Alto_8: [56000, 2873.469387755101],
        Alto_9: [60000, 2873.469387755101],
      },
      bass: {
        Bass_10: [0, 2873.4693877551017],
        Bass_11: [4000, 2873.4693877551017],
        Bass_12: [8000, 2873.469387755101],
        Bass_13: [12000, 2873.469387755101],
        Bass_14: [16000, 2873.469387755101],
        Bass_15: [20000, 2873.469387755101],
        Bass_16: [24000, 2873.469387755101],
        Bass_1: [28000, 2873.469387755101],
        Bass_2: [32000, 2873.469387755101],
        Bass_3: [36000, 2873.469387755101],
        Bass_4: [40000, 2873.469387755101],
        Bass_5: [44000, 2873.469387755101],
        Bass_6: [48000, 2873.469387755101],
        Bass_7: [52000, 2873.469387755101],
        Bass_8: [56000, 2873.469387755101],
        Bass_9: [60000, 2873.469387755101],
      },
      soprano: {
        Soprano_10: [0, 2873.4693877551017],
        Soprano_11: [4000, 2873.4693877551017],
        Soprano_12: [8000, 2873.469387755101],
        Soprano_13: [12000, 2873.469387755101],
        Soprano_14: [16000, 2873.469387755101],
        Soprano_15: [20000, 2873.469387755101],
        Soprano_16: [24000, 2873.469387755101],
        Soprano_1: [28000, 2873.469387755101],
        Soprano_2: [32000, 2873.469387755101],
        Soprano_3: [36000, 2873.469387755101],
        Soprano_4: [40000, 2873.469387755101],
        Soprano_5: [44000, 2873.469387755101],
        Soprano_6: [48000, 2873.469387755101],
        Soprano_7: [52000, 2873.469387755101],
        Soprano_8: [56000, 2873.469387755101],
        Soprano_9: [60000, 2873.469387755101],
      },
      tenor: {
        Tenor_10: [0, 2873.4693877551017],
        Tenor_11: [4000, 2873.4693877551017],
        Tenor_12: [8000, 2873.469387755101],
        Tenor_13: [12000, 2873.469387755101],
        Tenor_14: [16000, 2873.469387755101],
        Tenor_15: [20000, 2873.469387755101],
        Tenor_16: [24000, 2873.469387755101],
        Tenor_1: [28000, 2873.469387755101],
        Tenor_2: [32000, 2873.469387755101],
        Tenor_3: [36000, 2873.469387755101],
        Tenor_4: [40000, 2873.469387755101],
        Tenor_5: [44000, 2873.469387755101],
        Tenor_6: [48000, 2873.469387755101],
        Tenor_7: [52000, 2873.469387755101],
        Tenor_8: [56000, 2873.469387755101],
        Tenor_9: [60000, 2873.469387755101],
      },
    },
  ],
  jazz: [
    {
      alto: {
        Alto_10: [0, 2873.4693877551017],
        Alto_11: [4000, 2873.4693877551017],
        Alto_12: [8000, 2873.469387755101],
        Alto_13: [12000, 2873.469387755101],
        Alto_14: [16000, 2873.469387755101],
        Alto_15: [20000, 2873.469387755101],
        Alto_16: [24000, 2873.469387755101],
        Alto_1: [28000, 2873.469387755101],
        Alto_2: [32000, 2873.469387755101],
        Alto_3: [36000, 2873.469387755101],
        Alto_4: [40000, 2873.469387755101],
        Alto_5: [44000, 2873.469387755101],
        Alto_6: [48000, 2873.469387755101],
        Alto_7: [52000, 2873.469387755101],
        Alto_8: [56000, 2873.469387755101],
        Alto_9: [60000, 2873.469387755101],
      },
      bass: {
        Bass_10: [0, 2873.4693877551017],
        Bass_11: [4000, 2873.4693877551017],
        Bass_12: [8000, 2873.469387755101],
        Bass_13: [12000, 2873.469387755101],
        Bass_14: [16000, 2873.469387755101],
        Bass_15: [20000, 2873.469387755101],
        Bass_16: [24000, 2873.469387755101],
        Bass_1: [28000, 2873.469387755101],
        Bass_2: [32000, 2873.469387755101],
        Bass_3: [36000, 2873.469387755101],
        Bass_4: [40000, 2873.469387755101],
        Bass_5: [44000, 2873.469387755101],
        Bass_6: [48000, 2873.469387755101],
        Bass_7: [52000, 2873.469387755101],
        Bass_8: [56000, 2873.469387755101],
        Bass_9: [60000, 2873.469387755101],
      },
      soprano: {
        Soprano_10: [0, 2873.4693877551017],
        Soprano_11: [4000, 2873.4693877551017],
        Soprano_12: [8000, 2873.469387755101],
        Soprano_13: [12000, 2873.469387755101],
        Soprano_14: [16000, 2873.469387755101],
        Soprano_15: [20000, 2873.469387755101],
        Soprano_16: [24000, 2873.469387755101],
        Soprano_1: [28000, 2873.469387755101],
        Soprano_2: [32000, 2873.469387755101],
        Soprano_3: [36000, 2873.469387755101],
        Soprano_4: [40000, 2873.469387755101],
        Soprano_5: [44000, 2873.469387755101],
        Soprano_6: [48000, 2873.469387755101],
        Soprano_7: [52000, 2873.469387755101],
        Soprano_8: [56000, 2873.469387755101],
        Soprano_9: [60000, 2873.469387755101],
      },
      tenor: {
        Tenor_10: [0, 2873.4693877551017],
        Tenor_11: [4000, 2873.4693877551017],
        Tenor_12: [8000, 2873.469387755101],
        Tenor_13: [12000, 2873.469387755101],
        Tenor_14: [16000, 2873.469387755101],
        Tenor_15: [20000, 2873.469387755101],
        Tenor_16: [24000, 2873.469387755101],
        Tenor_1: [28000, 2873.469387755101],
        Tenor_2: [32000, 2873.469387755101],
        Tenor_3: [36000, 2873.469387755101],
        Tenor_4: [40000, 2873.469387755101],
        Tenor_5: [44000, 2873.469387755101],
        Tenor_6: [48000, 2873.469387755101],
        Tenor_7: [52000, 2873.469387755101],
        Tenor_8: [56000, 2873.469387755101],
        Tenor_9: [60000, 2873.469387755101],
      },
    },
  ],
};

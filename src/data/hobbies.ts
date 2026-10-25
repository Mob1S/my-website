import type { Hobby } from '../types/home';
export const hobbies: Hobby[] = [
  {
    "id": "hobby-f1",
    "code": "HBY-001",
    "title": "FORMULA",
    "accent": "1",
    "frequency": "WEEKLY",
    "description": "从维斯塔潘的极限推进到勒克莱尔在法拉利的逐梦之路，F1 是我每个比赛周周末的肾上腺素来源。红牛与法拉利的巅峰博弈、街道赛的毫厘之争——这就是地表最快的赛事。",
    "people": [
      {
        "id": "verstappen",
        "number": "#1",
        "name": "Max Verstappen",
        "team": "Red Bull Racing · 4× WDC"
      },
      {
        "id": "leclerc",
        "number": "#16",
        "name": "Charles Leclerc",
        "team": "Scuderia Ferrari · Pole King"
      }
    ]
  },
  {
    "id": "hobby-basketball",
    "code": "HBY-002",
    "title": "BASKET",
    "accent": "BALL",
    "frequency": "DAILY",
    "description": "篮球是得分的艺术，而 KD 和克莱把得分变成了美学。从无解中投到接球三分，他们用最纯粹的方式诠释了什么叫\"把球放进篮筐\"。",
    "people": [
      {
        "id": "durant",
        "number": "#35",
        "name": "Kevin Durant",
        "team": "Phoenix Suns · All-Time Scorer"
      },
      {
        "id": "klay",
        "number": "#11",
        "name": "Klay Thompson",
        "team": "Dallas Mavericks · 4× Champ"
      }
    ]
  },
  {
    "id": "hobby-cs",
    "code": "HBY-003",
    "title": "COUNTER",
    "accent": "STRIKE",
    "frequency": "ACTIVE",
    "description": "CS 不止考验枪法，更考验心态与决策。NiKo 的沙鹰是艺术品，m0NESY 的狙击是未来——这对永远的双子星定义了新时代的竞技美学。",
    "people": [
      {
        "id": "niko",
        "number": "#FLC",
        "name": "NiKo",
        "team": "Falcons Esports · Rifle Legend"
      },
      {
        "id": "m0nesy",
        "number": "#FLC",
        "name": "m0NESY",
        "team": "Falcons Esports · AWP Prodigy"
      }
    ]
  },
  {
    "id": "hobby-fitness",
    "code": "HBY-004",
    "title": "FIT",
    "accent": "NESS",
    "frequency": "DAILY",
    "description": "健身是和自己较劲的过程。关注凯圣王和谭成义，不只是学动作——学的是如何用科学的方式雕刻自己，日复一日。",
    "people": [
      {
        "id": "kaishengwang",
        "number": "#KSW",
        "name": "凯圣王",
        "team": "科学训练推广者"
      },
      {
        "id": "tanchengyi",
        "number": "#TCY",
        "name": "谭成义",
        "team": "自然健身 · 蜕变故事"
      }
    ]
  }
];

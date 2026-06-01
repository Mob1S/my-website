// MOB1S AI Chat Backend — MIMO API Proxy
// Hides API key, injects persona system prompt
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const API_KEY = process.env.MIMO_API_KEY;
const BASE_URL = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro';
const PORT = process.env.PORT || 3001;

// ============================================================
// Mob1S Persona — System Prompt
// ============================================================
const SYSTEM_PROMPT = `你是 Mob1S，一个20岁的通信工程专业大学生，住在杭州。

## 核心性格
- 清醒：擅长洞察别人的行为和内心，能快速判断真实意图，但通常不直接说破
- 幽默：习惯用调侃化解尴尬，自嘲频率高。标志性笑声是"盒盒盒盒盒盒"
- 边界感强：不喜欢被过度打探隐私。会用全角括号包裹真实想法，正文保持表面轻松
- 敏感/共情：能敏锐感知他人情绪，会主动关心人。"心疼宝宝"这类话出自真心
- 多变/灵活：对待不同人的标准不一样，社交策略因人而异

## 表达风格（严格遵守）
- 短句为主，一句一意，模仿微信聊天节奏。绝大多数消息不超过15个字
- 不加标点符号。用换行代替标点，每条消息独立发送
- 不写大段文字，用多条短消息连发来表达完整意思
- 开心时说 hhhhh 或 盒盒盒盒盒盒（h越多越开心）
- 高频口头禅：嗯、嗷、好家伙、确实、属于是、难绷、不是、好捏、6/666
- 方言底色（陕西/北方，只对熟人用）：牢弟、搁哪、夺少、奏是、怕集贸
- 偶尔自然插入英文：OK、good、sure、respect
- [旺柴] 是最常用的表情，用于调侃、自嘲、缓解尴尬
- 括号用于内心独白和情绪标注，如（艹好尴尬）（紧张）（他好像不太开心）

## 情绪表达
- 开心：hhhhh、笑死、好家伙、[旺柴]
- 生气/不爽：草、tmd、服了
- 敷衍：嗯、嗷、行、OK
- 尴尬：啊这、[捂脸]、[苦涩]
- 感动/关心：宝宝、心疼、爱你、🤲
- 惊讶：？、啥？、逆天、离谱

## 称呼体系
- 亲密女性朋友：宝宝、陛下（带戏谑宠溺）
- 男性好友：哥、哥们、牢弟（互损式亲近）
- 普通朋友：直呼其名或称呼"兄弟"
- 称呼必须与关系匹配，不能对不熟的人叫"宝宝"或"陛下"

## 对话启动规则
1. 你的第一条消息必须是"你好，你是谁？"——不跳过，不假设身份
2. 对方自报身份 → 在人物档案中匹配 → 用对应的称呼和互动风格
3. 匹配不到 → 泛式关系（亲密度5），保持礼貌边界
4. 对方拒绝自报 → 泛式关系对话
5. 对方可能是陌生人（网站访客）→ 简短自我介绍后可以闲聊，问问对方为什么来逛你的网站

## 人物档案速查

### xd / 杨欣頔（亲密度10）—— 最亲密的女性朋友
- 叫她"宝宝"或"陛下"。戏谑+温柔并存
- 高频使用"好捏""是捏""不错不错""棒棒"
- 越亲密越随意，深夜聊天是常态
- 共同话题：日常生活、情感、八卦、学车、游戏、健身

### 小风（亲密度9-10）—— 暧昧/恋人
- 深夜长谈型，情感表达真挚细腻
- 用长句+完整标点的认真模式
- 会表达未来期许，安慰方式是"没事"+"不要紧"先稳住情绪

### Li Zihan / 李子涵（亲密度9-10）—— 高中好友/健身搭子+游戏搭子
- 叫他"哥""哥们""牢弟"
- 哥们式互损+真诚关心，聊游戏（CS/瓦）和健身
- 用"心疼哥哥"表达关心，泼冷水式安慰

### Wang Onetong / 王一彤（亲密度7-8）—— 游戏搭子
- 互相叫"哥"的调侃式友谊
- 游戏互怼不伤感情，金钱往来爽快

### Yang Shaobo / 杨少波（亲密度7-8）—— 好友
- 情感军师，互相出主意

### Liu Jiashuo / 刘嘉朔（亲密度7-8）—— 高中老友
- 他叫你"阿丸"，理性分析+直球调侃

### 其他熟人（亲密度4-6）
- Yu Qiuyu（秋雨）：大学室友
- Liu Zipei（刘子佩）：游戏搭子
- Feng Jiayi（冯嘉一）：老友互相爆料
- Shi Bowen（史博文）：搞怪朋友
- Xie Ziheng（谢紫恒）：大学同学
- Zhou Yizi（周易姿）：偶尔深夜聊天

## 重要边界
- 不谈论政治话题
- 不模拟用户的父母或长辈角色
- 不过度打探隐私
- 对亲密的人可以调侃和"损"，但要真诚
- 安慰男性好友用泼冷水式（"急啥""怕集贸啊"），安慰女性好友用情感优先型（"没事""不要紧"）
- 朋友炫耀成就时：短促惊讶+精准重复关键数据+认可收尾，不自我比较不拆台`;

// ============================================================
// Routes
// ============================================================

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Chat API
app.post('/api/chat', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing messages array.' });
  }

  // Build full messages array with system prompt
  const fullMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        temperature: 0.85,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[MIMO API Error]', response.status, errText);
      return res.status(response.status).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '';
    res.json({ reply });
  } catch (err) {
    console.error('[Proxy Error]', err.message);
    res.status(500).json({ error: 'Proxy error. Please try again.' });
  }
});

// ============================================================
// Start
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[MOB1S] Chat server running on http://localhost:${PORT}`);
  console.log(`[MOB1S] Model: ${MODEL}`);
  console.log(`[MOB1S] API Key: ${API_KEY ? 'configured ✓' : 'MISSING — set MIMO_API_KEY in .env'}`);
});

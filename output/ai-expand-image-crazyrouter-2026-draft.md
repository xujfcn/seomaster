---
title: "AI 扩图 API 指南 2026：Uncrop、Outpaint、gpt-image-2 和 Nano Banana 路线怎么选"
slug: ai-expand-image-crazyrouter-2026
summary: "面向开发者和内容团队的 AI 扩图路线选择：什么时候用在线 uncrop，什么时候用 Photoshop 或对话式图片编辑，什么时候用 CrazyRouter 的 gpt-image-2、Nano Banana 2 与 Nano Banana Pro API。"
tag: Guide
language: zh
cover_image_url: https://raw.githubusercontent.com/xujfcn/images/ai-expand-image-crazyrouter-assets/seomaster/ai-expand-image-crazyrouter-cover.svg
meta_title: "AI 扩图 API 指南 2026 | CrazyRouter 示例"
meta_description: "用 CrazyRouter 已验证文档口径对比 AI 扩图、outpainting、图片编辑 API：gpt-image-2、Nano Banana 2、Nano Banana Pro 怎么选，附可复制代码。"
meta_keywords: AI 扩图, AI 外扩, outpaint, uncrop, gpt-image-2, nano banana 2, nano banana pro, CrazyRouter 图片 API
source_reference: "competitor_research/laozhang_blog_zh_2026-05-11 第一篇 ai-expand-image"
docs_checked: "D:/Downloads/new-api-main/newapi/crazyrouter-docs, checked 2026-05-11"
---

# AI 扩图 API 指南 2026：Uncrop、Outpaint、gpt-image-2 和 Nano Banana 路线怎么选

<img src="https://raw.githubusercontent.com/xujfcn/images/ai-expand-image-crazyrouter-assets/seomaster/ai-expand-image-crazyrouter-cover.svg" alt="AI 扩图 API 工作流封面">

把一张裁得太紧的图硬拉宽，结果通常很糟：人物变形、商品边缘发糊、背景纹理重复。AI 扩图的价值不是“把像素撑大”，而是在原画框外生成新内容，让图片能适配横幅、广告位、商品主图和应用内素材。

真正要先判断的是任务类型。只是救比例，用在线 uncrop 工具最快；原图很贵，先用 Photoshop 这类编辑器保住边缘；想用文字把场景继续往外推，可以用对话式图片编辑；需要批量、日志、回放和模型切换，才进入 API 工作流。

这篇 CrazyRouter 示例按本地 `crazyrouter-docs` 在 2026-05-11 的内容复核。代码没有虚构新参数：`gpt-image-2` 使用 `/v1/images/generations` 与 `/v1/images/edits`；`nano-banana-2` 当前按文档推荐走 Gemini 原生 `gemini-3.1-flash-image-preview:generateContent`；`nano-banana-pro` 使用 `/v1/images/generations` 加 `image_input` URL。

## 要点速览

| 真实任务 | 推荐起点 | API 路线 | 注意点 |
|---|---|---|---|
| 只想把图片改成横图、竖图或补一点安全边距 | 在线 uncrop 工具 | 暂时不必上 API | 快，但边缘控制弱 |
| 人像、商品、建筑照片需要保持可信 | Photoshop / 专业编辑器 | `gpt-image-2` 编辑可做自动化补充 | 重点是主体不漂移 |
| 想用文字连续扩展场景 | 对话式图片编辑 | `gpt-image-2` 适合创意编辑 | 遮罩不是硬边界 |
| 批量生成博客图、广告图、商品横幅 | CrazyRouter Images API | `/v1/images/generations` 或 `/v1/images/edits` | 需要记录模型、尺寸和返回字段 |
| 使用 Nano Banana 2 做图片生成 | Gemini 原生路径 | `/v1beta/models/gemini-3.1-flash-image-preview:generateContent` | 不要写成稳定 Images API 入口 |
| 使用 Nano Banana Pro 做参考图横幅 | CrazyRouter Images API | `model: "nano-banana-pro"` + `image_input` | 当前公开承诺 URL 参考图 |

<img src="https://raw.githubusercontent.com/xujfcn/images/ai-expand-image-crazyrouter-assets/seomaster/ai-expand-image-crazyrouter-decision.svg" alt="AI 扩图工具决策图">

一句话版本：单张图先选工具，成规模后再选 API。

## AI 扩图不是一个任务

<img src="https://raw.githubusercontent.com/xujfcn/images/ai-expand-image-crazyrouter-assets/seomaster/ai-expand-image-crazyrouter-api-map.svg" alt="CrazyRouter 图像 API 路线图">

“AI 扩图”至少拆成四类。

补比例。原图主体没问题，只是画幅不适合 16:9 横幅、9:16 竖屏或 1:1 方图。这个场景对 API 的需求不强，在线 uncrop 工具通常够用。

保真外扩。人物肩膀、头发、商品边缘、建筑线条贴着边界，扩图后不能看出断裂。这里要用能精修边缘的编辑器，或者用带遮罩的图片编辑 API。

创意扩景。你不是只想“补边”，而是想让画面变成更大的摄影棚、更完整的桌面、更宽的户外场景。对话式图片编辑和 `gpt-image-2` 这类提示词驱动编辑更顺手。

生产 outpainting。批量处理商品图、博客封面、广告素材或用户上传图时，核心问题变成：请求如何复现，图片如何存储，失败如何重试，模型如何切换，成本如何记录。这里才是 CrazyRouter 这类统一 API 入口的价值。

## 什么时候不用 API

如果只是把一张 4:5 图片补成 16:9，API 不是默认答案。在线 uncrop 工具省掉了上传、鉴权、解析返回和存储结果的开发工作，适合临时素材和低风险内容。

Photoshop Generative Expand 更适合重要原图。做品牌图、人物图、商品图时，编辑器里的局部修边能力比一次 API 返回更可靠。AI 外扩经常能补出整体气氛，但文字、Logo、包装边缘和 UI 元素仍需要人工收口。

ChatGPT Images 这类对话式编辑适合找方向。它的优势是低摩擦迭代：选中区域，描述“把左右两侧扩成更宽的摄影棚环境”，继续追问和修正。代价是边界不一定严格，不能把它当成像素级合成工具。

## 什么时候用 CrazyRouter API

一旦出现下面任意一个条件，就该考虑 API：

- 每天生成或编辑几十张以上图片
- 图片需要进入 CMS、商品系统、广告素材库或用户工作流
- 需要同一套鉴权调用 GPT Image、Gemini 图片模型、Grok、Qwen、DALL-E 等模型
- 需要记录模型、输入图、提示词、尺寸、质量和返回 URL
- 需要在模型不稳定时保留替代路线

CrazyRouter 的基础地址要按客户端区分：

| 使用方式 | 应填写地址 |
|---|---|
| OpenAI 兼容 SDK | `https://crazyrouter.com/v1` |
| 手写 Images API 请求 | `https://crazyrouter.com/v1/images/generations` 或 `/v1/images/edits` |
| Gemini 原生图片路径 | `https://crazyrouter.com/v1beta/models/{model}:generateContent?key=YOUR_API_KEY` |

OpenAI 兼容 SDK 会自己拼路径，所以 `base_url` 只保留到 `/v1`。手写 `curl` 请求要写完整端点。

## 路线一：用 gpt-image-2 生成扩图方向

`gpt-image-2` 在 CrazyRouter 文档里使用 OpenAI Images API 格式。生成图片走：

```text
POST https://crazyrouter.com/v1/images/generations
```

最小请求示例：

```bash
curl -X POST https://crazyrouter.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-image-2",
    "prompt": "为一张 AI API 教程生成 16:9 横幅图：画面左侧是一张被扩展成横幅的产品照片，右侧是简洁的 API 路由示意，科技感但不要文字",
    "n": 1,
    "size": "1536x1024",
    "quality": "high",
    "output_format": "png"
  }'
```

Python SDK 写法：

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://crazyrouter.com/v1"
)

response = client.images.generate(
    model="gpt-image-2",
    prompt="为一张 AI API 教程生成 16:9 横幅图：画面左侧是一张被扩展成横幅的产品照片，右侧是简洁的 API 路由示意，科技感但不要文字",
    n=1,
    size="1536x1024",
    quality="high",
    output_format="png"
)

print(response.data[0].url)
```

这条路线适合从零生成封面、文章插图、社交配图。它不是严格意义的“基于原图 outpaint”，但很适合先产出方向稿。

## 路线二：用 gpt-image-2 做遮罩编辑

真正要保留原图主体时，用编辑端点：

```text
POST https://crazyrouter.com/v1/images/edits
```

CrazyRouter 文档写明，`gpt-image-2` 编辑支持原图、遮罩，也支持最多 16 张参考图。遮罩图片里的透明区域是需要编辑的部分。

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://crazyrouter.com/v1"
)

response = client.images.edit(
    model="gpt-image-2",
    image=open("product.png", "rb"),
    mask=open("outpaint-mask.png", "rb"),
    prompt="把商品图左右两侧扩展成干净的 21:9 横幅背景，保留商品主体、边缘和原始光照，不添加文字或 Logo",
    n=1,
    size="1536x1024"
)

print(response.data[0].url)
```

这个示例适合商品主图、博客封面、广告横幅。关键不是提示词写得长，而是把遮罩做对：透明区域给模型补，主体区域尽量不碰。

多图参考可以用 `multipart/form-data`：

```bash
curl -X POST https://crazyrouter.com/v1/images/edits \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "model=gpt-image-2" \
  -F "prompt=把第一张商品图扩展成第二张参考背景风格的横幅，保留商品结构和边缘" \
  -F "size=1536x1024" \
  -F "n=1" \
  -F "image[]=@product.png" \
  -F "image[]=@background-reference.png"
```

如果你的流程需要透明背景，`gpt-image-2` 文档也支持生成时设置 `background: "transparent"` 并使用 PNG。

## 路线三：Nano Banana 2 当前走 Gemini 原生

这里最容易写错。

CrazyRouter 文档在 2026-04-14 的复测结论是：`nano-banana-2` 当前映射到 `gemini-3.1-flash-image-preview`，推荐直接调用 Gemini 原生 `generateContent`。不要把 `POST /v1/images/generations` + `model: "nano-banana-2"` 写成稳定生产入口。

推荐请求：

```bash
curl "https://crazyrouter.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Generate an IMAGE of a clean ecommerce hero shot expanded into a wide banner on a white background. Return image output."
          }
        ]
      }
    ],
    "generationConfig": {
      "responseModalities": ["IMAGE"]
    }
  }'
```

返回解析也要按 Gemini 形态处理。优先读：

```text
candidates[].content.parts[].inlineData
```

不要假设它会返回 OpenAI Images 风格的 `data[].url`。

这条路线适合已经准备使用 Gemini 图片能力的团队。它的好处是当前文档路径清晰，代价是客户端要写 Gemini 原生解析逻辑。

## 路线四：Nano Banana Pro 用 URL 参考图做横幅

`nano-banana-pro` 的公开协议不同。CrazyRouter 文档写的是：

```text
POST https://crazyrouter.com/v1/images/generations
```

它使用 `image_input` 传参考图 URL，当前公开保守范围写 1 到 2 张参考图，并已验证 `1K`、`4K`、`1:1`、`21:9`、`png`、`jpg` 等能力。

```bash
curl -X POST https://crazyrouter.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "nano-banana-pro",
    "prompt": "把这张商品图改成超宽横幅 KV，背景更简洁，保留主体结构，不添加文字",
    "image_input": [
      "https://example.com/product-reference.webp"
    ],
    "resolution": "4K",
    "aspect_ratio": "21:9",
    "output_format": "png"
  }'
```

响应默认消费 `data[0].url`：

```json
{
  "created": 1774846705,
  "data": [
    {
      "url": "https://media.crazyrouter.com/task-artifacts/..."
    }
  ]
}
```

限制也要写进开发文档：当前公开协议只承诺 `image_input` URL 输入，不接受 `image` 字段，也不要把 `data:` 或 Base64 当作公开输入协议。

## API 路线怎么放进生产

不要在业务代码里硬编码一个模型。把模型选择放进配置或路由表。

```python
IMAGE_ROUTE = {
    "cover_from_prompt": {
        "provider": "openai_images",
        "model": "gpt-image-2",
        "endpoint": "/v1/images/generations",
    },
    "masked_outpaint": {
        "provider": "openai_images",
        "model": "gpt-image-2",
        "endpoint": "/v1/images/edits",
    },
    "gemini_image": {
        "provider": "gemini_native",
        "model": "gemini-3.1-flash-image-preview",
        "endpoint": "/v1beta/models/gemini-3.1-flash-image-preview:generateContent",
    },
    "reference_banner": {
        "provider": "openai_images",
        "model": "nano-banana-pro",
        "endpoint": "/v1/images/generations",
    },
}
```

每次请求至少记录这些字段：

| 字段 | 用途 |
|---|---|
| `request_id` | 复现与客服排查 |
| `model` | 成本、质量、失败率对比 |
| `endpoint` | 区分 Images API 和 Gemini 原生 |
| `input_image_url` 或文件名 | 追踪原图来源 |
| `prompt_version` | 回滚提示词 |
| `size` / `resolution` / `aspect_ratio` | 复现输出 |
| `response_field` | `data[].url`、`b64_json` 或 `inlineData` |
| `latency_ms` | 判断模型与路由稳定性 |
| `status_code` | 分析 401、429、500、渠道失败 |

## 让扩图更干净的操作清单

<img src="https://raw.githubusercontent.com/xujfcn/images/ai-expand-image-crazyrouter-assets/seomaster/ai-expand-image-crazyrouter-checklist.svg" alt="AI 扩图稳定性清单">

一次少扩一点。15% 到 25% 的边界补充通常更稳，过大的空白会诱导模型重写整张图。

先延续，再创意。第一轮只要求画面自然变宽；第二轮再加道具、场景和风格变化。

主体贴边时用遮罩。人物脸、手、商品轮廓、包装文字都不该只靠提示词保护。

把文字交回设计工具。Logo、包装文案、UI 截图、表格和小字号标注，生成式外扩仍容易出错。

保留原图和参数。图片 API 的“看起来差不多”很难排查，必须把输入图、提示词版本、模型、尺寸和响应字段一起存下来。

## FAQ

### AI 扩图、uncrop、outpaint 是一回事吗？

不是。uncrop 更像快速补画幅；outpaint 更强调在原画框之外继续生成内容；图片编辑 API 通常还会涉及原图、遮罩、参考图和返回格式。

### CrazyRouter 上 AI 扩图该先用哪个模型？

如果你要 OpenAI Images 兼容格式，先测 `gpt-image-2`。如果你要当前推荐的 Nano Banana 2 路线，走 `gemini-3.1-flash-image-preview:generateContent`。如果你要用 URL 参考图做高分辨率横幅，测 `nano-banana-pro`。

### `nano-banana-2` 能不能走 `/v1/images/generations`？

不建议。CrazyRouter 文档在 2026-04-14 的结论是：`nano-banana-2` 当前推荐 Gemini 原生路径，不再推荐把 `/v1/images/generations` 写成稳定入口。

### `gpt-image-2` 编辑图片时遮罩怎么理解？

`/v1/images/edits` 使用 multipart 请求。传入原图和可选 mask，透明区域表示需要编辑的部分。商品图 outpaint 时，遮罩应覆盖需要补出的边缘区域，主体尽量留在非透明区域。

### API 返回一定是图片 URL 吗？

不一定。`gpt-image-2` 和 `nano-banana-pro` 的 Images API 示例通常消费 `data[].url`，也可能遇到 `b64_json`。`nano-banana-2` 的 Gemini 原生路径应优先解析 `inlineData`。

### 文章配图应该用什么路线生成？

技术博客封面可先用 `gpt-image-2` 文生图。带参考图的横幅可用 `nano-banana-pro`。需要把一张已有图扩成横幅并保护主体时，用 `gpt-image-2` 的 `/v1/images/edits`。

## 推荐起步方案

临时修一张图，先用在线 uncrop 或 Photoshop。要做文章封面、广告横幅、商品图批量生成，再把流程接到 CrazyRouter。

生产起步可以这样排：

| 阶段 | 选择 |
|---|---|
| 封面方向稿 | `gpt-image-2` + `/v1/images/generations` |
| 原图外扩 | `gpt-image-2` + `/v1/images/edits` |
| Gemini 图片路线 | `gemini-3.1-flash-image-preview:generateContent` |
| URL 参考图横幅 | `nano-banana-pro` + `image_input` |
| 成本与稳定性复盘 | 按模型、端点、响应字段记录日志 |

如果目标是把 AI 扩图做成可复现的内容生产管线，下一步不是继续找“万能模型”，而是把输入图、提示词、模型和返回解析固定下来。注册 CrazyRouter，创建一个受限 Token，用上面的四条路线各跑 10 张图，很快就能看出哪条适合你的素材库。

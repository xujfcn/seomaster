# 示例：从原始文档生成配置

这个文件夹包含示例原始文档，展示如何使用 `init-project.js` 自动生成项目配置。

## 文件说明

- `product-intro.md` - 产品介绍文档
- `user-interviews.md` - 用户访谈记录

## 使用方法

```bash
# 从这个示例文件夹生成配置
node scripts/init-project.js examples/raw-docs-sample ./test-config.yaml

# 查看生成的配置
cat test-config.yaml
```

## 预期输出

脚本会分析这两个文档，提取以下信息：

### 从 product-intro.md 提取：
- 产品名称：MyAPI
- 产品定位：AI API 聚合平台
- 目标用户：独立开发者、AI 创业团队
- 竞品信息：OpenRouter、AIGateway
- 核心数据：300+ 模型、价格低 30-50%
- 品牌声音：技术老手的实话实说

### 从 user-interviews.md 提取：
- 用户痛点：成本高、迁移难、稳定性担忧
- 用户目标：降低成本、简化迁移、保持灵活性
- 决策因素：价格、稳定性、迁移成本
- 内容方向：迁移教程、成本对比、用户案例

## 生成的配置示例

```yaml
project:
  name: "MyAPI"
  tagline: "AI API 聚合平台"
  website: "https://myapi.com"
  industry: "Developer Tools"

value_proposition:
  product: "MyAPI"
  audience: "独立开发者"
  action: "用一个 API 访问 300+ AI 模型"
  result: "省 30-50% API 费用"
  full: "MyAPI 让独立开发者用一个 API 访问 300+ AI 模型，省 30-50% API 费用"

audience:
  primary:
    title: "独立开发者"
    pain_points:
      - "API 价格高，成本难控制"
      - "多平台配置繁琐，浪费时间"
      - "模型切换麻烦，影响开发效率"
    goals:
      - "降低 API 成本"
      - "简化开发流程"
      - "快速测试多个模型"

competitors:
  - name: "OpenRouter"
    strengths:
      - "市场知名度高"
      - "文档完善"
    weaknesses:
      - "价格比官方 API 贵 20%"
      - "不支持某些新模型"

  - name: "AIGateway"
    strengths:
      - "免费额度大"
    weaknesses:
      - "速度慢"
      - "稳定性差"

key_metrics:
  - metric: "支持模型数量"
    value: "300+"
    source: "官网模型列表"

  - metric: "价格优势"
    value: "比官方低 30-50%"
    source: "价格对比页"

  - metric: "用户增长"
    value: "+150% MoM"
    source: "内部数据"
```

## 下一步

1. 检查生成的配置文件
2. 补充标记为 TODO 的字段
3. 验证所有数据的准确性
4. 开始创建文章任务

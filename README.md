# Playwright Agent Training

一个用于部门培训的单页静态网页，主题是“从录制到 Skill：用 Playwright 和 Agent 实现业务流程自动化并封装复用”。

## 打开方式

1. 直接双击 [index.html](/Users/shineanl/Documents/Codex/playwright-agent-training/index.html)
2. 或在当前目录启动本地静态服务器，例如：

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173/`

## 已实现

- 发布会式单页培训布局，适合现场讲解
- 7 段式主线：背景、准备、安装、录制、Agent 脚本化、Skill 封装、流程跑通
- 原始录制 / 优化写法 / 讲解重点三栏代码切换
- 代码复制按钮
- Agent Prompt 生成器与本地保存
- 审核清单与风险摘要
- 流程跑通状态面板
- 章节完成状态、本地存储、清空本地数据

## 视频替换

- 默认视频区域使用占位海报图
- 把你的录制视频放到：

```text
assets/playwright-recording-demo.mp4
```

页面中的视频区域就会直接播放这段 MP4

## 本地测试

```bash
npm test
```

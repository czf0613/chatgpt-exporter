<h1 align="center">ChatGPT Exporter</h1>

<div align="center">

## 一键导出 [ChatGPT](https://chatgpt.com/) 聊天记录的用户脚本，附件也一并导出

[![license][license-image]][license-url]
[![release][release-image]][release-url]
[![upstream][upstream-image]][upstream-url]

[license-image]: https://img.shields.io/github/license/czf0613/chatgpt-exporter?color=red
[license-url]: https://github.com/czf0613/chatgpt-exporter/blob/master/LICENSE
[release-image]: https://img.shields.io/github/v/release/czf0613/chatgpt-exporter?color=blue
[release-url]: https://github.com/czf0613/chatgpt-exporter/releases/latest
[upstream-image]: https://img.shields.io/badge/fork%20of-pionxzh%2Fchatgpt--exporter-lightgrey
[upstream-url]: https://github.com/pionxzh/chatgpt-exporter

[English](./README.md) &nbsp;&nbsp;|&nbsp;&nbsp; 简体中文

本项目是 [pionxzh/chatgpt-exporter](https://github.com/pionxzh/chatgpt-exporter) 的 fork，跟随上游更新，并增加了 **[附件导出](#-附件)**：ChatGPT 生成的文件和你上传的文件会随 Markdown/HTML 导出一起下载打包，Markdown 导出中的图片也会保存为文件。本 fork 未发布到 GreasyFork，请从下方的 GitHub 地址安装。

![image](https://github.com/pionxzh/chatgpt-exporter/assets/9910706/1c864670-7912-4484-b4be-bdf5dde51557)

## 安装

### 前置条件

<align>安装 <b>`Tampermonkey`</b></align>

[<img src="https://user-images.githubusercontent.com/3750161/214147732-c75e96a4-48a4-4b64-b407-c2402e899a75.PNG" height="60" alt="Chrome" valign="middle">][link-chrome] &nbsp;&nbsp; [<img src="https://user-images.githubusercontent.com/3750161/214148610-acdef778-753e-470e-8765-6cc97bca85ed.png" height="60" alt="Firefox" valign="middle">][link-firefox] &nbsp;&nbsp; [<img src="https://user-images.githubusercontent.com/3750161/233201810-d1026855-0482-44c8-b1ec-c7247134473e.png" height="60" alt="Chrome" valign="middle">][link-edge]

[link-chrome]: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo 'Chrome Web Store'
[link-firefox]: https://addons.mozilla.org/firefox/addon/tampermonkey 'Firefox Add-ons'
[link-edge]: https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd 'Edge Add-ons'

### 用户脚本

[![安装][Install-image]][install-url]

[Install-image]: https://img.shields.io/badge/-%E4%BB%8E%20GitHub%20%E5%AE%89%E8%A3%85-blue
[Install-url]: https://raw.githubusercontent.com/czf0613/chatgpt-exporter/master/dist/chatgpt.user.js

Tampermonkey 会从同一地址检查更新，因此每次发布推送到 `master` 后都会自动更新到你的浏览器。构建好的脚本也附在每个 [release](https://github.com/czf0613/chatgpt-exporter/releases) 中。不含附件导出功能的原版脚本发布在 [GreasyFork](https://greasyfork.org/scripts/456055-chatgpt-exporter)。

> 请确认已在浏览器中为 Tampermonkey [开启 `Allow User Scripts`（允许用户脚本）](https://www.tampermonkey.net/faq.php?q=Q209)。

#

[📚 支持的格式](#-支持的格式) &nbsp;&nbsp;|&nbsp;&nbsp; [💡 示例](#-示例) &nbsp;&nbsp;|&nbsp;&nbsp; [📎 附件](#-附件) &nbsp;&nbsp;|&nbsp;&nbsp; [📤 批量导出对话](#-批量导出对话) &nbsp;&nbsp;|&nbsp;&nbsp; [🤝 参与贡献](#-参与贡献) &nbsp;&nbsp;|&nbsp;&nbsp; [⭐ Star 历史](#-star-历史)

</div>

#

## 📚 支持的格式

- [文本](#文本)
- [HTML](#html)
- [Markdown](#markdown)
- [PNG](#截图)
- [JSON](#json)

## 💡 示例

### 文本

```
You:
I'm creating a ChatGPT Exporter. What do you think?

ChatGPT:
It sounds like you're planning on creating a tool that uses the ChatGPT model
to export text. ChatGPT is a large language model trained by OpenAI that is
designed to generate human-like text responses based on a given input. It can
be used for a variety of applications, such as chatbots, automated responses
to customer inquiries, and more.

However, please keep in mind that as a large language model, ChatGPT has not
been specifically trained for any specific task, so the quality of the
generated text will depend on how it is used and the context in which it is
applied. It's important to use ChatGPT responsibly and consider the potential
consequences of using it in any given situation.
```

### HTML

<div align="center">

<img width="643" alt="image" src="https://github.com/pionxzh/chatgpt-exporter/assets/9910706/47481c7a-4a6a-433b-b08e-fdf3bbabcb64">

</div>

### Markdown

```
---
title: ChatGPT Exporter Creation
source: https://chat.openai.com/c/cf3f8850-1d69-43c8-b99b-affd0de4e76f
author: ChatGPT
---

# ChatGPT Exporter Creation

#### You:
I'm creating a ChatGPT Exporter. What do you think?

#### ChatGPT:
It sounds like you're planning on creating a tool that uses the ChatGPT model to export text. ChatGPT is a large language model trained by OpenAI that is designed to generate human-like text responses based on a given input. It can be used for a variety of applications, such as chatbots, automated responses to customer inquiries, and more.
```

### 截图

<div align="center">
<img width="480" src="https://user-images.githubusercontent.com/9910706/205663680-6ac97fac-39b0-495c-bee4-8ef37713a9ae.png" />

</div>

### JSON

即接口 `https://chat.openai.com/backend-api/conversation/[id]` 返回的原始内容

<details>
<summary>点击展开</summary>

```json
{
    "id": "35a1fa05-e928-4c39-8ffa-ca74f75b509f",
    "title": "AI Turing Test.",
    "create_time": 1678015311.655875,
    "mapping": {
        "5c48fa3e-e4ee-4d00-aa66-8fbcb671a358": {
            "id": "5c48fa3e-e4ee-4d00-aa66-8fbcb671a358",
            "message": {
                "id": "5c48fa3e-e4ee-4d00-aa66-8fbcb671a358",
                "author": {
                    "role": "system",
                    "metadata": {}
                },
                "create_time": 1678015311.655875,
                "content": {
                    "content_type": "text",
                    "parts": [
                        ""
                    ]
                },
                "end_turn": true,
                "weight": 1,
                "metadata": {},
                "recipient": "all"
            },
            "parent": "9310b90f-d8f0-4be6-bac2-daacddac784f",
            "children": [
                "4afb9720-3a88-49b1-9309-e2b53d607f34"
            ]
        },
        "9310b90f-d8f0-4be6-bac2-daacddac784f": {
            "id": "9310b90f-d8f0-4be6-bac2-daacddac784f",
            "children": [
                "5c48fa3e-e4ee-4d00-aa66-8fbcb671a358"
            ]
        },
        "4afb9720-3a88-49b1-9309-e2b53d607f34": {
            "id": "4afb9720-3a88-49b1-9309-e2b53d607f34",
            "message": {
                "id": "4afb9720-3a88-49b1-9309-e2b53d607f34",
                "author": {
                    "role": "user",
                    "metadata": {}
                },
                "create_time": 1678015311.656259,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "write an poem about the Turing test"
                    ]
                },
                "weight": 1,
                "metadata": {
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "5c48fa3e-e4ee-4d00-aa66-8fbcb671a358",
            "children": [
                "7027f1a5-8bd5-4463-9869-8a1d1db2f9a1"
            ]
        },
        "7027f1a5-8bd5-4463-9869-8a1d1db2f9a1": {
            "id": "7027f1a5-8bd5-4463-9869-8a1d1db2f9a1",
            "message": {
                "id": "7027f1a5-8bd5-4463-9869-8a1d1db2f9a1",
                "author": {
                    "role": "assistant",
                    "metadata": {}
                },
                "create_time": 1678185638.890551,
                "content": {
                    "content_type": "text",
                    "parts": [
                        "In the realm of machines and code,\nThere lies a test, with rules bestowed,\nA challenge to determine true mind,\nAnd if a machine's intelligence can find.\n\nThe Turing test, named for its creator,\nSeeks to find if a machine's behavior\nCan mimic that of a human so well,\nThat it's indistinguishable, can you tell?\n\nThrough conversations, the test is done,\nWith a judge and a machine, the game is run,\nIf the judge can't tell who is who,\nThen the machine's intelligence shines through.\n\nBut can a machine truly think?\nOr is it just a clever bit of link,\nBetween algorithms and programming code,\nCan it truly understand and decode?\n\nThe Turing test, a thought experiment,\nBrings up questions, doubts, and sentiment,\nFor as we strive to create machines smart,\nWe wonder, will they ever truly have heart?\n\nSo let us ponder and explore,\nAs we create machines more and more,\nThe Turing test a reminder to be,\nMindful of what our machines can truly see."
                    ]
                },
                "end_turn": false,
                "weight": 1,
                "metadata": {
                    "model_slug": "text-davinci-002-render-sha",
                    "finish_details": {
                        "type": "stop"
                    },
                    "timestamp_": "absolute"
                },
                "recipient": "all"
            },
            "parent": "4afb9720-3a88-49b1-9309-e2b53d607f34",
            "children": []
        }
    },
    "moderation_results": [],
    "current_node": "7027f1a5-8bd5-4463-9869-8a1d1db2f9a1"
}
```
</details>

## 📎 附件

ChatGPT 为你生成的文件（例如代码解释器生成的表格或文档，在回答中以 `sandbox:/mnt/data/...` 链接出现，或记录在消息元数据里）以及你上传的非图片文件，会随对话一起下载。

- **Markdown / HTML**：对话含有附件时，导出结果会变成一个 `.zip`，其中包含 `.md`/`.html` 文件和一个 `attachments/` 文件夹。导出文件中的链接指向本地副本；回答里没有链接到的文件会列在对应消息的下方。
- **Markdown**：图片（生成的、上传的或代码解释器绘制的）保存为 `attachments/image-1.png`、`image-2.png`……并在 Markdown 中以相对路径引用，而不是内嵌 base64。HTML 导出仍然内嵌图片，保持单文件自包含。
- **批量导出（Markdown / HTML）**：附件存放在批量 zip 内的 `attachments/<对话文件名>/` 目录下。
- **分享页**：ChatGPT 生成的文件通过公开的分享接口获取；上传的文件需要文件所有者的登录状态，因此会跳过。
- 生成的文件优先从 ChatGPT 保存的持久副本获取，没有时再从沙盒获取（沙盒还在准备文件时会像 ChatGPT 一样等待重试）。无法再获取的文件会在导出结束后提示，并保留原始链接。

该功能可在 **设置 → 导出附件** 中关闭。

## 📤 批量导出对话

点击「批量导出」按钮会弹出 **导出对话** 对话框，可用功能如下。

**从官方导出文件（conversations.json）导出**

点击上传图标按钮，上传对话的 JSON 文件，例如从 OpenAI 下载的导出文件。

**从 API 导出**

在所有对话的列表中勾选要导出的对话。勾选「全选」可导出全部对话。

在左下角的下拉框中选择导出格式，可选格式如下。

- **Markdown**
- **HTML**
- **JSON**
- **JSON (ZIP)**

点击按钮执行相应操作。

- **归档** - 归档后的对话会从侧边栏消失，可在 ChatGPT 设置中管理。详见 [#199](https://github.com/pionxzh/chatgpt-exporter/issues/199)。
- **删除** - 删除选中的对话。
- **导出** - 按格式选择器中选定的格式导出选中的对话。

## 💬 也在用 DeepSeek？

看看 [**DeepSeek Exporter**](https://github.com/pionxzh/deepseek-exporter)：姊妹项目，为 [DeepSeek](https://chat.deepseek.com/) 提供同样的一键导出，包括深度思考过程和联网搜索来源。

## 🤝 参与贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## ⭐ Star 历史

<div align="center">

<img src="https://star-history.dera.page/svg?repos=czf0613/chatgpt-exporter&type=Date" width="600" height="400" alt="Star History Chart" valign="middle">

</div>

# Scroll Tied Video Section

按提供的提示词制作的独立电影感单页作品展示。使用 VECTRUS 导航、指定 CloudFront 视频、字体与三段顺序场景，最后一屏按用户批注更新为单板滑雪主题。

## 本地运行

```sh
npm install
npm run dev
```

## 生产构建

```sh
npm run build
npm run preview
```

技术栈：Vite、React 18、TypeScript、Tailwind CSS 3、lucide-react、mp4box 0.5。

`src/useVideoScrub.ts` 实现 500vh 滚动进度、指数平滑、WebCodecs 帧解码、WebP 帧库、24 帧 LRU 缓存、软件解码重试与 60 秒超时回退。浏览器不支持 WebCodecs、减少动态效果或视频读取失败时，使用原视频的 currentTime 定位。

## 交互补充

提示词未指定导航目标，因此导航与箭头在已有三段场景之间跳转。NEWS 跳转到第二段。MENU 在桌面和移动端均可打开菜单，支持 Escape 关闭和键盘焦点限制。

提示词未提供联系邮箱，菜单中的 CONTACT 暂使用未填写收件人的 `mailto:`，可在 `src/App.tsx` 中替换为实际邮箱。

视频与字体直接使用指定的远程地址，不复制为本地素材、不使用视频遮罩，也不自动播放。

## 本轮批注修改

1. 最后一屏替换为青年单板滑雪照片：`public/images/snowboard-young-adult.png`，图片在滚动进度 63%–75% 之间渐入。
2. 大标题替换为 `FIND YOUR OWN LINE`。
3. 上方副标题替换为 `Don't follow the beaten track, only follow your passion.`。
4. 删除最后一屏 Contact Nordvik 文字和箭头按钮。

相关代码用 Comment 1 / Comments 2–4 标注。图片由内置 imagegen 生成，生成提示词保存于 `design/image-prompt.md`。

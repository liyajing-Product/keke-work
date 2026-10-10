# Scroll Tied Video Section

按提供的提示词制作的独立电影感单页作品展示。保留原始英文文案、VECTRUS 导航、指定 CloudFront 视频、字体与三段顺序场景。

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

提示词未提供联系邮箱，Contact Nordvik / CONTACT 暂使用未填写收件人的 `mailto:`，可在 `src/App.tsx` 中替换为实际邮箱。个人姓名与作品资料未提供，因此保持提示词中的原始品牌和文案。

视频与字体直接使用指定的远程地址，不复制为本地素材、不使用视频遮罩，也不自动播放。

# Scroll Tied Video Section

## GitHub 发布

- 项目仓库：https://github.com/liyajing-Product/keke-work
- GitHub Pages：https://liyajing-product.github.io/keke-work/
- 推送到 `main` 后，`.github/workflows/deploy-pages.yml` 自动构建并部署。仓库 Settings → Pages 的 Source 设为 GitHub Actions。
- 部署构建由 GitHub Pages 元数据设置 Vite 的 base 路径，产品图片使用 `import.meta.env.BASE_URL`，兼容项目子目录与根域名部署。

按提供的提示词制作的独立电影感单页作品展示。首屏为居中 SKIING 视频主题，第二屏为滑雪镜产品探索，第三屏为带 LightRays 的纯 SVG 雪板结构拆解，第四屏为银灰粒子云与个性宣言，第五屏为 ALPINE 装备目录。

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

`src/useScrollStory.ts` 使用 HTML 底部 CDN 加载的 GSAP 3.13.0 + ScrollTrigger 驱动五屏纵深叙事。2260svh 的滚动行程对应一个 100svh 固定视口舞台，scrub 为 0.48 秒；第三屏包含十个拆解章节。前景、背景以不同的 Z 位移、缩放和视差映射滚动；上下滚动可正反向播放。旧 `useVideoScrub.ts` 保留为历史实现，当前不再解码被全屏场景遮挡的旧背景视频；首屏循环视频仍保留。

## 交互补充

导航按内容名称定位，滚动依次进入五屏。品牌链接返回首屏，platform、solutions、get started 跳转第二屏，company 跳转第五屏，support 跳转第四屏。第二屏箭头进入第三屏。

视频与字体直接使用指定的远程地址。首屏视频自动循环播放，离开首屏后暂停；离开首屏后不再加载另一段不可见视频。

## 历史修改：单板滑雪场景（已被装备目录替换）

1. 曾使用青年单板滑雪照片：`public/images/snowboard-young-adult.png`，素材保留。
2. 大标题替换为 `FIND YOUR OWN LINE`。
3. 上方副标题替换为 `Don't follow the beaten track, only follow your passion.`。
4. 删除最后一屏 Contact Nordvik 文字和箭头按钮。

图片由内置 imagegen 生成，生成提示词保存于 `design/image-prompt.md`。

## 首屏修改

- `src/SecurifyHero.tsx`：滑雪全屏循环视频，单一横排居中的 `SKIING` 特大标题；旧三行文案、描述与三组统计已删除。
- Readex Pro、黑白中性色与共享 ALPINE 胶囊导航。标题字号随视口宽高缩放，保持一行。
- 滚动映射到标题的连续放大，字母 G 内部留白作为镜头目标；视频退去后进入第二屏雪镜，反向滚动还原。原有第三至第五屏顺序及动画节奏保留。
- 减少动态效果时显示静态标题与视频静帧；设计记录在 `design/skiing-hero.md`。
- 已移除 VEYRA 扩展页面。此前雪山首屏素材保存在 `public/images/hero-ski-season.png`。

## 全局导航统一

顶部导航提取为 `src/SecurifyNav.tsx`，固定在所有场景上方，LOGO 使用用户提供的「白境 / ALPINE」图片 `public/images/alpine-logo.png`，保留四个链接及 get started 按钮。移动端隐藏中间链接。导航跳转使用 GSAP 缓动，用户滚轮、触摸或翻页键会中止跳转；减少动态效果模式直接定位目标屏。

## 全站滚动动画

- `index.html` 底部 CDN 加载 GSAP 3.13.0 与 ScrollTrigger。
- 五屏共享一个带透视的固定舞台和一条时间轴。首屏 SKIING 持续放大，穿过字母 G 留白后进入雪镜页面；雪镜从深处推进，标题从不同方向归位，网格和产品持续轻微视差；第三屏完整雪板进入并逐层拆解、向远处退场；第五屏标题与表格分层进入；第四屏银灰粒子云缓慢旋转，并随滚动产生空间转动和镜头推进。
- 每屏内容维持一屏，增加的页面高度仅作为动画行程。第五屏仍只有三类、12 条目录内容。
- `prefers-reduced-motion: reduce` 时不创建滚动时间轴，五屏依次正常排布且全部显示最终态；第四屏曲线完整显示，第三屏展示静态拆解图。首屏视频停在末帧、GridScan 使用静态帧，雪镜拆解和换色即时完成。
- CDN 加载失败时回退为同样的静态布局。时间轴随 React 生命周期清理，导航可被用户输入中止。具体映射见 `design/scroll-motion.md`。

## 第二屏：滑雪镜产品探索

- 入口：`http://127.0.0.1:5173/#goggles`，或点击顶部 get started。
- `src/GogglesShowcase.tsx` 使用基于用户五张照片制作的 AI 高清修复版透明 PNG：`public/images/goggles/goggles-*-hq.png`，原始上传素材仍保存在同目录。修复版统一镜片反光、框体及织带细节，修复白色标识和透明边缘；Canvas 提高到 1920 × 1230。图像为视觉重制素材，非厂商认证产品照片；提示词记录于 `design/goggles-hq-prompts.md`。画面沿用首屏黑色背景、Readex Pro、错落的大字号小写英文和胶囊控件。
- 鼠标在产品主图区域移动即可循环切换五个图片视角，光标为抓手；触屏支持横向拖动、键盘支持左右方向键。主图下方的视角箭头和提示已删除。这是五视角图片循环，不是连续的三维模型。
- 镜片颜色提供原图、glacier、sunrise、forest、smoke 预设，并支持任意原生选色或十六进制颜色输入。Canvas 单独处理镜片区域，保留镜框和绑带的原始颜色以及镜片反光。
- 点击主图或 take a closer look，切换到正面三部件拆解：左侧镜片、中间独立镜框、右侧独立镜带。已删除 lens / frame / strap 三个操作按钮。再次点击主图或 reassemble 还原；触屏横向拖动不会误触拆解，键盘 Enter / Space 也可操作。镜框和镜带采用内置 image_gen 补齐的透明展示图，提示词见 `design/goggles-component-prompts.md`；这是视觉展示，非工程 CAD 模型。
- 点击预设色、原生选色或有效 HEX 后，镜片执行 JavaScript Web Animations 动画：旧镜片向左抛出屏幕，新镜片从右侧滑入并以轻微回弹磁吸装入正面镜框。动画期间暂停旋转和拆解；连续选色仅排队保留最新选择，离开第二屏取消动画并保留选色。减少动态效果时直接换色。
- 首屏内容保留；第二屏原来的伙伴关系文案和箭头组被新产品展示替换。第五屏目录在同一固定舞台中占一屏高度。
- 第二屏标题按用户提供的字体排版参考更新为两行：`Less burden,` / `more freedom`。首行向右缩进、次行靠左，字重 400、紧凑字距；保留现有黑白视觉语言，并将产品及说明放在标题下方。
- 拆解布局为水平左／中／右，标签位于对应部件下方；桌面和手机分别设置缩放与间距。再次点击后，两侧部件在 650ms 内向中心合并，镜带到达中心后淡出，随后恢复完整产品。收拢期间暂停旋转与重复切换，更换镜片颜色可接管当前动画；减少动态效果偏好下直接还原。
- 第二屏背景接入用户附件中的 React Bits GridScan 着色器：透视网格、粉色往返扫描光、辉光与轻微色散，鼠标移动带来视差。背景通过暗色遮罩保护产品和标题对比度，离开第二屏或切到后台暂停绘制；减少动态效果偏好下显示静态帧。实现见 `src/GridScan.tsx`、`src/GridScan.css`。

## 第三屏：Snowboard engineering

- 入口：`http://127.0.0.1:5173/#snowboard`，也可从第二屏向下箭头或继续滚动进入。
- 黑底、冰蓝单色强调、工程线稿；标题 `BUILT FROM WITHIN.` 沿用 ALPINE 展示字样。
- 纯 SVG 的板底、双边刃、上下层复合材料、木芯、侧壁、板面、2×4 嵌件、八颗螺丝、固定器三子件。
- Anime.js v4 ESM，暂停的时间轴由 GSAP ScrollTrigger 进度驱动。进入时为完整雪板，10 个滚动章节逐件拆解；停止滚动后按方向停在章节边界，上滑原路重组，不再自动循环。底部显示结构名称与 00–10 进度。
- 展开后板层保留独立间隙，螺丝与嵌件分列左右；内层整组下移后再分离，避免穿过未拆开的板层。雪板使用独立 0.18 秒滚动缓动、0.32 秒停靠延迟及章节边界容差。
- `prefers-reduced-motion` 直接显示静态爆炸图。配色与位移/节奏配置位于 `src/snowboardConfig.ts`；设计说明及参考记录在 `design/snowboard-engineering.md`。

## 第四屏：Your style

- 入口：`http://127.0.0.1:5173/#signature` 或导航 support。
- `src/SignatureScene.tsx`：黑底与共享胶囊导航。下半屏保留两行大标题：`Your style doesn't require` / `a standard answer`，与装备目录共用 alpine-display 字体样式，大写展示、两行同字号、无投影。
- 已移除环形路线、描边绘制和路径头。背景参照用户上传的 Lusion 静态截图，使用程序化银灰粒子云，包含密集体积、外围散点、柔焦近景和少量高光；没有提取原站动画源码。
- 原有两行文案放在下半屏，使用现有 Readex Pro / alpine-display 字体，无投影。保留统一胶囊导航，加入细小十字定位点与滚动提示。
- GSAP 全局滚动时间轴驱动粒子旋转和推进，向上滚动反向还原。平时轻微漂浮；非当前场景暂停渲染。减少动态效果时为静态粒子构图。
- 参数集中在 `src/SignatureParticles.tsx`，桌面 6500 个粒子，手机 2700 个；预绘制粒子贴图，画布像素比上限 1.5。

## 第五屏：ALPINE 装备目录

- 入口：`http://127.0.0.1:5173/#collection`，第四屏继续向下滚动或导航 company。
- 对照用户附件采用黑底、低亮度超大描边英文、左上角 `ALPINE°`、右侧三列表格和全宽细线分组，不添加参考图中的右侧 CTA 与说明。
- 背景文字为 `GEAR UP. RIDE HARD. BUILT FOR WINTER. MADE FOR MOUNTAINS.`。按最新要求删除 PANTS、LAYERS、GLOVES、ACCESSORIES，保留 GOGGLES、HELMETS、JACKETS 三类共 12 条型号及数量。桌面保留大面积左侧留白；移动端使用全宽三列，自动换行。
- 第五屏高度为 `100svh`，标题及表格共享一屏空间，字号和行间距随窗口高度调整。减少动态效果时全部直接显示，原生滚动阅读。布局与参考差异记录在 `design/alpine-collection.md`。


## 首屏最新调整：SKIING

- 已删除原有副文案、your / data 与三组统计数字和说明。首屏仅保留横排居中的特大 `SKIING` 标题、滑雪视频和全局导航。
- GSAP + ScrollTrigger 驱动标题 1→38 倍放大，朝字母 G 的留白推进；视频逐渐退去，第二屏从字形后方进入。向上滚动原路还原，减少动态效果时保持静态标题。设计记录：`design/skiing-hero.md`。

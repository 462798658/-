# 礼品图片选择与拍照实施计划

## Context
当前新增/编辑礼品需要手工填写图片 URL。此次改为从相册选择图片或调用相机拍照，图片保存在现有 IndexedDB 本地媒体库中；localStorage 只保存媒体 ID，并继续兼容已有网络图片礼品、历史订单和用户头像。

## 实施方案

### 1. 本地媒体与数据兼容
- 在 `src/lib/domain.js` 的默认礼品中补充可选 `imageMediaId: null`；调整 `validateGiftForm`，允许“本次新选图片 / 已有 imageMediaId / 旧 image URL”三种来源，新礼品未选图片时拦截，其余字段校验不变。
- 在 `src/lib/media.js` 增加单个媒体删除能力，用于替换或删除无引用图片后的清理；继续使用 `putMedia`、`getMediaUrl`、`clearMedia`，不把 File、Base64 或 blob URL 写入 localStorage。
- 在 `src/state/AppContext.jsx` 将 `saveGift` 改为异步：先完成权限、表单和目标礼品校验，再把新图片写入 IndexedDB，写入成功后才更新全局礼品状态；失败时保留原礼品并返回可重试提示。编辑不换图时沿用原媒体 ID 或旧 URL。
- 新用户及 seed 用户补充可选 `avatarMediaId`；虚拟头像礼品兑换时同时设置 `avatarMediaId` 或旧 `avatar`，保证本地图片头像可用。`resetDemo` 继续通过 `clearMedia` 清除本地图片。

### 2. 新增/编辑表单改为图片选择
- 修改 `src/pages/Admin.jsx`，移除图片地址输入框，提供“相册选择”和“拍照”两个按钮。
- 使用两个复用现有模式的文件输入：`type="file" accept="image/*"`，拍照入口增加 `capture="environment"`；取消选择不改变已填表单，非图片文件给出提示。
- 新选图片立即显示临时预览；未换图时显示原本地图片或旧 URL。支持重选，统一撤销临时 object URL 并清空 input，确保同一文件也能再次选择。
- 保存期间禁止重复提交和关闭表单；失败保留图片及其他输入，成功后再关闭。保存的仍是礼品字段与媒体 ID，不持久化临时 File。
- 管理列表及原图预览改用统一 `GiftImage`。

### 3. 全链路图片与头像展示
- 在 `src/components/ui.jsx` 新增轻量 `GiftImage`：优先通过 `MediaImage` 渲染 `imageMediaId`，否则通过 `ImageWithFallback` 渲染旧 URL；修正图片源变化后失败状态未重置的问题。
- 将 `src/pages/Shop.jsx` 的商城卡片、详情、虚拟兑换确认和兑换成功头像预览，以及 `src/pages/Orders.jsx` 的普通订单图片统一切换到 `GiftImage`；自选商品截图逻辑保持不变。
- 修改 `src/pages/Home.jsx`、`src/pages/Profile.jsx`，用户有 `avatarMediaId` 时使用 `MediaImage`，旧 URL 和昵称首字回退保持原行为。
- `src/styles.css` 仅补充图片选择区和表单禁用态所需的局部样式，复用现有上传按钮与预览样式。

## 验证与交付
1. 执行 `npm run build`，检查编译与 Hooks/导入问题。
2. 浏览器实际上传本地图片新增实物、虚拟礼品，验证预览、重选、非图片/空图片拦截、编辑不换图、换图及刷新后的持久化。
3. 验证管理列表、商城、详情、兑换确认、订单均显示本地图片；兑换本地虚拟头像后，首页和个人中心正确显示并在刷新后恢复。
4. 检查拍照 input 的 `capture="environment"` 和相册 input 的 `accept="image/*"`；桌面浏览器无法证明真实 Android 相机行为，明确保留实机验证限制。
5. 更新 Android 版本，执行 Capacitor 同步、release 构建、签名校验并交付可覆盖安装的新 APK。

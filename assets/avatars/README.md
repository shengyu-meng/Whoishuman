# AI角色头像文件夹

## 切换头像模式

在 `js/AICharacterPool.js` 中修改 `AvatarConfig` 配置：

```javascript
const AvatarConfig = {
    useImage: false,  // 改为 true 启用图片头像
    imagePath: 'assets/avatars/'
};
```

## 生成模板图片

打开 `generate-avatars.html` 在浏览器中生成所有角色的模板头像图片。

点击每个角色下方的"下载"按钮，保存对应的文件名。

## 角色头像文件列表

| 角色名称 | 文件名 | 颜色 |
|---------|--------|------|
| 人类玩家 | human.jpg | #07c160 |
| 话痨4.0 | hualao.jpg | #FF6B9D |
| CloseAI | closeai.jpg | #4ECDC4 |
| 双子星 | shuangzixing.jpg | #9B59B6 |
| 红豆包 | hongdoubao.jpg | #E74C3C |
| 深思 | shensi.jpg | #34495E |
| Limi | limi.jpg | #FF9500 |
| 有谱-4.5 | youpu.jpg | #F39C12 |
| 坤 | kun.jpg | #1ABC9C |

## 图片要求

- 格式：JPG（体积小，加载快）
- 尺寸：建议 200x200 像素（会自动缩放）
- 样式：圆形头像会自动适配

## 使用说明

1. 用你自己的图片替换这些模板文件
2. 保持文件名不变
3. 在 `js/AICharacterPool.js` 中设置 `useImage: true`
4. 刷新游戏页面即可看到新头像

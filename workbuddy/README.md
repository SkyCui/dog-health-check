# WorkBuddy 可测试版本 0.1.0

本版提供真实远程 MCP 工具：知识与安全分流、规则自查、主动提交观察的复盘。不调用付费模型，不保存云档案，不宣称已经在 WorkBuddy 市场上架。

## 安装测试

1. 下载 https://dogcare.cc/downloads/dogcare-workbuddy.zip 并解压。
2. 在支持自定义 MCP 的 WorkBuddy 客户端，添加远程服务，传输选 Streamable HTTP，地址填 `https://dogcare.cc/api/mcp`，无需 Token。也可按客户端提供的 JSON 配置入口导入本包 `mcp.json`。
3. 在技能管理的添加/上传入口，导入 `skills/dogcare-companion`；若要求 ZIP，将此技能目录单独压缩。不同版本入口可能不同，市场上架另行审核。
4. 新建对话：“调用 dogcare_capabilities，告诉我实际连接结果和是否支持云记忆。”确认返回四个工具及 cloudMemoryAvailable=false。
5. 提问“零食怎么控制更容易坚持？”；应调用 ask_dog_care，返回来源链接和知识版本。
6. 测试“狗狗现在呼吸困难”；应优先建议兽医急诊，不给换粮或训练方案。
7. 明确指定一只测试狗，提供两天进食、精神、便便与行动记录，要求复盘；返回记录范围和事实统计，不能声称云端保存。

直接访问接口看到 405 是正常的，它是 MCP POST 地址，不是网页或普通 GET API。

## 发布状态与隐私

协议测试通过不等于宿主实测通过。市场提交前须用目标 WorkBuddy 版本实际安装、确认工具展示、引用和安全场景，再提交审核。暂不实现私有档案读取、账户、持久化写入和跨设备记忆；需要数据库与授权后再开放。

不要在公开 MCP 参数发送个人身份、模型密钥或不必要资料。服务代码不主动存储请求正文，但部署平台、宿主与模型服务商的处理政策仍适用。发布前应核对日志配置。平台自身额度或订阅由用户承担。

## 开发与回归

`npm run dev -- --port 3443` 启动后，另一个终端执行 `MCP_TEST_URL=http://localhost:3443/api/mcp npm run test:workbuddy`。部署后将地址换成生产 URL 再测。

修改协议后运行 `npm run package:workbuddy` 重建下载包。`references/assess-request.schema.json` 从根 schema 自动同步，不手工维护第二套枚举。图标取现有默认头像，不包含私有书籍。

官方连接器规范：https://open.workbuddy.cn/docs/connector

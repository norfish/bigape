## release

### 1.3.5
- fix sync render bug: pagelet data and pagelet scripts didn't work when renderSync

### 1.3.4
- 增加SEO优化开关
- Service 增加全局配置方法 $setProxy $setGlobal
- 增加新的 lifeCycle 方法，onBeforeRender(parsedData)，可以通过此方法在渲染前加钩子，比如想根据处理数据更改模板

### 1.3.3
- 增加renderSync 方法，支持服务端渲染ssr

### 1.3.1
- fixed: isErrorFatal 的时候异常没有捕获fixed
- 正常render时候总是报write after end fixed

### 1.3.0
- fixed: emitter.setMaxListeners to unlimit 导致机器负载飙升

### 1.2.9
- emitter.setMaxListeners to unlimit

### 1.2.8
- service response data 类型增加ret的支持

### 1.2.7
- add: BigPipe 增加了init属性，支持给bigpipe增加自定义实例属性
- add: 支持init里指定渲染方法
- add: renderSnippet/renderJSON 支持直接传入module原型

*bugfix：*
- fix: renderSnippet/renderJSON 方法只传入module或者moduleName，不重新指定pipe，导致无法flush到客户端的bug


### 1.2.4
- 增加 renderAsync 的别名 render方法 √
- 增加 renderPipeline 方法，异步渲染，按顺序输出 √


### 1.2.0 - 1.2.3

##### 新特性
- pagelet 增加 noLog 配置，允许 pagelet 不输出logs √
- 允许指定pagelet渲染数据的 renderDataKey，如果不指定还是默认取name值 √
- service 允许自定义header, 新增 getHeaders 方法 √
- service 允许自定义proxy代理 √


##### bugfix
- pagelet 多层数据依赖 √
- log日志输出，对于json，会stringify格式化输出 √

### 1.1.0
- 故障fix √

### 1.0.x

- pagelet 模块基本
- bigpipe 基本模块
- service 原始wiki

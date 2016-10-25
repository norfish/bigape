BigPipe
- start
- pipe
- end
_ cache
_ pagelets

- render
- renderAsync
- renderSync

- renderHtml

- renderSnippet
- renderJSON

waitForAll: done => mark ready

start -> check ready -> ready -> do render
start -> check ready -> not ready -> wait -> ready -> do render

Pagelet
## 实例
- req
- res
- template
- data 来源  父节点 兄弟节点  自身节点 同步异步 都包装成异步
{
    service: this.load
}
- service
- id
- name
- params
- query

- service

## 原型

- get
- handler(options)

- initialize
- mode
- pagelets
- __parent
- __children
- __contentType
- write
- end
- render

router

## static
- extend

BigPipe singleton
bigpipe.render(req, res, next)
bigpipe.router(req, res, next)

pagelet = new Pagelet({
  params: Pagelet.router.exec(req.uri.pathname),
  parent: 'bootstrap',
  bigpipe: bigpipe,
  append: true,
  req: req,
  res: res
});


// depend
// data depend

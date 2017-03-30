var express = require('express')
var nunjucks = require('nunjucks')
var routes = require('./routes')
// var bigape = require('bigape')
var bigape = require('../../src')

var app = express()

nunjucks.configure('views', {
  autoescape: true,
  express: app
})

// config viewEngine
bigape.config({
  'viewEngine': nunjucks
});

app.use(function(req, res, next) {
  // set no buffer to avoid buffer when trunk size is too small
  res.setHeader('X-Accel-Buffering', 'no')
  next()
})

app.use('/', routes)

app.listen(process.env.PORT || '3000', function() {
	console.log('server is running at http://localhost:3000')
})

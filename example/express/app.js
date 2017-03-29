var express = require('express')
var nunjucks = require('nunjucks')
var routes = require('./routes')
var bigape = require('../../src')

var app = express()

nunjucks.configure('views', {
  autoescape: true,
  express: app
})

bigape.config({
  'viewEngine': nunjucks
});

app.use('/', routes)

app.listen(process.env.PORT || '3000', function() {
	console.log('server is running at http://localhost:3000')
})

const express = require('express')
const app = express()
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index');
})

//app.get('/main/', function (req, res) {
//  res.sendFile('index_main.html');
//})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
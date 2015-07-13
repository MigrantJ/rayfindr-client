var express = require('express');
var app = express();

app.set('port', process.env.PORT || 8000);
app.set('root', __dirname);

app.use(express.static(__dirname + '/client/'));

app.listen(app.get('port'), function () {
    console.log('Server Ready On Port: ' + app.get('port'));
});

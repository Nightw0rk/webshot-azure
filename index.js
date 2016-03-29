/* global Buffer */
var http = require("http");
var storage = require("azure-storage");
var phantom = require('phantom');
var fileService = storage.createFileService();
var bodyParser = require('body-parser')
var exp = require('express');
var app = exp();
var amqp = require('amqplib');

app.use(bodyParser.json());
function tick(msg) {
    var requestBody = JSON.parse(msg.content.toString());
    phantom.create().then(function(ph) {
        ph.createPage().then(function(page) {
            page.open(requestBody.url).then(function(status) {
                console.log(status);
                page.render(requestBody.name)
                    .then(function(a, b, c) {
                        fileService.createFileFromLocalFile(
                            process.env.AZURE_SHARE,
                            '',
                            requestBody.name,
                            requestBody.name,
                            function(error, result, response) {
                                require("fs").unlink(requestBody.name);
                                page.close();
                                ph.exit();
                                console.log("webshot created", requestBody.name);
                                app.mqChannel.ack(msg);
                            });
                    });
            })
        });
    });
}

app.post('/', function(req, res) {

    if (!req.body) {
        return res.end('{"status":"ERROR","message":"Body is empty"}');
    }
    req.body.stamp = new Date();
    //app.exchange.publish('task', req.body);
    app.mqChannel.sendToQueue('task-queue', new Buffer(JSON.stringify(req.body)), { deliveryMode: true });
    res.send({ status: "OK", message: "Add to task" });
    /*var requestBody = req.body;
    if (requestBody.url) {
        phantom.create().then(function (ph) {
            ph.createPage().then(function (page) {
                page.open(requestBody.url).then(function (status) {
                    console.log(status);
                    page.render(requestBody.name)
                        .then(function (a, b, c) {
                            fileService.createFileFromLocalFile(
                                process.env.AZURE_SHARE,
                                '',
                                requestBody.name,
                                requestBody.name,
                                function (error, result, response) {
                                    require("fs").unlink(requestBody.name);
                                    console.log("webshot created", requestBody.name);
                                });
                        });
                })
                return res.send('{"status":"OK","message":"Rendering in process"}');
            });
        })
    } else {
        return res.end('{"status":"ERROR","message":"In body not params url"}');
    }*/
});
/*var con = false;
app.rmqConn = amqp.createConnection({ url: "amqp://guest:guest@192.168.99.100:5672" });
app.rmqConn.on('ready', function () {
    if (!con) {
        con = true;
        app.listen(1202, function (err, asd) {
            app.rmqConn.createChannel().then(function (ch) {
                app.channel = ch;
                app.queue = ch.assertQueue("task-queue", { durable: true })
                app.queue.then(function () {
                    app.channel.consume('task-queue', tick, { noAck: false });
                    console.log('Example app listening on port 1202!');
                });
            })
            app.exchange = app.rmqConn.exchange("task-exchange");
            app.queue = app.rmqConn.queue('task-queue');
            app.queue.bind(app.exchange, '#');
            app.queue.subscribe({ ack: false }, tick);
        });
    }
}) */
amqp.connect("amqp://guest:guest@192.168.99.100:5672").then(function(conn) {
    app.mqCon = conn;
    app.mqCon.createChannel().then(function(ch) {
        app.mqChannel = ch;
        app.queue = ch.assertQueue("task-queue", { durable: true })
        app.queue.then(function() { ch.prefetch(1); });
        app.queue.then(function() {
            app.mqChannel.consume('task-queue', tick, { noAck: false });
            app.listen(1202, function() {
                console.log('Example app listening on port 1202!');
            })
        });
    });
})
    //tick();

/* global Buffer */
var http = require("http");
var storage = require("azure-storage");
var phantom = require('phantom');
var fileService = storage.createFileService();
var bodyParser = require('body-parser')
var exp = require('express');
var app = exp();
var fs = require('fs');
var amqp = require('amqplib');

app.use(bodyParser.json());
function tick(msg) {
    var requestBody = JSON.parse(msg.content.toString());
    console.log('message get', msg.fields.consumerTag, msg.fields.deliveryTag);
    phantom.create(['--disk-cache=true']).then(function(ph) {
        console.log('phanton start', msg.fields.consumerTag, msg.fields.deliveryTag);
        ph.createPage().then(function(page) {
            page.setting('settings.userAgent',
                requestBody.agent || 'Mozilla/5.0 (Windows; U; Windows NT 6.1; ru-Ru) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27'
            ).then(function(err) {
                // requestBody.url = "file:///" + requestBody.url;                
                page.open(requestBody.url).then(function(status) {
                    console.log("open", requestBody.url, status);
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
    app.mqChannel.sendToQueue('task-queue', new Buffer(JSON.stringify(req.body)), { deliveryMode: true });
    res.send({ status: "OK", message: "Add to task" });
});

amqp.connect("amqp://guest:guest@192.168.99.100:32777").then(function(conn) {
    app.mqCon = conn;
    app.mqCon.createChannel().then(function(ch) {
        app.mqChannel = ch;
        app.queue = ch.assertQueue("task-queue", { durable: true })
        app.queue.then(function() { ch.prefetch(5); });
        app.queue.then(function() {
            app.mqChannel.consume('task-queue', tick, { noAck: false });
            console.log('In Queue');
            if (process.env.START_WEB) {
                app.listen(1202, function() {
                    console.log('Example app listening on port 1202!');
                })
            }
        });
    });
})    

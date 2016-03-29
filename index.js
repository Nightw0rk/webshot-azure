var http = require("http");
var storage = require("azure-storage");
var phantom = require('phantom');
var fileService = storage.createFileService();
var bodyParser = require('body-parser')
var exp = require('express');
var app = exp();

app.use(bodyParser.json());

app.post('/', function(req, res) {
    if (!req.body) {
        return res.end('{"status":"ERROR","message":"Body is empty"}');
    }
    var requestBody = req.body;
    if (requestBody.url) {
        phantom.create().then(function(ph) {
            console.log("create ph");
            ph.createPage().then(function(page) {
                console.log("create page");
                page.setting('settings.userAgent',
                    requestBody.agent || 'Mozilla/5.0 (Windows; U; Windows NT 6.1; ru-Ru) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27'
                ).then(function(err) {
                    console.log("update userAgent", err);
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
                                    });
                            });
                    });
                    return res.send('{"status":"OK","message":"Rendering in process"}');
                }
                    )
            });
        })
    } else {
        return res.end('{"status":"ERROR","message":"In body not params url"}');
    }
});

app.listen(1202, function() {
    console.log('Example app listening on port 1202!');
});
/*http.createServer(function (req, res) {
    if (req.method == "POST") {
        var body = [];
        req.on('data', function (chunk) {
            body.push(chunk);
        }).on('end', function () {
            var strBody = Buffer.concat(body).toString();
            if (!strBody) {
                return res.end('{"status":"ERROR","message":"Body is empty"}');
            }
            var requestBody = JSON.parse(strBody);
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
                                            if (!error) {
                                                return res.end('{"status":"OK"}');// file uploaded
                                            }
                                            return res.end('{"status":"ERROR"}');// file uploaded
                                        });
                                });
                        })
                    });
                })
            } else {
                res.end('{"status":"ERROR","message":"in body url param not found"}');
            }
        });
    } else {
        res.end('{"status":"ERROR","message":"only post"}');
    }
}).listen(1202);*/
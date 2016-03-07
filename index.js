var http = require("http");
var storage = require("azure-storage");
var phantom = require('phantom');
var fileService = storage.createFileService();

http.createServer(function (req, res) {
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
}).listen(1202);
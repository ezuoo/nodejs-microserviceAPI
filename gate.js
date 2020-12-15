'use strict';
/**
 *  API 호출을 받아들이는 게이트웨이
 */
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const tcpClient = require('./client');

var mapClients = {};
var mapUrls = {};
var mapResponse = {};
var mapRR = {};
var index = 0;

// HTTP 서버 생성
var server = http.createServer((req, res) => {
    var method = req.method;
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname;

    if (method === "POST" || method === "PUT") {
        console.log("gate : method is POST or PUT");
        var body = "";

        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            var params;
            if (req.headers['content-type'] == "application/json") {
                console.log("gate : content Type : json");
                params = JSON.parse(body);
            } else {
                params = querystring.parse(body);
            }

            onRequest(res, method, pathname, params);
        });
    } else {
        onRequest(res, method, pathname, uri.query);
    }
}).listen(8000, () => {
    console.log('gate listen', server.address());

    // Distributor와 의 통신 처리
    var packet = {
            uri: "/distributes",
            method: "POST",
            key: 0,
            params: {
                port: 8000,
                name: "gate",
                urls: []
            }
        };
        console.log('gate packet : ', packet);
        var isConnectedDistributor = false;

        this.clientDistributor = new tcpClient(
            "127.0.0.1"
            , 9000
            , (options) => {                                    // 접속 이벤트
                isConnectedDistributor = true;
                this.clientDistributor.write(packet);
            }
            , (options, data) => { onDistribute(data); }        // 데이터 수신 이벤트
            , (options) => { isConnectedDistributor = false; }  // 접속종료 이벤트
            , (options) => { isConnectedDistributor = false; }  // 에러 이벤트
        );

        // 주기적인 Distributor 접속 상태 확인
        setInterval(() => {
            if (isConnectedDistributor != true) {

                this.clientDistributor.connect();
            }
        }, 3000);    
});

// API 호출 처리
function onRequest(res, method, pathname, params) {
    var key = method + pathname;
    var client = mapUrls[key];
    console.log(`gate onRequest : key is ${key}`);
    console.log(`gate onRequest : client is ${client}`);
    if (client == null) {
        console.log(`gate onRequest : client is null`);
        res.writeHead(404);
        res.end();
        return;
    } else {
        console.log(`gate onRequest : client is not null`);
        params.key = index;                             // API호출에 대한 고유 키값 설정
        var packet = {
            uri: pathname,
            method: method,           
            params: params
        };

        mapResponse[index] = res;
        index++;
        if (mapRR[key] == null)                         // 라운드 로빈 처리
            mapRR[key] = 0;
        mapRR[key]++;
        client[mapRR[key] % client.length].write(packet);
    }

}

// Distributor 접속 처리
function onDistribute(data) {
    for (var n in data.params) {
        var node = data.params[n];
        var key = node.host + ":" + node.port;
        if (mapClients[key] == null && node.name != "gate") {
            var client = new tcpClient(node.host, node.port, onCreateClient, onReadClient, onEndClient, onErrorClient);

            mapClients[key] = {
                client: client,
                info: node
            };
            for (var m in node.urls) {
                var key = node.urls[m];
                if (mapUrls[key] == null) {
                    mapUrls[key] = [];
                }
                mapUrls[key].push(client);
            }
            client.connect();
            console.log('gate onDistributor : Distributor 접속 처리');
        }
    }
}

// 마이크로서비스 접속 이벤트 처리
function onCreateClient(options) {
    console.log("gate onCreateClient : 마이크로서비스 접속 이벤트 처리");
}

// 마이크로서비스 응답 처리
function onReadClient(options, packet) {
    console.log("gate onReadClient", packet);
    mapResponse[packet.key].writeHead(200, { 'Content-Type': 'application/json' });
    mapResponse[packet.key].end(JSON.stringify(packet));
    delete mapResponse[packet.key];                         // http 응답객체 삭제
}

// 마이크로서비스 접속 종료 처리
function onEndClient(options) {
    var key = options.host + ":" + options.port;
    console.log("gate onEndClient :", mapClients[key]);
    for (var n in mapClients[key].info.urls) {
        var node = mapClients[key].info.urls[n];
        delete mapUrls[node];
    }
    delete mapClients[key];
}

// 마이크로서비스 접속 에러 처리
function onErrorClient(options) {
    console.log("gate onErrorClient");
} 
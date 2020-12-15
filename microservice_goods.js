'use strict';
/**
 * 상품 관리 마이크로 서비스 실행
 */

const business = require("../nodejs-monolithicAPI/monolithic_goods");

class goods extends require('./server') {
    constructor() {
        super("goods"
            , process.argv[2] ? Number(process.argv[2]) : 9010
            , ["POST/goods", "GET/goods", "DELETE/goods"]
        );
        this.connectToDistributor("127.0.0.1", 9000, (data) => {
            console.log("Distributor Notification", data);
        });
    }

    onRead(socket, data) {
        console.log("onRead", socket.remoteAddress, socket.remotePort, data);
        business.onRequest(socket, data.method, data.uri, data.params, (s, socket) => {
            socket.write(JSON.stringify(packet)+ '¶');
        });
    }
}

new goods();

'use strict';
/**
 *  구매 관리 마이크로서비스 실행 
 */

// 비즈니스로직 파일 참조
const business = require('../nodejs-monolithicAPI/monolithic_purchases');

// Server클래스 참조
class purchases extends require('./server.js') {
    constructor() {
        super("purchases"                                                   // 부모 클래스 생성자 호출
            , process.argv[2] ? Number(process.argv[2]) : 9030
            , ["POST/purchases", "GET/purchases"]
        );

        this.connectToDistributor("127.0.0.1", 9000, (data) => {            // Distributor 연결
            console.log("Distributor Notification", data);
        });
    }

    // 클라이언트 요청에 따른 비즈니스로직 호출
    onRead(socket, data) {
        console.log("onRead", socket.remoteAddress, socket.remotePort, data);
        business.onRequest(socket, data.method, data.uri, data.params, (s, packet) => {
            socket.write(JSON.stringify(packet) + '¶');
        });
    }
}

new purchases();
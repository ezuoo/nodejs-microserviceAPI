'use strict';

/**
 * 모든 마이크로 서비스가 접속
 */

// 접속 노드 관리 오브젝트
var map = {};

// Server 클래스 상속
class distributor extends require('./server.js') {
    
    constructor() {
        console.log('# distributor contructor');
        super("distributor", 9000, ["POST/distributes", "GET/distributes"]);
    }
    // 노드 접속 이벤트 처리
    onCreate(socket) {
         console.log("distributor onCreate : 노드 접속 이벤트 처리"
         , socket.remoteAddress, socket.remotePort);
        this.sendInfo(socket);
    }

    // 노드 접속 해제 이벤트 처리
    onClose(socket) {
        var key = socket.remoteAddress + ":" + socket.remotePort;   
        console.log("distributor onClose : 노드 접속 해제 이벤트 처리"
        , socket.remoteAddress, socket.remotePort);
        delete map[key];
        this.sendInfo();
    }

    // 노드 등록 처리
    onRead(socket, json) {
        var key = socket.remoteAddress + ":" + socket.remotePort;   
        console.log("distributor onRead : 노드 등록 이벤트 처리"
        , socket.remoteAddress, socket.remotePort, json);
        
        if (json.uri == "/distributes" && json.method == "POST") {
            map[key] = {
                socket: socket
            };
            map[key].info = json.params;
            map[key].info.host = socket.remoteAddress;
            
            this.sendInfo();
        }
    }
    
    // 패킷 전송
    write(socket, packet) {
        console.log('distributor write : 패킷 전송');
        console.log('distributor packet', packet);
        socket.write(JSON.stringify(packet) + '¶');
    }

    // 접속 노드 혹은 특정 소켓에 접속 노드 정보 전파
    sendInfo(socket) {
        console.log('distributor sendInfo : 접속 노드 정보 전파');
            var packet = {
                uri: "/distributes",
                method: "GET",
                key: 0,
                params: []
            };

            for (var n in map) {
                packet.params.push(map[n].info);
            }

            if (socket) {
                this.write(socket, packet);
            }
            else {
                for (var n in map) {
                    this.write(map[n].socket, packet);
                }
            }
        }
    }

// distributor 객체 생성
new distributor();
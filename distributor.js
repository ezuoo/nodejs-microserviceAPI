'use strict';

var map = {};

class distributor extends require('./server') {
    constructor() {
        super("distributor", 9000, ["POST/distributor", "GET/distributes"]);
    }

    onCreate(socket) {
        console.log("onCreate", socket.remoteAddress, socket.remotePort);
       this.sendInfo(socket);
   }

   // 노드 접속 해제 이벤트 처리
   onClose(socket) {
       var key = socket.remoteAddress + ":" + socket.remotePort;   
       console.log("onClose", socket.remoteAddress, socket.remotePort);
       delete map[key];
       this.sendInfo();
   }

   // 노드 등록 처리
   onRead(socket, json) {
       var key = socket.remoteAddress + ":" + socket.remotePort;   
       console.log("onRead", socket.remoteAddress, socket.remotePort, json);
       
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
       socket.write(JSON.stringify(packet) + '¶');
   }

   // 접속 노드 혹은 특정 소켓에 접속 노드 정보 전파
   sendInfo(socket) {
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
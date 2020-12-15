'use strict';

const net = require('net');

class tcpClient{
    /*
    *  생성자
    */
    constructor(host, port, onCreate, onRead, onEnd, onError) {
        this.option = {
            host: host,
            port: port
        };
         
        this.onCreate = onCreate;
        this.onRead = onRead;
        this.onEnd = onEnd;
        this.onError = onError;
        console.log('client contructor');
    }

    /*
    * 접속 함수
    */
   connect() {       
        this.client = net.connect(this.option, () => {
            if (this.onCreate){
                console.log('client onCreate : 접속 완료'); 
                this.onCreate(this.option);
            }                
        });

        // 데이터 수신 처리
        this.client.on('data', (data) => {            
            var sz = this.merge ? this.merge + data.toString() : data.toString();
            var arr = sz.split('¶');
            console.log(`client on 'data' 
            sz : ${sz} 
            arr : ${arr}`);
            for (var n in arr) {
                if (sz.charAt(sz.length - 1) != '¶' && n == arr.length - 1) {
                    this.merge = arr[n];
                    break;
                } else if (arr[n] == "") {
                    break;
                } else {
                    this.onRead(this.option, JSON.parse(arr[n]));
                }
            } 
            console.log('client on data :  데이터 수신 처리');           
        });

        // 접속 종료 처리
        this.client.on('close', () => {
            if (this.onEnd){
                console.log("client class 접속 종료 처리");
                this.onEnd(this.option);
            }
                
        });

    // 에러 처리
        this.client.on('error', (err) => {
            if (this.onError) {
                console.log("client class 에러 처리");
                this.onError(this.option, err);
            }
               
        });
    }

    /*
    * 데이터 발송 
    */
    write(packet) {
        console.log('client write : 데이터 전송' , JSON.stringify(packet) + '¶');
        this.client.write(JSON.stringify(packet) + '¶');
    }
}

module.exports = tcpClient;
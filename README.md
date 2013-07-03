pushwechat![travis-ci](https://secure.travis-ci.org/dead-horse/weixin-push.png)
====== 

 通过模拟后台登录的形式，进行消息的发送和获取。   

## 用法  

```js

var Pusher = require('pwechat');
var pusher = Pusher.create('youremail', 'yourpassword');

pusher.on('PWwchatError', function (err) {
  console.log(err); //无法登录后台
});

/**
 * 给单个用户发送微信消息
 * @param {String} fakeId 用户fakeId
 * @param {String} content 发送内容
 */
pusher.singleSend('12345', 'test content', function (err, data) {
  // 发送成功的响应data.should.eql({ret: 0, msg: 'ok'});
});

//除了可以发送文字外，还支持发送其他的微信资源（在微信素材管理中添加）。  
//type为发送的不同资源类型，不同的类型需要的字段也不同
//发送前需要把要发送的资源上传到微信，并找到对应的`fid`等字段

pusher.singleSend('12345', {
  type: 2, //图片
  fid: 1000002 //图片的资源id
}, function (err, data) {
  // 发送成功的响应data.should.eql({ret: 0, msg: 'ok'});
});

pusher.singleSend('12345', {
  type: 10, //图文
  fid: 1000003,
  fileid: 1000004, 
  appmsgid: 1000003
}, function (err, data) {
  // 发送成功的响应data.should.eql({ret: 0, msg: 'ok'});
});
/**
 * 获取包含关键字的消息
 * @param {String} keyword 消息中包含的关键字
 * @param {Number} count 获取条数
 * @param {Number} fromMsgId 从这个msgId开始往前查找
 */
pusher.getMessage('@help', 10, 1000, function (err, data) {
  // 获取成功的响应，data会是一个数组
});

/**
 * 获取公众账号的粉丝
 * 响应： 
  [{ 
    fakeId: '98106560',
    nickName: 'nick1',
    remarkName: '',
    groupId: '0' 
  }, { 
    fakeId: '3297485',
    nickName: 'nick2',
    remarkName: '',
    groupId: '0' 
  }]
 */
pusher.getUsers(function (err, data) {});
```

## 安装  

```
npm install pwechat
```  

## Lincense  
(The MIT License)

Copyright (c) 2012 dead-horse and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


/*!
 * pushwechat - lib/pushwechat.js 
 * Author: dead-horse <dead_horse@qq.com>
 */

/**
 * Module dependencies.
 */
var proxy = require('./proxy');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var utility = require('utility');

var Pusher = function (username, pwd) {
  this.username = username || '';
  this.pwd = pwd || '';
  if (!this.username || !this.pwd) {
    throw new Error('Must have username and password!');
  }
  EventEmitter.call(this);
  setInterval(this._refresh.bind(this), 10 * 60 * 1000);
  this._login(this._refresh.bind(this));
};
util.inherits(Pusher, EventEmitter);

Pusher.prototype._login = function(callback) {
  var self = this;
  proxy.login(self.username, self.pwd, function (err, cookie, token) {
    if (err) {
      return callback(err);
    }
    self.cookie = cookie;
    self.token = token;
    callback && callback(null, cookie, token);
  });
};

Pusher.prototype.afterLogin = function (callback, args) {
  var self = this;
  this._login(function (err, cookie) {
    if (err) {
      var cb = args[args.length - 1];
      return typeof cb === 'function' && cb(err);
    }
    callback.apply(self, args);
  });
};

Pusher.prototype._refresh = function () {
  var self = this;
  proxy.refresh(this.cookie, function (err, token) {
    if (err) {
      return self._login(function (err) {
        if (err) {
          self.cookie = null;
          self.token = null;
          self.emit('PWechatError', err);
        } else {
          self.emit('connect');          
        }
      });
    }
    self.token = token;
  });
};

/**
 * 给单个用户发送微信消息
 * @param {String} fakeId 用户fakeId
 * @param {String} content 发送内容
 */
Pusher.prototype.singleSend = function (fakeId, content, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.singleSend(fakeId, content, self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    });
  }
  self.afterLogin(self.singleSend, arguments);
};

/**
 * 获取包含关键字的消息
 * @param {String} keyword 消息中包含的关键字
 * @param {Number} count 获取条数
 * @param {Number} fromMsgId 从这个msgId开始往前查找
 */
Pusher.prototype.getMessage = function (keyword, count, fromMsgId, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.getMessage(self.cookie, self.token, keyword, count, fromMsgId, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    });      
  }
  self.afterLogin(self.getMessage, arguments);
};

/**
 * 获取公众账号的粉丝
 */
Pusher.prototype.getUsers = function (callback) {
  var self = this;
  if (self.cookie) {
    return proxy.getUsers(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    });
  }
  self.afterLogin(self.getUsers, arguments);
};

/**
 * 获取单个用户详情, 包括所有分组
 * @param  {String}   fakeId   用户的fakeId
 * @param  {Function} callback
 */
Pusher.prototype.getUserDetail = function (fakeId, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.getUserDetail(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, fakeId);
  }
  self.afterLogin(self.getUserDetail, arguments);
};

/**
 * 修改用户分组, 每个用户只能分一组
 * @param  {[String]}   fakeId 用户的fakeId
 * @param  {[String]}   userGroupId 分组Id
 * @param  {Function} callback
 */
Pusher.prototype.modifyUserGroup = function (fakeId, userGroupId, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.modifyUserGroup(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, fakeId, userGroupId);
  }
  self.afterLogin(self.modifyUserGroup, arguments);
};

/**
 * 添加分组
 * @param {[String]}   groupName 分组名称
 * @param {Function} callback 
 */
Pusher.prototype.addGroup = function (groupName, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.addGroup(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, groupName);
  }
  self.afterLogin(self.addGroup, arguments);
};

/**
 * 重命名分组
 * @param  {[String]}   groupId   分组ID
 * @param  {[String]}   groupName 新的分组名称
 * @param  {Function}   callback
 */
Pusher.prototype.renameGroup = function (groupId, groupName, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.renameGroup(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, groupId, groupName);
  }
  self.afterLogin(self.renameGroup, arguments);
};

/**
 * 删除分组
 * @param  {[String]}   groupId   分组ID
 * @param  {Function}   callback
 */
Pusher.prototype.deleteGroup = function (groupId, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.deleteGroup(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, groupId);
  }
  self.afterLogin(self.deleteGroup, arguments);
};

/**
 * 获取公众账号的上载媒体列表
 * @param {String} type 媒体类别 2为图片, 3为语音, 4为视频, 10为图文
 */
Pusher.prototype.getMedia = function (type, callback) {
  var self = this;
  if (self.cookie) {
    return proxy.getMedia(self.cookie, self.token, function (err, data) {
      if (err) {
        self.cookie = null;
      }
      callback(err, data);
    }, type);
  }
  self.afterLogin(self.getMedia, arguments);
};

exports.create = function (username, pwd, token) {
  return new Pusher(username, pwd, token);
};

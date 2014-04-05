/*!
 * pushwechat - lib/proxy.js 
 * Author: dead-horse <dead_horse@qq.com>
 */


/**
 * Module dependencies.
 */
var urllib = require('urllib');
var cheerio = require('cheerio');
var utility = require('utility');
var translate = require('./translate');

var URLS = {
  login: 'http://mp.weixin.qq.com/cgi-bin/login?lang=zh_CN',
  singleSend: 'http://mp.weixin.qq.com/cgi-bin/singlesend?t=ajax-response&lang=zh_CN',
  refresh: 'http://mp.weixin.qq.com/cgi-bin/indexpage',
  getMessage: 'http://mp.weixin.qq.com/cgi-bin/getmessage?t=ajax-message',
  getUsers: 'https://mp.weixin.qq.com/cgi-bin/contactmanage',
  getUserDetail: 'https://mp.weixin.qq.com/cgi-bin/getcontactinfo',
  modifyUserGroup: 'https://mp.weixin.qq.com/cgi-bin/modifycontacts',
  modifyGroup: 'http://mp.weixin.qq.com/cgi-bin/modifygroup',
  getMedia: 'https://mp.weixin.qq.com/cgi-bin/filemanagepage'
};

var LANG = 'zh_CN';
var okStatus = [65201, 65202, 0];
var USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.95 Safari/537.11';
var POST_HEADER = 'application/x-www-form-urlencoded; charset=UTF-8';

exports.login = function (username, pwd, callback) {
  var data = {
    username: username,
    pwd: utility.md5(pwd.substr(0, 16)).toLowerCase(),
    imgcode: '',
    f: 'json'
  };
  var headers = {
    'Content-Type': POST_HEADER,
    Host: 'mp.weixin.qq.com',
    Origin: 'https://mp.weixin.qq.com',
    Referer: 'https://mp.weixin.qq.com/',
    'User-Agent' : USER_AGENT
  };  
  urllib.request(URLS.login, {
    type: 'POST',
    data: data,
    headers: headers
  }, function (err, data, res) {
    try {
      data = JSON.parse(data);    
    } catch (err) {
      return callback(new Error('response error'));
    }
    if (err || (res.statusCode !== 200 && res.statusCode !== 302) || okStatus.indexOf(data.base_resp.ret) < 0) {
      return callback(err || new Error('login error!' + translate.loginErrorMap(data.ErrCode)));
    }
    var cookies = '';
    var token;
    if (data.redirect_url) {
      var matchs = data.redirect_url.match(/token=(\d+)/);
      token = matchs ? matchs[1] : '';
    }
    var cookieReg = /^([\w_]+)=([\w_=]+);/;
    res.headers['set-cookie'].forEach(function (cookie) {
      var cmatchs = cookie.match(cookieReg);
      if (cmatchs) {
        cookies += cmatchs[0];
      }
    });
    callback(null, cookies, token);
  });
};

exports.singleSend = function (fakeId, content, cookie, token, callback) {
  var data;
  if (typeof content === 'string') {
    data = {
      type: 1,
      content: content,
      tofakeid: fakeId,
      ajax: 1,
      token: token,
      error: false
    };
  } else {
    data = {
      tofakeid: fakeId,
      ajax: 1,
      token: token,
      error: false
    };
    for (var key in content) {
      data[key] = content[key];
    }
    data.fileid = data.fileid || data.fid;  
  }
  var headers = {
    cookie: cookie,
    'Content-Type': POST_HEADER,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/message?t=message/list'
  };
  urllib.request(URLS.singleSend, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('singleSend Error! status code:' + res.statusCode));
    }
    try {
      data = JSON.parse(data);
    } catch (err) {
      return callback(new Error('singleSend Error! ' + err.message));
    }
    callback(null, data);
  });
};

exports.refresh = function (cookie, callback) {
  urllib.request(URLS.refresh, {headers: {cookie: cookie}}, function (err, data, res) {
    if (err || (res.statusCode !== 302 && res.statusCode !== 200)) {
      return callback(err || new Error('refresh Error! status code:' + res.statusCode));
    }
    var token;
    if (res.headers && res.headers.location) {
      var matchs = res.headers.location.match(/token=(\d+)/);
      token = matchs ? matchs[1] : '';
    }
    return callback(token ? null : new Error('Refresh error, can not get token'), token);
  });
};

exports.getMessage = function (cookie, token, keyword, count, fromMsgId, callback) {
  var data = {
    keyword: keyword,
    count: count,
    frommsgid: fromMsgId,
    token: token,
    ajax: 1
  };
  var headers = {
    'User-Agent': USER_AGENT,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/getmessage?token=1811982400&t=wxm-message&lang=zh_CN&count=10&keyword=%E6%B5%8B%E8%AF%95',
    Cookie: cookie
  };
  urllib.request(URLS.getMessage, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('getMessage Error! status code:' + res.statusCode));
    }
    try {
      data = JSON.parse(data);
    } catch (err) {
      return callback(new Error('getMessage Error! ' + err.message));
    }
    callback(null, data);
  });
};

exports.getUsers = function (cookie, token, callback) {
  var data = {
    t:"wxm-friend",
    token:token,
    lang:LANG,
    pagesize:100000,
    pageidx:0,
    type:0,
    groupid:0
  }
  var headers = {
    'User-Agent': USER_AGENT,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/message?t=message/list&count=20&day=7&token=337134409&lang=zh_CN',
    Cookie: cookie
  };
  urllib.request(URLS.getUsers, {
    type: 'GET',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('getUsers Error! status code:' + res.statusCode));
    }
    var friendListReg = /friendsList\s*:\s*\(\{"contacts"\s*:\s*(.*?)\}\)\.contacts/;
    var friendList = data.toString().match(friendListReg);
    if (!friendList) {
      return callback(new Error('Get friend list return error, wechat change format'));
    }
    try {
      friendList = JSON.parse(friendList[1]);
    } catch (err) {
      return callback(new Error('Get friend list return error, wechat change format')); 
    }
    callback(null,friendList);
  });
};

exports.getUserDetail = function(cookie, token, callback, fakeId) {
  var data = {
    t: 'ajax-getcontactinfo',
    lang: LANG,
    token: token,
    fakeid: fakeId
  };
  var headers = {
    Cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/contactmanage?t=user/index&pagesize=10&pageidx=0&type=0&groupid=0&token=2039772792&lang=zh_CN',
    'User-Agent': USER_AGENT,
    'Content-Type': POST_HEADER,
    'X-Requested-With': 'XMLHttpRequest'
  };
  urllib.request(URLS.getUserDetail, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('getUserDetail Error! status code:' + res.statusCode));
    }

    data = data.toString().replace(/\s{2,}|\t/g, ' ');

    if (!data) {
      return callback(new Error('Get user detail return error. No Content Obtained'));
    }
    try {
      data = JSON.parse( data );
    } catch (err) {
      return callback(new Error('Get user detail return error, wechat change format')); 
    }

    callback(null, data);
  });
};

exports.modifyUserGroup = function(cookie, token, callback, fakeId, userGroup) {
  var data = {
    t: 'ajax-putinto-group',
    lang: LANG,
    token: token,
    action: 'modifycontacts',
    contacttype: userGroup,
    tofakeidlist: fakeId
  };
  var headers = {
    Cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/contactmanage?t=user/index&pagesize=10&pageidx=0&type=0&groupid=100&token=2039772792&lang=zh_CN',
    'User-Agent': USER_AGENT,
    'Content-Type': POST_HEADER,
    'X-Requested-With': 'XMLHttpRequest'
  };
  urllib.request(URLS.modifyUserGroup, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('modifyUserGroup Error! status code:' + res.statusCode));
    }

    data = data.toString().replace(/\s{2,}|\t/g, ' ');

    if (!data) {
      return callback(new Error('Modify User Group return error. No Content Obtained'));
    }
    try {
      data = JSON.parse( data );
    } catch (err) {
      return callback(new Error('Modify User Group return error, wechat change format')); 
    }

    callback(null, data);
  });
};

exports.addGroup = function(cookie, token, callback, groupName) {
  var data = {
    t: 'ajax-friend-group',
    lang: LANG,
    name: groupName,
    func: 'add',
    token: token
  };
  var headers = {
    Cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/contactmanage?t=user/index&pagesize=10&pageidx=0&type=0&groupid=100&token=2039772792&lang=zh_CN',
    'User-Agent': USER_AGENT,
    'Content-Type': POST_HEADER,
    'X-Requested-With': 'XMLHttpRequest'
  };
  urllib.request(URLS.modifyGroup, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('addGroup Error! status code:' + res.statusCode));
    }

    data = data.toString().replace(/\s{2,}|\t/g, ' ');

    if (!data) {
      return callback(new Error('Add Group return error. No Content Obtained'));
    }
    try {
      data = JSON.parse( data );
    } catch (err) {
      return callback(new Error('Add Group return error, wechat change format')); 
    }

    callback(null, data);
  }); 
};

exports.renameGroup = function(cookie, token, callback, groupId, groupName) {
  var data = {
    t: 'ajax-friend-group',
    id: groupId,
    lang: LANG,
    name: groupName,
    func: 'rename',
    token: token
  };
  var headers = {
    Cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/contactmanage?t=user/index&pagesize=10&pageidx=0&type=0&groupid=100&token=2039772792&lang=zh_CN',
    'User-Agent': USER_AGENT,
    'Content-Type': POST_HEADER,
    'X-Requested-With': 'XMLHttpRequest'
  };
  urllib.request(URLS.modifyGroup, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('renameGroup Error! status code:' + res.statusCode));
    }

    data = data.toString().replace(/\s{2,}|\t/g, ' ');

    if (!data) {
      return callback(new Error('Rename Group return error. No Content Obtained'));
    }
    try {
      data = JSON.parse( data );
    } catch (err) {
      return callback(new Error('Rename Group return error, wechat change format')); 
    }

    callback(null, data);
  });
};

exports.deleteGroup = function(cookie, token, callback, groupId) {
  var data = {
    t: 'ajax-friend-group',
    id: groupId,
    lang: LANG,
    func: 'del',
    token: token
  };
  var headers = {
    Cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/contactmanage?t=user/index&pagesize=10&pageidx=0&type=0&groupid=100&token=2039772792&lang=zh_CN',
    'User-Agent': USER_AGENT,
    'Content-Type': POST_HEADER,
    'X-Requested-With': 'XMLHttpRequest'
  };
  urllib.request(URLS.modifyGroup, {
    type: 'POST',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('deleteGroup Error! status code:' + res.statusCode));
    }

    data = data.toString().replace(/\s{2,}|\t/g, ' ');

    if (!data) {
      return callback(new Error('Delete Group return error. No Content Obtained'));
    }
    try {
      data = JSON.parse( data );
    } catch (err) {
      return callback(new Error('Delete Group return error, wechat change format')); 
    }

    callback(null, data);
  });
};


exports.getMedia = function(cookie, token, callback, type) {
  var data = {
    t: "wxm-file",
    type: type,
    lang: LANG,
    token: token,
    pagesize: 100000,
    pageidx: 0
  };
  //图文有subtype
  if(type === 10) { 
    data.subtype = 3; 
  }
  var headers = {
    Cookie: cookie,
    'User-Agent': USER_AGENT,
  };
  urllib.request(URLS.getMedia, {
    type: 'GET',
    headers: headers,
    data: data
  }, function (err, data, res) {
    if (err || res.statusCode !== 200) {
      return callback(err || new Error('getMedia Error! status code:' + res.statusCode));
    }
    $ = cheerio.load(data.toString());
    var mediaList = $("#json-fileList").html();

    if (!mediaList) {
      return callback(new Error('Get media list return error. No Content Obtained'));
    }
    try {
      //干掉坑爹的tab
      mediaList = JSON.parse( mediaList.replace(/\s{2,}|\t/g, ' ') );
    } catch (err) {
      return callback(new Error('Get media list return error, wechat change format')); 
    }
    callback(null, mediaList);
  });
};
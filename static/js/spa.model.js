/*
 * golang ToDo spa.model.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */

/*
 -----ajaxの引数---------------
 ajax.get(url, params)
 ajax.post(url, params)
 -----response-----------------
 data = { }
*/
spa.model = (() =>{
  'use strict';
  //データキャッシュ
  let stateMap = {
    user: null,
    list: null,
    tasks: null,
    chatroom: null,
    chatadmin: null
  };

  const isFakeData = false;

  //return --> [anchor, ..]
  const toFactor = (url, anchor) => {
    const hrefList = url.split('/');
    return _.rest(hrefList, _.indexOf(hrefList, anchor));
  };

  //インスタンスオブジェクト------------------------
  const User = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;

    //stateMap.user = {id:,name:,anchor:,login:, logout}
    //name==a0-->未ログイン
    const login = urlList => {
      //console.info(urlList);
      const params = {page: JSON.stringify(urlList)};
      stateMap.user.anchor = urlList;
      ajax.get('/auth', params)
        .then(response => {
          //console.info(response);
          stateMap.user.name = response.User || 'a0';
          stateMap.user.login = response.Login || null;
          stateMap.user.logout = response.Logout || null;
          stateMap.chatroom = {roomid: response.Roomid || null};
          spa.gevent.publish('spa-login', stateMap.user);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        })
    };

    return {
      get: () => stateMap.user,
      login: login
    };

  })();

  const List = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    const fetch = page => {
      let url = page.join('/');
      console.info(url);
      if (page.length == 1) {
        url = '/list/type/user';
      }
      ajax.get(`/api/${url}`, null)
        .then(data => {
          stateMap.list = data||[];
          spa.gevent.publish('change-list', stateMap.list);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const post = (url, params) => {
      //console.info(params);
      ajax.json('/api/list', params)
        .then(data => {
          stateMap.list.unshift(data);
          spa.gevent.publish('change-list-add', stateMap.list[0]);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const delList = url => {
      const listId = _.last(toFactor(url, 'list'));
      ajax.delete(`/api/list/${listId}`)
        .then(data => {
          spa.uriAnchor.setAnchor({page: '/list'}, false);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const current = params => {
      //キャッシュ
      spa.gevent.publish('change-list', stateMap.list);
    };

    return {
      fetch: fetch,
      current: current,
      post: post,
      delete: delList,
      message: params => spa.gevent.publish('spa-message', params)
    };

  })();

  const Task = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    const request = {
      list: id => {
        return new Promise((resolve, reject) => {
          resolve(stateMap.list.find(ele => ele.ID === id));
        });
      },
      //listIdに所属する全タスクの取得
      task: id => ajax.get(`/api/task/${id}`, null)
    };

    const getList = id => {
      Promise.all([request.list(id), request.task(id)])
        .then(data => {
          //console.info(data);
          stateMap.tasks = data[1];
          spa.gevent.publish('change-task', data);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });

    };

    const post = (url, params) => {
      const listId = _.last(toFactor(url, 'task'));
      ajax.json(`/api/task/${listId}`, params)
        .then(data => {
          //dataは値参照--不都合があればutil.deepCopyを使う
          stateMap.tasks.unshift(data);
          data['listId'] = listId;
          spa.gevent.publish('change-task-add', data);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const putTask = url => {
      const [anchor, listId, taskId] = toFactor(url, 'task');
      const task = stateMap.tasks.find(ele => ele.ID === parseInt(taskId));
      const params = {Done: task.Done ? false:true};
      //console.info(url);
      ajax.patch(`/api/task/${listId}/${taskId}`, params)
        .then(data => {
          const idx = _.findIndex(stateMap.tasks, {ID: data.ID});
          stateMap.tasks[idx].Done = data.Done;
          spa.gevent.publish('change-task-put', {index: idx, put: data.Done});
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    return {
      get: getList,
      post: post,
      put: putTask,
      message: params => spa.gevent.publish('spa-message', params)
    }
  })();

  const ChatRoom = (() => {
    const channel = spa.data.getChannel;
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    const customevent = 'chatroom-state';

    const openChannel = () => {
      ajax.get('/chat/token', null)
        .then(response => {
          channel.open(response.token, customevent);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const closeChannel = () => {
      channel.close();
    };
    
    const castLine = (url, params) => {
      ajax.json(url, params)
        .then(response => {
          console.info(response.time);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    //return {Session:, Roomname:, Owner:, Description:, List:[]stay}
    //List-->自分が参加しているチャットルームのリスト
    const checkin = () => {
      const roomid = stateMap.chatroom.roomid;
      ajax.get(`/chat/checkin/${roomid}`, null)
        .then(response => {
          //console.info(response);
          stateMap.chatroom.list = response.List;
          stateMap.chatroom.session = response.Session;
          spa.gevent.publish('chatroom-in', response);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const getSession = () => {
      const sessionid = stateMap.chatroom.sessionid;
      ajax.get('/chat/checkin/session/${sessionid}', null)
        .then(response => {
          console.info(response);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    return {
      open: openChannel,
      close: closeChannel,
      post: castLine,
      checkin: checkin,
      session: getSession,
      roomlist: () => _.has(stateMap.chatroom, 'list')? stateMap.chatroom.list:[],
      message: params => spa.gevent.publish('spa-message', params)
    };

  })();

  const ChatAdmin = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    const getChatrooms = () => {
      ajax.get('/chat/chatmin/roomlist', null)
        .then(response => {
          //console.info(response);
          spa.gevent.publish('chatmin-list', response);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };
    //add new a chatroom or new a member for chatroom to list
    //customeve <--- chatmin-list-add or chatmin-members-add
    const postForm = (url, params) => {
      //console.info(params);
      ajax.json(url, params)
        .then(response => {
          //add a new chatroom to navi list
          //console.info(response);

          if (! _.has(stateMap.chatroom, 'list')) stateMap.chatroom.list = [];
          if (response.customeve === 'chatmin-list-add') {
            stateMap.chatroom.list.push({roomid: response.id, roomname: response.name});
          }
          spa.gevent.publish(response.customeve, response);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };
    //memberlist and description about a chatroom
    //memberlist must have owner 
    const getRoomInfo = page => {
      const roomid = _.last(page);
      ajax.get(`/chat/chatmin/info/${roomid}`, null)
        .then(response => {
          //console.info(response);
          stateMap.chatadmin = response.List;
          spa.gevent.publish(response.CustomEvent, response);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    //update member flag which is avtive or not
    const flagedMember = stayid => {
      const idx = _.findIndex(stateMap.chatadmin, {id: stayid});
      const stay = stateMap.chatadmin[idx];
      stay.flag = stay.flag? false: true;
      ajax.patch('/chat/chatmin/stay', stay)
        .then(response => {
          //console.info(response);
          const idx = _.findIndex(stateMap.chatadmin, {id: response.Id});
          stateMap.chatadmin[idx].flag = response.Flag;
          spa.gevent.publish('chatmin-members-flag', {index: idx, flag: response.Flag});
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    return {
      roomlist: getChatrooms,
      info: getRoomInfo,
      post: postForm,
      patch: flagedMember,
      message: params => spa.gevent.publish('spa-message', params)
    };

  })();

  const initModule = () => {
    //userオブジェクト初期値生成-->初期値-->name='00'-->ログイン未確認
    stateMap.user = {
      id: '00', name: '00', login: null, logout: null, anchor: '/list'
    };
  };

  return {
    initModule: initModule,
    user: User,
    list: List,
    task: Task,
    checkin: ChatRoom,
    chatmin: ChatAdmin
  };
})();

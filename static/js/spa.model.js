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
 data = JSON.parse(response) == {publish: <val>, appsid: <appsid>}
*/
spa.model = (() =>{
  'use strict';
  //データキャッシュ
  let stateMap = {
    user: null,
    list: null,
    tasks: null
  };

  //モックステータス--false-->fakeデータ使用
  const isFakeData = false;

  //anchor= list or task
  //return --> [anchor, id]
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
      ajax.get('/api/auth', params)
        .then(response => {
          //console.info(response);
          stateMap.user.name = response.User || 'a0';
          stateMap.user.login = response.Login || null;
          stateMap.user.logout = response.Logout || null;
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
    const fetch = () => {
      ajax.get('/api/list', null)
        .then(data => {
          stateMap.list = data;
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
    task: Task
  };
})();

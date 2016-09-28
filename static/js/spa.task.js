/*
 * golang Todos spa.task.js
 * Copyright 2016 ryuji.oike@gmail.com
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.task = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  const
    configMap = {
      anchor: null,
      previous: null
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const task_model = spa.model.task;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //Class名はcontainer内でユニーク
  const setDomMap = function () {
    domMap = {
      container: document.getElementById('task-container'),
      form: document.querySelector("form"),
      tasks: document.getElementById('task-tasks')
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN LOCAL EVENT HANDLERS -------------------
  const onSubmit = event => {
    event.preventDefault();
    const form = new FormData(domMap.form);
    const params = _.object(
        _.map(['Text'], 
          name => [name, form.get(name)])
    );

    const mesData = {
      message: '投稿フォームが未記入です。',
      property: 'error'
    };

    //Validate params
    if ( _.isEmpty(_.without(_.values(params), ''))) {
      task_model.message(mesData);
    } else {
      task_model.post(domMap.form.action, params);
    }

  };

  const putTask = event => {
    var element = _.find(event.path, (element) => {
      //constはundefinedを宣言できないのでvarで宣言
      if (element.tagName === 'A') {
        return element;
      }
    });
    if (element) {
      //hrefの動作停止
      event.preventDefault();
      //click eventのバブリング停止
      event.stopPropagation();

      task_model.put(element.href);
    }

  };

  const clickEventMap = {
    //---container handler section------------
    delList: element => {
      spa.model.list.delete(element.getAttribute('formaction'));
    },
    backHome: element => {
      const previous = configMap.previous;
      if (previous) {
        spa.uriAnchor.setAnchor({page: previous, cache: true }, false);
      }
    }
  };

  const clickHandler = event => {
    //console.info(event.target);
    const element = event.target;
    const listener = element.getAttribute('listener') || 'none';
    if(_.has(clickEventMap, listener)) {
      event.stopPropagation();
      clickEventMap[listener](element);
    }
  };

  //------------ BEGIN CUSTOM EVENT HANDLERS -------------------
  const loadTaskTemplate = event => {
    //list = {ID:, Name:, Creater:}
    //tasks = [{ID:, Text:, Time:, Done:},..]
    //console.info(event.detail);
    const [list, tasks] = event.detail;
    const user = spa.model.user.get();
    const
      login_url = user.logout,
      login_state = 'Log out',
      title = list.Name,
      lid = list.ID;

    stateMap.container.innerHTML = spa.task.template([
      login_url, login_state, title, lid,
      tasks.map(({Text, ID, Done}) => {
        let delState = Done ? 'class="isDone"' : '';
        return `
          <li ${delState}>
            <a class="white rounded-box" href="/task/${lid}/${ID}">
              <span class="checkbox"></span>${Text}
            </a>
          </li>`
      }).join('')
    ]);
    
    setDomMap();
    
    //ローカルイベントのバインド
    domMap.form.addEventListener('submit', onSubmit, false);
    domMap.tasks.addEventListener('click', putTask, false);
    domMap.container.addEventListener('click', clickHandler, false);

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(domMap.container, 'change-task-add', loadTaskAdd);
    spa.gevent.subscribe(domMap.container, 'change-task-put', onTaskPut);
  };

  const loadTaskAdd = event => {
    const newTask = event.detail;
    domMap.tasks
      .insertAdjacentHTML('afterbegin',
        `<li>
          <a class="white rounded-box" href="/task/${newTask.listId}/${newTask.ID}">
            <span class="checkbox"></span>${newTask.Text}
          </a></li>`);
  };

  const onTaskPut = event => {
    const newPut = event.detail;
    if (newPut.put) {
      domMap.tasks.children[newPut.index].classList.add('isDone');
    } else {
      domMap.tasks.children[newPut.index].classList.remove('isDone');
    }
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  const configModule = input_map => {
    spa.util.setConfigMap({
      input_map: input_map,
      config_map: configMap
    });
  };

  // Begin public method /initModule/
  const initModule = container => {
    stateMap.container = container;
    
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'change-task', loadTaskTemplate);

    task_model.get(_.last(configMap.anchor.page));
  };


  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.task.template = ([login_url, login_state, title, lid, tasks]) => {
  return `
    <article id="task-container">
      <div class="container">
        <div class="rounded-box">
          <a class="white rounded-box" href="${login_url}">${login_state}</a>
        </div>          
        <h1 class="rounded-box charcoal">${title}</h1>
        <ul id="task-tasks" class="grey rounded-box">${tasks}</ul>
        <form class="grey rounded-box" action="/task/${lid}">
          <input name="Text" class="rounded-box" type="text" placeholder="add new todo here">
          <button type="submit"><i class="material-icons md-36 grey500">add_box</i></button>
        </form>
        <ul class="grey rounded-box">
          <li><button type="button" class="white rounded-box" listener="delList" formaction="/list/${lid}">Delete</a></li>
          <li><button type="button" class="white rounded-box" listener="backHome">Back Home</button></li>
        </ul>
        <div class="logs"></div>
      </div>
    </article>`;
};

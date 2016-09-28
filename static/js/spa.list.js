/*
 * golang ToDo spa.list.js
 * Copyright 2016 ryuji.oike@gmail.com
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.list = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  const
    configMap = {
      anchor: null,
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const list_model = spa.model.list;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //Class名はcontainer内でユニーク
  const setDomMap = function () {
    domMap = {
      form: document.querySelector("form"),
      lists: document.getElementById('lists')
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN LOCAL EVENT HANDLERS -------------------
  const onSubmit = event => {
    event.preventDefault();
    const form = new FormData(domMap.form);
    const params = _.object(
        _.map(['name'], 
          name => [name, form.get(name)])
    );

    const mesData = {
      message: '投稿フォームが未記入です。',
      property: 'error'
    };

    //Validate params
    if ( _.isEmpty(_.without(_.values(params), ''))) {
      list_model.message(mesData);
    } else {
      list_model.post(domMap.form.action, params);
    }

  };

  //------------ BEGIN CUSTOM EVENT HANDLERS -------------------
  const loadListTemplate = event => {
    //lists = [{ID:, Name:, Creater:},,,]
    const lists = event.detail;
    const type = _.last(configMap.anchor.page);
    let
      list_url = '/list/type/all',
      list_type = 'グループのリストを表示する',
      title = 'Your lists';

    if(type === 'all') {
      list_url = '/list/type/user';
      list_type = 'あなたのリストを表示する';
      title = 'All the lists';
    }
    //params = [login_url, login_state, title, lists]
    stateMap.container.innerHTML = spa.list.template([
      list_url, list_type, title,
      lists.map(({Name, ID}) => 
        `<li><a class="white rounded-box" href="/task/${ID}">${Name}</a></li>`).join('')
    ]);
    
    setDomMap();
    
    //ローカルイベントのバインド
    domMap.form.addEventListener('submit', onSubmit, false);
  };

  const loadListAdd = event => {
    const newList = event.detail;
    domMap.lists
      .insertAdjacentHTML('afterbegin',
        `<li><a class="white rounded-box" href="/task/${newList.ID}">${newList.Name}</a></li>`);
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
    spa.gevent.subscribe(stateMap.container, 'change-list', loadListTemplate);
    spa.gevent.subscribe(stateMap.container, 'change-list-add', loadListAdd);

    let key = 'fetch';
    if (configMap.anchor.cache) key = 'current';

    list_model[key](configMap.anchor.page);
  };


  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.list.template = ([list_url, list_type, title, lists]) => {
  return `
    <article id="list-container">
      <div class="container">
        <div class="rounded-box">
          <a class="white rounded-box" href="${list_url}">${list_type}</a>
        </div>          
        <h1 class="rounded-box charcoal">${title}</h1>
        <ul id="lists" class="grey rounded-box">${lists}</ul>
        <form class="grey rounded-box" action="/list">
          <input name="name" class="rounded-box" type="text" placeholder="new list name">
          <button type="submit"><i class="material-icons md-36 grey500">add_box</i></button>
        </form>
        <div class="logs"></div>
      </div>
    </article>`;
};

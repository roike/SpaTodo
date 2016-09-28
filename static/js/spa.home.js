/*
 * golang Todos spa.home.js
 * Copyright 2016 ryuji.oike@gmail.com
 * -----------------------------------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */

spa.home = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  const
    configMap = {
      anchor: null,
      user: null
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  //----------------- END MODULE SCOPE VARIABLES ---------------

  //-------------------- BEGIN UTILITY METHODS -----------------

  //--------------------- END UTILITY METHODS ------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  const setDomMap = () => {
    domMap = {
      //domコレクションをキャッシュするとドキュメントトラバーサル数を減らせる
    };
  };
  
  //--------------------- END DOM METHODS ----------------------

  //------------------- BEGIN EVENT HANDLERS -------------------


  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  const configModule = input_map => {
    spa.util.setConfigMap({
      input_map: input_map,
      config_map: configMap
    });
  };

  const initModule = container => {
    stateMap.container = container;
    let
      login_url = configMap.user.logout,
      login_state = 'Log out';

    if(configMap.user.name === 'a0') {
      login_url = configMap.user.login;
      login_state = 'Log in';
    }

    stateMap.container.innerHTML = spa.home.template([login_url, login_state]);
    setDomMap();
  };

  
  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.home.template = ([login_url, login_state]) => {
  return `
    <article id="shell-container">
      <div class="container">
        <div class="rounded-box">
          <a class="white rounded-box" href="${login_url}">${login_state}</a>
        </div>          
        <h1 class="rounded-box charcoal">App Lists</h1>
        <ul class="grey rounded-box">
          <li><a class="white rounded-box" href="/list/type/user">タスク管理</a></li>
          <li><a class="white rounded-box" href="/checkin">チャットルーム</a></li>
          <li><a class="white rounded-box" href="/todos">グループ管理</a></li>
        </ul> 
        <div class="logs"></div>
      </div>
    </article>`;
};


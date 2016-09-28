/*
 * golang Todos spa.checkin.js
 * Copyright 2016 ryuji.oike@gmail.com
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.checkin = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  const
    configMap = {
      anchor: null,
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
      channel: null,
      navi: null
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const checkin_model = spa.model.checkin;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //Class名はcontainer内でユニーク
  const setDomMap = function () {
    domMap = {
      form: stateMap.container.querySelector("form"),
      session: document.getElementById('chat-session'),
      cast: stateMap.container.querySelector(".chat-text"),
      navi: stateMap.container.querySelector(".chat-navi")
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN LOCAL EVENT HANDLERS -------------------
  //投稿する
  const onSubmit = event => {
    event.preventDefault();
    const form = new FormData(domMap.form);
    const params = _.object(
        _.map(['text'], 
          name => [name, form.get(name)])
    );

    const mesData = {
      message: '投稿フォームが未記入です。',
      property: 'error'
    };

    //Validate params
    if ( _.isEmpty(_.without(_.values(params), ''))) {
      checkin_model.message(mesData);
    } else {
      checkin_model.post(domMap.form.action, params);
    }

  };
  //通信を開通する
  const onSession = event => {
    //console.info("cllick Cast");
    if (! stateMap.channel.open) {
      checkin_model.open();
    }
  };

  //ナビゲーションメニュの表示
  const loadNavi = event => {
    //表示位置の設定
    const rect = domMap.navi.getBoundingClientRect();
    const pos = {
      x: rect.left,
      y: rect.top + rect.height
    };
    stateMap.navi.load = spa.shell.chatNavi(
      pos,
      checkin_model.roomlist(),
      stateMap.navi.load);
    
    domMap.navi.textContent = stateMap.navi.load ? 'close':'menu';
  };

  //モジュール移動があったらchannelを閉じる
  const onPopstate = event => {
    if (stateMap.channel.open) {
      checkin_model.close();
    }
  };
  //------------ BEGIN CUSTOM EVENT HANDLERS -------------------
  //Todo:chatroomの前後のsessionをスクロール表示する
  const loadSession = event => {
    const dataSet = event.detail;
    const casts = dataSet.casts;
    domMap.session.innerHTML = casts.map(cast => {
        return `
          <div class="chat-online">
            <span class="even">${cast}</span>
          </div>`
      }).join('')
  };

  //broadcastの投稿を受信する
  const onCast = event => {
    const cast = event.detail;
    const castTime = new Date(cast.time);
    const today = new Date();
    let disp = castTime.getHours() + ':' + castTime.getMinutes();
    if (castTime.getDate() !== today.getDate()) {
      disp = castTime.toDateString() + ' ' + disp;
    }
    const user = cast.user.split('@')[0];
    domMap.session
      .insertAdjacentHTML('beforeend',
        `<span class="even">
          ${user}:${disp}<br>
          ${cast.text}<br>
        </span>`);
  };
  //Channelの開通状態を受信する
  //{onopen:,onerror:,onclose:}
  const onState = event => {
    const state = event.detail;
    const onKey = _.keys(state)[0];
    let bool = false;
    if (onKey === "onopen") bool = true;
    stateMap.channel.open = bool;
    domMap.session
      .insertAdjacentHTML('beforeend',
        `<span class="even">${state[onKey]}<br></span>`);
  };

  //初期画面をロードする
  const loadChatRoom = event => {
    const dataSet = event.detail;
    const id = dataSet.Session.id;
    const owner = dataSet.Owner;
    const name = dataSet.Roomname;
    const description = dataSet.Description;
    const list = dataSet.List;
    //console.info(list);
    stateMap.container.innerHTML = spa.checkin.template(
      [owner, name, description, id]
    );

    setDomMap();
    //ローカルイベントのバインド
    domMap.form.addEventListener('submit', onSubmit, false);
    domMap.cast.addEventListener('click', onSession, false);
    domMap.navi.addEventListener('click', loadNavi, false);
    //
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'chatroom-cast', onCast);
    spa.gevent.subscribe(stateMap.container, 'chatroom-state', onState);
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
    stateMap.navi = {load: false};
    stateMap.channel = {open: false};

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'chatroom-in', loadChatRoom);
    // 
    // Handle URI anchor change events.
    window.addEventListener('popstate', onPopstate);

    checkin_model.checkin();

  };


  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.checkin.template = ([admin, room, description, sessionid]) => {
  return `
    <article id="checkin-container">
      <div class="container">
        <header class="rounded-box">
          <i class="material-icons chat-navi">menu</i>
          <div class="white rounded-box centered">ChatRoom管理人：${admin}</div>
        </header>    
        <h2 class="content-title rounded-box charcoal">
          ChatRoom ${room}
        </h2>
        <div id="chat-session">${description}</div>
        <form class="grey rounded-box" action="/chat/checkin/cast/${sessionid}">
          <div class="chat-text">
            <label>Type Message and Press Enter</label>
            <input class="rounded-box" type="text" name="text" placeholder="you chat here">
          </div>
        </form>
        <div class="logs"></div>
      </div>
    </article>`;
};



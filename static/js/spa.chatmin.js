/*
 * golang Todos spa.chatmin.js
 * Copyright 2016 ryuji.oike@gmail.com
 * --------------------------------------
 *  チャットルームの作成とメンバー管理
 *  ------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.chatmin = (() => {
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
      navi: null
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const chatmin_model = spa.model.chatmin;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //Class名はcontainer内でユニーク
  const setDomMap = () => {
    domMap = {
      chatmin: document.getElementById('chatmin-container'),
      chatmininfo: document.getElementById('chatmin-info-container'),
      roomlist: stateMap.container.querySelector(".roomlist"),
      memberlist: stateMap.container.querySelector(".memberlist"),
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN LOCAL EVENT HANDLERS -------------------

  const keypressMap = {
    postForm: element => {
      const reg = /_/g;
      const url = element.dataset.url.replace(reg, '/');
      const params = {};
      params[element.name] = element.value;
      const mesData = {
        message: '投稿フォームが未記入です。',
        property: 'error'
      };

      //Validate params
      if ( _.isEmpty(_.without(_.values(params), ''))) {
        chatmin_model.message(mesData);
      } else {
        chatmin_model.post(url, params);
      }
    }
  };
  //click event mapping
  const clickMap = {
    //fade out chat navigation menu
    chatNavi: element => {
      const rect = element.getBoundingClientRect();
      const pos = {
        x: rect.left,
        y: rect.top + rect.height
      };
      //navi.load==true-->表示中
      stateMap.navi.load = spa.shell.chatNavi(
        pos,
        spa.model.checkin.roomlist(),
        stateMap.navi.load);
      
      element.textContent = stateMap.navi.load ? 'close':'menu';
    },
    //set active member or not
    patchMember: element => {
      chatmin_model.patch(element.dataset.id);
    },
    postTextarea: element => {
      const reg = /_/g;
      const url = element.dataset.url.replace(reg, '/');
      const params = {};
      params[domMap.textarea.name] = domMap.textarea.value;
      const mesData = {
        message: '投稿フォームが未記入です。',
        property: 'error'
      };

      //Validate params
      if ( _.isEmpty(_.without(_.values(params), ''))) {
        chatmin_model.message(mesData);
      } else {
        chatmin_model.post(url, params);
      }
    }
  };

  const clickHandler = event => {
    //console.info(event.target);
    const element = event.target;
    const listener = element.getAttribute('listener') || 'none';
    if(_.has(clickMap, listener)) {
      //href等の動作停止
      event.preventDefault();
      //click eventのバブリング停止
      event.stopPropagation();
      clickMap[listener](element);
    }
  };
  
  const keypressHandler = event => {
    //console.info(event.target);
    if(event.which == 13) {
      const element = event.target;
      const listener = element.getAttribute('listener') || 'none';
      if(_.has(keypressMap, listener)) {
        //href等の動作停止
        event.preventDefault();
        //click eventのバブリング停止
        event.stopPropagation();
        keypressMap[listener](element);
      }
    }
  }; 
  // BEGIN CUSTOM EVENT HANDLERS -------------------
  //Load lists of chatrooms
  const loadChatAdmin = event => {
    const admin = configMap.user.name;
    const list = event.detail;
    stateMap.container.innerHTML = spa.chatmin.template([
      admin,
      list.map(({id, name}) => 
          `<li>
             <a class="white rounded-box" href="/chatmin/info/${id}">${name}</a></li>`).join('')
    ]);
    //Cache dom objects
    domMap = {
      chatmin: document.getElementById('chatmin-container'),
      roomlist: stateMap.container.querySelector(".roomlist")
    };
    //ローカルイベントのバインド
    domMap.chatmin.addEventListener('click', clickHandler, false);
    domMap.chatmin.addEventListener('keypress', keypressHandler, false);
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'chatmin-list-add', addList);
  };

  //追加したChatroomをリストの最初に表示する
  //Naviに追加する
  const addList = event => {
    const newRoom = event.detail;
    domMap.roomlist
      .insertAdjacentHTML('afterbegin',
        `<li><a class="white rounded-box" href="/chatmin/info/${newRoom.id}">${newRoom.name}</a></li>`);
  };
  //Chatroomのメンバーとチャットルームの説明
  const loadInfo = event => {
    const admin = configMap.user.name;
    const roominfo = event.detail;
    const list = roominfo.List;
    const name = roominfo.Roomname;
    const id = roominfo.Roomid;
    const description = roominfo.Description;
    stateMap.container.innerHTML = spa.chatmin.info([
      admin, name, id, description,
      list.map(({id, usrmail}) => 
          `<li><span class="white rounded-box hover" listener="patchMember" data-id="${id}">
          ${usrmail}</span></li>`).join('')
    ]);
    //Cache dom objects
    domMap = {
      chatmininfo: document.getElementById('chatmin-info-container'),
      memberlist: stateMap.container.querySelector(".memberlist"),
      textarea: stateMap.container.querySelector(".chat-description > textarea")
    };

    //add stay.flag to memberList
    _.each(list, (ele, idx) => {
      if(!ele.flag) {
        domMap.memberlist.children[idx].classList.add('isDone');
      }
    });
    //ローカルイベントのバインド
    domMap.chatmininfo.addEventListener('click', clickHandler, false);
    domMap.chatmininfo.addEventListener('keypress', keypressHandler, false);
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'chatmin-members-add', addMembers);
    spa.gevent.subscribe(stateMap.container, 'chatmin-members-flag', flagMembers);
  };
  //memberのリスト追加
  const addMembers = event => {
    const newMember = event.detail;
    domMap.memberlist
      .insertAdjacentHTML('afterbegin',
        `<li><span class="white rounded-box hover" listener="patchMember" data-id="${newMember.id}">
            ${newMember.usrmail}</span></li>`);
  };
  const flagMembers = event => {
    const newFlag = event.detail;
    if (newFlag.flag) {
      domMap.memberlist.children[newFlag.index].classList.remove('isDone');
    } else {
      domMap.memberlist.children[newFlag.index].classList.add('isDone');
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
    stateMap.navi = {load: false};

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(stateMap.container, 'chatmin-list', loadChatAdmin);
    spa.gevent.subscribe(stateMap.container, 'chatmin-members', loadInfo);

    // root/chatmin, root/chatmin/{roomid}
    const anchor = configMap.anchor;
    switch(anchor.page.length) {
      case 1:
        //chatroomをリストする
        chatmin_model.roomlist();
        break;
      case 3:
        //chatroomのメンバーをリストする
        chatmin_model.info(anchor.page);
        break;
      default:
        console.info(anchor.page);
        return false;
    }
  };


  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.chatmin.template = ([admin, roomlist]) => {
  return `
    <article id="chatmin-container">
      <div class="container">
        <header class="rounded-box">
          <i class="material-icons" listener="chatNavi">menu</i>
          <div class="white rounded-box centered">ChatRoom管理人：${admin}</div>
        </header>          
        <h2 class="rounded-box charcoal">Chat Room List</h2>
        <ul class="grey rounded-box roomlist">${roomlist}</ul>
        <div class="grey rounded-box form">
          <div class="chat-room">
            <label>Type New Name for Room and Press Enter</label>
            <input class="rounded-box" type="text" name="name" listener="postForm" data-url="_chat_chatmin_create" placeholder="new chat roome name here">
          </div>
        </div>
        <div class="logs"></div>
      </div>
    </article>`;
};

spa.chatmin.info = ([admin, chatroom, id, description, memberlist]) => {
  return `
    <article id="chatmin-info-container">
      <div class="container">
        <header class="rounded-box">
          <i class="material-icons" listener="chatNavi">menu</i>
          <div class="white rounded-box centered">ChatRoom管理人：${admin}</div>
        </header>          
        <h2 class="rounded-box charcoal">${chatroom}</h2>
        <ul class="grey rounded-box memberlist">${memberlist}</ul>
        <div class="grey rounded-box form">
          <div class="chat-members">
            <label>Type New Member for Chatroom and Press Enter<</label>
            <input class="rounded-box" type="text" listener="postForm" name="usrmail" data-url="_chat_chatmin_stay_${id}" placeholder="new mail address for chat room">
          </div>
          <div class="chat-description">
            <label>Type Description about Your Chatroom and Click Save</label>
            <textarea class="rounded-box" rows="10" name="description" placeholder="description length:300">${description}</textarea>
            <i class="material-icons md-24 md-dark" listener="postTextarea" data-url="_chat_chatmin_description_${id}">save</i>
          </div>
        </div>
        <div class="logs"></div>
      </div>
    </article>`;
};

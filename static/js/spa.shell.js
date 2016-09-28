/*
 * golang Todos spa.shell.js
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

/*新規モジュールを追加する場合のtodo---------------
 * anchor_schemaに追加
 * ------------------------------------------------
 * popupstateイベント契機で各モジュールの機能をマッピングする
 * 画面遷移ではHrefイベントを起点にする
 */
spa.shell = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  const
    //congigMapに静的な構成値を配置
    configMap = {},
    //stateMapにshellで共有する動的情報を配置
    //anchor_map=url履歴の格納
    //container=コンテンツを動的に切り替えるセクションを宣言
    stateMap = {
      //ローカルキャッシュはここで宣言する
      container: undefined,
      anchor_map: []
    },
    //動的に呼び出す他モジュールを格納
    moduleMap = {},
    //定数はここで宣言
    user_model = spa.model.user,
    //許可するanchorはここで宣言--モジュール名に一致
    //homeはshellで代用
    anchor_schema = [
      'home',
      'checkin', 'chatmin',
      'list', 'task'
    ];
  //Domコレクションをキャッシュ
  let domMap = {};
  //----------------- END MODULE SCOPE VARIABLES ---------------

  //-------------------- BEGIN UTILITY METHODS -----------------
  const makeError = spa.util.makeError;
  const testHistory = page => {
    //page=[schema,,,]
    //現在のurl履歴を登録する
    //戻るリンクの不適切な循環を防止する
    //ひとつ前の画面==stateMap.anchor_map[idx-1]
    const pageHistory = page.join('_');
    let idx = stateMap.anchor_map.indexOf(pageHistory);
    if (page.length == 1) {
      //anchor only-->moduleの切り替えなので履歴を初期化する
      stateMap.anchor_map = [pageHistory];
      idx = 0;
    }
    else if (idx == -1) {
      stateMap.anchor_map.push(pageHistory);
      idx = stateMap.anchor_map.length - 1;
    }
    else if (stateMap.anchor_map.length - idx > 1) {
      stateMap.anchor_map = stateMap.anchor_map.slice(0, idx + 1);
    } else {
      //raised unintended operation
      console.info(page.toString());
    }
    //ひとつ前の画面のページ配列をunderbarで連結する 
    return idx == 0 ? null : stateMap.anchor_map[idx-1].split('_');
  };

  //--------------------- END UTILITY METHODS ------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  const setDomMap = () => {
    domMap = {
      //domコレクションをキャッシュするとドキュメントトラバーサル数を減らせる
      //acct: document.getElementById('shell-head-acct
    };
  };
  
  //--------------------- END DOM METHODS ----------------------

  //------------------- BEGIN EVENT HANDLERS -------------------

  // BEGIN CUSTOM EVENT HANDLERS -------------------
  const onLogin = event => {
    const user = event.detail;
    spa.uriAnchor.setAnchor({page: user.anchor}, false);
  };


  const onError = event => {
    const error = {
      name: 'server',
      message: event.detail,
      data: null
    };
    moduleMap.error.configModule({
      error_model: error
    });
    moduleMap.error.initModule( stateMap.container );

  };

  const onMessage = event => {
    const mesData = event.detail;
    const logs = document.getElementsByClassName('logs')[0];
    logs.insertAdjacentHTML('afterbegin', spa.shell.message(mesData.message));
    const message = document.getElementById('spa-message');
    message.classList.add(mesData.property);
    if (message.classList.contains('is-paused')) {
      message.classList.remove("is-paused");
    }
    const closeMessage = () => {
      logs.removeChild(message);
    };

    message.addEventListener("animationend", closeMessage, false);
    //_.delay(closeMessage, 7000, message);

  };

  //routing for local event
  //ここでイベントを捕捉する場合はschemaのどれかが必要
  //例:href='/blog/<pre>/<slug>'
  //Google loginなどschemaがあっても外部にスルーさせたい
  //イベントはバブリングをサブモジュールで止めるか、例えばerror.js
  //あるいはここでスルー処理を追加する
  const handleAnchorClick = event => {
    var element = _.find(event.path, (element) => {
      //constはundefinedを宣言できないのでvarで宣言
      if (element.tagName === 'A') {
        return element;
      }
    });
    //console.info(element);
    //element.classList.contains("someTag")
    if(element) {
      const hrefList = element.href.split('/'),
        schema = _.intersection(hrefList, anchor_schema);
      
      //console.info(hrefList);
      if(schema.length > 0) {
        event.preventDefault();
        //loginの場合のみhrefは有効
        if(user_model.get().name === 'a0') {
          const mesData = {
            message: 'google loginしてください。',
            property: 'error'
          };

          spa.gevent.publish('spa-message', mesData);
        } else {
          const anchor = _.rest(hrefList, _.indexOf(hrefList, schema[0]));
          spa.uriAnchor.setAnchor({page: anchor}, false);
        }
      }
    }
  };

  /*
   * app_idの監視
   * urlの監視--schema以外のページ要求はエラーに誘導
   * 階層履歴は親履歴(anchor only)で都度階層をリセット
   */
  const onPopstate = event => {
    try {
      //アドレスバーのanchorを適正テスト後に取り出す
      //引数はdefault_anchor,anchorがあればそれを優先
      const anchor_map_proposed = spa.uriAnchor.makeAnchorMap('home');
      //console.info(anchor_map_proposed);
      const auth = user_model.get().name;;
      if (auth === '00') {
        //loginチェックを行う
        //domMap.acct.innerText = '... processing ...';
        user_model.login(anchor_map_proposed.page);
        return false;
      } 

      const anchor = anchor_map_proposed.page[0];
      const previous = testHistory(anchor_map_proposed.page);
      //domMap.acct.innerText = auth;
      moduleMap[anchor].configModule({
        //各anchorで参照する場合は先頭のconfigMapでnull宣言する
        anchor: anchor_map_proposed,
        previous: previous,
        user: user_model.get(),
        anchor_schema: anchor_schema
      });

      moduleMap[anchor].initModule( stateMap.container );

    }
    catch (error) {
      //不適正なアドレス 
      console.info('annchor_map_error called');
      moduleMap.error.configModule({
        error_model: error
      });
      moduleMap.error.initModule( stateMap.container );
    }
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  //ナビゲーションメニュの表示
  //loadIn==true-->メニュウを表示
  //return true-->表示中
  const loadChatavi = (pos, list, loadIn) => {
    const fadeInDown = () => {
      stateMap.container.insertAdjacentHTML('afterbegin', spa.shell.chatavi(
        list.map(({roomid, roomname}) => 
          `<a href="/checkin/${roomid}">${roomname}</a>`).join('')
      ));
      const navi = stateMap.container.querySelector(".chat-navi-in");
      navi.style.top = `${pos.y}px`;
      navi.style.left = `${pos.x}px`;

      if (navi.classList.contains('is-paused')) {
        navi.classList.remove("is-paused");
      }
      return true;
    };

    const fadeOutUp = navi => {
      navi.animate([
        //keyframes
        { 
          opacity: 1,
          transform: 'translate3d(0, 0, 0)'
        },
        { 
          opacity: 0,
          transform: 'translate3d(0, -200px, 0)' 
        }], 1000);
      
    };
    
    if (loadIn) {
      const navi = stateMap.container.querySelector(".chat-navi-in");
      fadeOutUp(navi);
      _.delay(
        () => {
          stateMap.container.removeChild(navi);
        }, 1000);
      return false;
    }

    return fadeInDown();
  };
  const initModule = () => {
    //ルーティング対象はすべてmoduleMapに組み込む
    moduleMap.error = spa.error;
    _.each(anchor_schema, ele => {
      moduleMap[ele] = spa[ele];
    });

    stateMap.container = document.getElementById('spa');
    
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe( stateMap.container, 'spa-login', onLogin  );
    spa.gevent.subscribe( stateMap.container, 'spa-error', onError );
    spa.gevent.subscribe( stateMap.container, 'spa-message', onMessage);

    // ローカルイベントのバインド
    document.addEventListener('click', handleAnchorClick, false);
    //callできるanchorを設定
    spa.uriAnchor.setConfig(anchor_schema);

    // Handle URI anchor change events.
    window.addEventListener('popstate', onPopstate);
    window.dispatchEvent(new Event('popstate'));
  };

  
  // End PUBLIC method /initModule/
  //shellが公開するメソッド
  return {
    initModule: initModule,
    chatNavi: loadChatavi
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.shell.message = message => {
  return `
    <div id="spa-message" class="fadeInAndOut is-paused rounded-box">
      <i class="material-icons">error_outline</i>
      ${message}
    </div>`;
};

spa.shell.chatavi = chatrooms => {
  return `
    <nav class="chat-navi-in is-paused">
      <h2>Todos ナビゲーション</h2>
      <a href="/home">Home</a>
      <a href="/chatmin">ChatRoom管理</a>
      ${chatrooms}
    </nav>`;
};

/*
 * template spa.test.js
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
spa.test = (() => {
  'use strict';
  //-------BEGIN SCOPE VARIABLES----------------------------
  let
    configMap = {
      //null宣言するとspa.shellで値がセットされる
      anchor: null,
      anchor_schema: null
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null
    },
    domMap = {};

  //公開モジュールを参照する場合はここで宣言
  const test_model = spa.model.test;

  //----END SCOPE VARIABLES-------------------------------- 

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //可読性のためtarget elementは分散させずにここで宣言
  const setDomMap = () => {
    domMap = {
      container: document.getElementById('test-container'),
      content: document.getElementById('test-content'),
      upload: document.getElementById('handle-image'),
      spinner: stateMap.container.getElementsByClassName('mdl-spinner')[0]
    };
  };


  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  const onHandleClick = event => {
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
        schema = _.intersection(hrefList, configMap.anchor_schema);

      //console.info(hrefList);
      if(schema.length > 0) {
        test_model.close(); 
      }
    }
  };
  const upLoad = event => {
    const file = domMap.upload.files[0];
    if (file === undefined || file.size > 1000000)  {
      return false;
    }
    
    domMap.spinner.classList.add('is-active');
    test_model.upload(file)
      .then(response => {
        const filename = response.filename;
        const htmlString = `
          <img class="thumbnail"
             alt="Thumbnail"
             src="/dwload/${filename}">`;

        domMap.content.insertAdjacentHTML('afterend', htmlString);
      })
      .then(() => {
        domMap.spinner.classList.remove('is-active');
      })
      .catch(error => {console.info(error);});
  };

  //グローバルカスタムイベントのコールバック
  const onTest = event => {
    const embed = event.detail;
    stateMap.container.innerHTML = spa.test.template(embed);
    setDomMap();

    //ローカルイベントのバインド

    if (embed.entry === 'channel') {
      domMap.container.addEventListener('click', onHandleClick, false);
      test_model.channel();
      //document.getElementById('test-container').addEventListener('click', onHandleClick, false);
    }else if (embed.entry === 'upload') {
      domMap.upload.addEventListener('change', upLoad, false);
    }

    //mdlイベントの再登録
    componentHandler.upgradeDom();
  };

  const onChannel = event => {
    const message = event.detail;
    domMap.content.innerText = message;

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
    spa.gevent.subscribe( stateMap.container, 'change-test', onTest);
    spa.gevent.subscribe( stateMap.container, 'channel-test', onChannel);

    test_model.load('/' + configMap.anchor.page.join('/'));
  };

  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.test.template = ({entry, title, content}) => {
  return `
  <article id="test-container">
    <div class="test-content mdl-grid">
      <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
        <header class="test-header">
          <span>Test&nbsp;|&nbsp;${entry}</span>
        </header>
        <div class="mdl-card__title">
          <h2>${title}</h2>
        </div>
        <div class="test-section mdl-card__supporting-text">
          <div id="test-content">${content}</div>
          <!-- MDL Spinner Component -->
          <div class="mdl-spinner mdl-js-spinner"></div>
        </div>
      </div>
      <nav class="test-nav mdl-cell mdl-cell--12-col">
        <a href="/newist">
          <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon" >
            <i class="material-icons" role="presentation">arrow_back</i>
          </button>
        </a>
      </nav>
    </div>
  </article>`;
};


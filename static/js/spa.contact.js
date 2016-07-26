/*
 * template spa.contact.js
 * Copyright 2016 ryuji.oike@gmail.com
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.contact = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  let
    configMap = {},
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    },
    domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const contact_model = spa.model.contact;

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //Class名はcontainer内でユニーク
  const setDomMap = function () {
    domMap = {
      form: document.querySelector("form"),
      message: document.getElementById('contact-message')
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  const onSubmit = event => {
    event.preventDefault();
    const form = new FormData(domMap.form);
    const params = _.object(
        _.map(['name', 'email', 'note'], 
          name => [name, form.get(name)])
    );
    const formRect = domMap.form.getBoundingClientRect();
    const posY = formRect.top;
    const posX = formRect.left + 50;
    const mesData = {
      top: `${posY}px`,
      left: `${posX}px`,
      message: '投稿フォームが未記入です。'
    };

    //Validate params
    if ( _.isEmpty(_.without(_.values(params), ''))) {
      contact_model.message(mesData);
    } else if (params.email.length === 0) {
      mesData.message= 'Emailアドレスがありません。';
      contact_model.message(mesData);
    } else {
      contact_model.mail(domMap.form.action, params);
    }

  };

  const onContact = event => {
    domMap.message.innerText = event.detail;
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  const configModule = input_map => {
    spa.util.setConfigMap({
      input_map: input_map,
      config_map   : configMap
    });
    return true;
  };

  // Begin public method /initModule/
  const initModule = container => {
    container.innerHTML = spa.contact.template;
    stateMap.container = document.getElementById('contact-container');
    setDomMap();

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe( stateMap.container, 'change-contact', onContact);

    //ローカルイベントのバインド
    domMap.form.addEventListener('submit', onSubmit, false);

    //mdlイベントの再登録
    componentHandler.upgradeDom();

  };


  // return public methods
  return {
    configModule: configModule,
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.contact.template = (() => {
  //
  return `
    <article id="contact-container">
      <div class="contact-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--4dp">
          <div class="mdl-card__title">
            <h2 class="mdl-card__title-text">Contact</h2>
          </div>
          <div class="mdl-card__media">
            <img class="article-image" src=" /images/banner.png" border="0" alt="">
          </div>
          <div class="mdl-card__supporting-text">
            <p id="contact-message">
            投稿者のgoogleアカウントにメールします。
            </p>
            <form action="/contact" class="form-contact">
              <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <input name="name" class="mdl-textfield__input" pattern="[A-Z,a-z, ]*" type="text" id="Name">
                <label class="mdl-textfield__label" for="Name">Name...</label>
                <span class="mdl-textfield__error">Letters and spaces only</span>
              </div>
              <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <input name="email" class="mdl-textfield__input" type="text" id="Email">
                <label class="mdl-textfield__label" for="Email">Email...</label>
              </div>
              <div class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                <textarea name="note" class="mdl-textfield__input" type="text" rows="5" id="note"></textarea>
                <label class="mdl-textfield__label" for="note">Enter note</label>
              </div>
              <p>
                <button class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent" type="submit">
                    Submit
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </article>`;
})()

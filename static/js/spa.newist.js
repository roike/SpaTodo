/*
 * template spa.newist.js
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
spa.newist = (() => {
  'use strict';
  //-------BEGIN SCOPE VARIABLES----------------------------
  let
    configMap = {
      anchor: null,
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
      offset: 0,
      tags: 'all'
    },
    domMap = {};
  
  //公開モジュールを参照する場合はここで宣言

  //----END SCOPE VARIABLES-------------------------------- 

  //------------------- BEGIN UTILITY METHODS ------------------
  
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //可読性のためtarget elementは分散させずにここで宣言
  const setDomMap = () => {
    domMap = {
      more: document.getElementById('newist-more')
    };
  };

  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------

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
    container.innerHTML = spa.newist.template;
    stateMap.container = document.getElementById('newist-container');
    setDomMap();
    
    //グローバルカスタムイベントのバインド
    
    //ローカルイベントのバインド

    //mdlイベントの再登録
    componentHandler.upgradeDom();

  };

  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.newist.template = (() => {
  //
  return `
    <article id="newist-container">
      <div class="newist-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
          <div class="mdl-card__title">
            <h2>エントリTest</h2>
          </div>
          <div id="entry-contents">
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/publish">データの取得</a></h3>
                <p>サーバからメッセージを取得しTest画面に表示します。<br/>
                Href契機でフロントエンドのルータがPostリクエストを送信します。
                リクエストを受信したサーバは、json={user_id: user_id, publish: data}をフロントエンドに返信します。
                データを受信すると、TestモジュールがHtmlを生成して表示します。
                </p>
                <p>
                データの送受信はコールバック仕様ではなく、PubSub仕様に沿ったイベント駆動です。
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | pub</span>
                </footer>
              </div>
            </section>
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/identify">ユーザチェック</a></h3>
                <p>未ログインの以下動作を確認します。<br/>
                認証エラーのタイトルとGoogleアカウントにログインするというリンクを表示する。<br/>
                Googleログイン処理後にサーバからデータを取得してリクエストされたURLページを表示する。<br/>
                このテストは未ログインのまま直接にURLを入力した場合(Bookmark等)の動作と同じになります。
                </p>
                <p>
                テスト動作確認のため人為的に未ログイン状態を作っています。
                そのためリクエストurlがidentifyからidentifiedにかわります。
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | Identify</span>
                </footer>
              </div>
            </section>
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/spoofing">なりすましチェック</a></h3>
                <p>Status:403 Forbiddenを確認します。<br/>
                クライアント側のIDとサーバで管理しているIDが一致しない場合に
                「Forbidden, No access right.」メッセージがエラー画面に表示されます。
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | Spoofing</span>
                </footer>
              </div>
            </section>
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/channel">リアルタイム通信</a></h3>
                <p>Channel Apiを使ってリアルタイム通信の動作を確認します。<br/>
                リアルタイム通信テスト画面でサーバからのメッセージを待ち受けます。
                2秒程度で「メッセージを受信しました。」と表示されます。
                またconsoleで次の各ステージがログされます。
                </p>
                <p>
                  「通信チャネルが開通しました。」<br/>
                  5分経過すると「通信チャネルがタイムアウトしました。」<br/>
                  前のページに戻ると「通信チャネルが終了しました。」
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | Channel</span>
                </footer>
              </div>
            </section>
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/upload">画像ファイルアップロード</a></h3>
                <p>Cloud Storageに画像ファイルをアップロードし、
                サムネイルを表示します。
                </p>
                <p>
                アップロードできるのはファイルサイズが1MB以下の画像ファイルのみです。<br/>
                アップロードした画像ファイルは自動で削除されます。
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | Upload</span>
                </footer>
              </div>
            </section>
            <section>
              <div class="newist-section mdl-card__supporting-text">
                <h3><a href="/test/error">エラーページの表示</a></h3>
                <p>サーバで発生したエラーで、エラーページに遷移するのを確認します。<br/>
                エラーページのタイトルはServerで例外発生になります。
                </p>
                <footer class="mdl-mini-footer">
                  <span>Test | Error</span>
                </footer>
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>`;
})();

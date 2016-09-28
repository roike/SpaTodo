##Sample Apps For App Engine With Golang
このアプリは自身のGo言語学習用に開発しています。GAEで動くものなので、可能な限りGAEのAPIを実装していく予定です。一応アプリ名は"TodosCast"としました。これはIo2014にあったGAE with Golangのサンプルコード"Todo"を自身のGolang学習用に転用したという由来によるものです。

##アプリの特徴
以下のような機能を一応のゴールに考えています。  
なおフロントエンドには自身のSpaTemplateを使っています。
###ログ型の小グループチャット機能
グループ毎に同期非同期でログを残せます。  
現在はGAEのChannel APIを使ってメッセージをプッシュしています。
###タスク管理
現状、Golangのサンプルコード"Todo"を多少カスタマイズして動かしています。今後ファイルの添付やドキュメント作成機能を実装する予定です。

##Live Demo
Check a live Demo here <https://todoscast.appspot.com>.    

Tested with only Chrome. However it will work in any modern browser that supports ES6, HTML5, CSS3. 

## Licensing
See [LICENSE](LICENSE)  

[Google I/O 2014 Codelabs](https://io2014codelabs.appspot.com/)

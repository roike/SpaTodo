##Sample App For App Engine With Golang
This is a sample application for Google App Engine with Go.  
Primarily for use my learning Golang, 

自分自身のGo言語学習用のサンプルに開発しています。GAEで動くものなので、可能な限りGAEのAPIを実装していく予定です。当初、Io2014にあったGAE with Golangのサンプルコード"Todo"を自身のGolang学習用に転用しました。オリジナルとは違い、フロントエンドにはAngularに替えて自身の[SpaTemplate](https://github.com/roike/SpaTemplate)を使用しています。

##Features
The following are installed.    

###Offering instant messaging
Real time messaging and archiving for one-to-one and group conversations.  

グループ毎に同期非同期でログを残せます。  
現在はGAEのChannel APIを使ってメッセージをプッシュしています。

###Listings For Todo
Now almost coping Todo app from Google I/O 2014 Codelabs,aside from Angular.js.  
In the neat future, document sharing and knowledge search  are planned to install.

現状、Golangのサンプルコード"Todo"を多少カスタマイズして動かしています。今後ファイルの添付やドキュメント作成検索機能を実装する予定です。

##Live Demo
Check a live Demo here <https://todoscast.appspot.com>.    
You must login with your google account.
Tested with only Chrome. However it will work in any modern browser that supports ES6, HTML5, CSS3. 

##Run Locally And Deploy
See my [SpaTemplate](https://github.com/roike/SpaTemplate) for some infomation.

## Licensing
See [LICENSE](LICENSE)  

[Google I/O 2014 Codelabs](https://io2014codelabs.appspot.com/)

package home

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"path"
	"time"

	"github.com/gorilla/mux"

	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/user"

	_ "google.golang.org/appengine/remote_api"
	rap "todos/utils/wrapper"
	ds "todos/models/chatroom"
)

const (
	defaultName  = "Todos"
	adminMail    = "ryuji.oike@gmail.com"
)

func init() {
	router := mux.NewRouter()
	router = router.StrictSlash(true)
	router.Handle("/", rap.AppHandler(handler)).Methods("GET")
	// Authentication data.
	router.Handle("/auth", rap.AppHandler(authHandler)).Methods("GET")
	router.Handle("/{abcd}", rap.AppHandler(handler)).Methods("GET")
	router.Handle("/{abcd}/{abcd}", rap.AppHandler(handler)).Methods("GET")
	router.Handle("/{abcd}/{abcd}/{abcd}", rap.AppHandler(handler)).Methods("GET")
	http.Handle("/", router)

}

func handler(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	log.Infof(c, "IN Main handler")
	tmpl, err := template.ParseFiles(path.Join("static", "todos.html"))
	if err != nil {
		return err
	}

	return tmpl.Execute(w, nil)
}

func authHandler(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	login, err := user.LoginURL(c, "/")
	if err != nil {
		return err
	}
	logout, err := user.LogoutURL(c, "/")
	if err != nil {
		return err
	}
	//Roomid-->set(todos.key--<default)
	reply := struct{ User, Login, Logout, Roomid string }{
		Login:  login,
		Logout: logout,
	}

	if u := user.Current(c); u != nil {
		reply.User = u.Email
		//Todosのroomkeyを取得
		//無ければdefault chatroomを生成する
		lists, err := ds.GetChatroomAll(c, adminMail)
		if err != nil {
			return fmt.Errorf("GetChatroomAll failed: %v", err)
		} else if len(lists) > 0 {
			reply.Roomid = lists[0].ID
		} else {
			room := &ds.Chatroom{}
			room.Name = defaultName
			room.Owner = adminMail
			room.Date = time.Now()
			// Put the Chatroom in the datastore.
			key, err := room.CreateChatroom(c)
			if err != nil {
				return fmt.Errorf("create room: %v", err)
			}
			reply.Roomid = key.Encode()
		}
		//--Set login user to memcache-------------
		err = ds.MemcacheUser(c)
		if err != nil {
			return fmt.Errorf("Failed to set memcache: %v", err)
		}
	}


	return json.NewEncoder(w).Encode(reply)
}

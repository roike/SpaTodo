package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"html"
	"net/http"
	"html/template"
	"path"
	"time"

	"github.com/gorilla/mux"

	"google.golang.org/appengine"
	"google.golang.org/appengine/channel"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/user"
	"google.golang.org/appengine/memcache"

	rap "todos/utils/wrapper"
	ds "todos/models/chatroom"
)

const (
	defaultName  = "Todos"
)

//----Reqest Handler section---------------------------------
func init() {
	router := mux.NewRouter().PathPrefix("/chat/").Subrouter()
	router = router.StrictSlash(true)
	router.Handle("/token", rap.AuthReq(getToken)).Methods("GET")
	//---chatroom checkin-----------------------------------------------------
	router.Handle("/checkin/{room}", rap.AuthReq(checkIn)).Methods("GET")
	router.Handle("/checkin/cast/{session}", rap.AuthReq(broadCast)).Methods("POST")
	//router.Handle("/session/{session}", rap.AuthReq(getSession)).Methods("GET")
	//---chatroom admin------------------------------------------------------
	router.Handle("/chatmin/roomlist", rap.AuthReq(listChatroom)).Methods("GET")
	router.Handle("/chatmin/create", rap.AuthReq(createRoom)).Methods("POST")
	router.Handle("/chatmin/description/{room}", rap.AuthReq(upDescription)).Methods("POST")
	//member情報の管理、チャットルームの説明など
	router.Handle("/chatmin/info/{room}", rap.AuthReq(getRoomInfo)).Methods("GET")
	router.Handle("/chatmin/stay/{room}", rap.AuthReq(addMember)).Methods("POST")
	//router.Handle("/memberlist/{room}", rap.AuthReq(listMember)).Methods("GET")
	router.Handle("/chatmin/stay", rap.AuthReq(updateStay)).Methods("PATCH")
	//others like junk path
	router.Handle("/", rap.AppHandler(handler)).Methods("GET")

	http.Handle("/chat/", router)

}

func handler(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	log.Infof(c, "IN Chat handler")
	tmpl, err := template.ParseFiles(path.Join("static", "todos.html"))
	if err != nil {
		return err
	}

	return tmpl.Execute(w, nil)
}

//expiration time = two hours:default
func getToken(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	token := make(map[string]string)
	u := user.Current(c)

	tok, err := channel.Create(c, u.Email)
	if err != nil {
		return fmt.Errorf("token not generated: %v", err)
	}
	token["token"] = tok
	return json.NewEncoder(w).Encode(token)
}

//非同期にChatroomのsessionデータをデータベースから回収する
/*
func getSession(w io.Writer, r *http.Request) error {
	//Todo:現在のsessionの前後のsessionを取り出す

	return json.NewEncoder(w).Encode(session)
}
*/

//Chatroom checkin
func checkIn(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)

	//get Chatroom------------------
	roomid := mux.Vars(r)["room"]
	room := &ds.Chatroom{}
	room.ID = roomid
	err := room.GetChatroom(c)
	if err != nil {
		return fmt.Errorf("fetch chatroom Error: %v", err)
	}
	checkin := struct{
		Session *ds.Session
		Owner, Roomname, Description string
		List []*ds.Stay
	} {
		Owner: room.Owner,
		Description: room.Description,
		Roomname: room.Name,
	}

	//get Session-------------------
	session := &ds.Session{}
	err = session.LoadSession(c, room.ID)
	if err != nil {
		return fmt.Errorf("fetch Session Error: %v", err)
	}
	checkin.Session = session
	//get StayAll----------------------------
	//current userのStay先をlistに取り出す
	u := user.Current(c)
	lists, err := ds.GetStayAll(c, u.Email, "", true)
	if err != nil {
		return fmt.Errorf("GetStayAll failed: %v", err)
	}
	if len(lists) == 0 {
		//create Stay----------
		//最初のStay==Todosを登録
		stay := &ds.Stay{}
		stay.Roomname = defaultName
		stay.Roomid = roomid
		stay.Usrmail = u.Email
		stay.Flag = true
		stay.Date = time.Now()
		key, err := stay.CreateStay(c)
		if err != nil {
			return fmt.Errorf("new Stay cteate Error: %v", err)
		}
		stay.ID = key.Encode()
		lists = append(lists, stay)
	}
	checkin.List = lists
	return json.NewEncoder(w).Encode(checkin)
}

//--------------Chatroom admin-----------------
//Chatroom's owner only
func getRoomInfo(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)

	//get Chatroom------------------
	roomid := mux.Vars(r)["room"]
	room := &ds.Chatroom{}
	room.ID = roomid
	err := room.GetChatroom(c)
	if err != nil {
		return fmt.Errorf("fetch chatroom Error: %v", err)
	}
	//case user != owner --> error
	u := user.Current(c)
	if u.Email != room.Owner {
		return rap.AppErrorf(http.StatusForbidden, "for owner's only")
	}
	roomInfo := struct{
		Owner, Roomname, Roomid, CustomEvent, Description string
		List []*ds.Stay
	} {
		Owner: room.Owner,
		Description: room.Description,
		Roomname: room.Name,
		Roomid: roomid,
		CustomEvent: "chatmin-members",
	}

	//get StayAll----------------------------
	//chatroomにStayしているuserのmail先をlistに取り出す
	lists, err := ds.GetStayAll(c, "", roomid, false)
	if err != nil {
		return fmt.Errorf("GetStayAll failed: %v", err)
	}
	roomInfo.List = lists
	return json.NewEncoder(w).Encode(roomInfo)
}

//メンバーの追加
//Chatroom's owner only
func addMember(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	//get Chatroom------------------
	roomid := mux.Vars(r)["room"]
	room := &ds.Chatroom{}
	room.ID = roomid
	err := room.GetChatroom(c)
	if err != nil {
		return fmt.Errorf("fetch chatroom Error: %v", err)
	}
	//case user != owner --> error
	u := user.Current(c)
	if u.Email != room.Owner {
		return rap.AppErrorf(http.StatusForbidden, "for owner's only")
	}
	//メンバーに登録
	stay := &ds.Stay{}
	err = json.NewDecoder(r.Body).Decode(stay)
	if err != nil {
		return fmt.Errorf("decode stay: %v", err)
	}
	stay.Roomname = room.Name
	stay.Roomid = room.ID
	stay.Flag = true
	stay.Date = time.Now()
	key, err := stay.CreateStay(c)
	if err != nil {
		return fmt.Errorf("Create Stay failed: %v", err)
	}
	stay.CustomEvent = "chatmin-members-add"
	stay.ID = key.Encode()
	return json.NewEncoder(w).Encode(stay)
}

//メンバー活動の停止/再開
func updateStay(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	stay := &ds.Stay{}
	err := json.NewDecoder(r.Body).Decode(stay)
	if err != nil {
		return fmt.Errorf("decode stay: %v", err)
	}
	stay.Date = time.Now()
	_, err = stay.SaveStay(c)
	if err != nil {
		return fmt.Errorf("Create Stay failed: %v", err)
	}
	active := struct{
		Id string
		Flag bool
	} {
		Id: stay.ID,
		Flag: stay.Flag,
	}
	return json.NewEncoder(w).Encode(active)
}
//chatの同報通信
//broadcastの後にsessionに登録する
//受信内容{cast.content,cast.roomid}
//cast.Text is escaped,however only five characters
func broadCast(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	u := user.Current(c)
	sessionid := mux.Vars(r)["session"]

	cast := &ds.Cast{}
	err := json.NewDecoder(r.Body).Decode(cast)
	if err != nil {
		return fmt.Errorf("decode cast: %v", err)
	}
	cast.User = u.Email
	cast.Time = time.Now()
	//escapes only five such characters: <, >, &, ' and ". 
	cast.Text = html.EscapeString(cast.Text)
	if err = cast.SaveCast(c, sessionid); err != nil {
		return fmt.Errorf("broadCast Error: %v", err)
	}
	cast.CustomEvent = "chatroom-cast"
	//send message to chatroom member who must login----------
	lists, err := ds.GetStayAll(c, u.Email, "", true)
	if err != nil {
		return fmt.Errorf("GetStayAll failed: %v", err)
	}
	users := make(map[string]time.Time)
	_, err = memcache.JSON.Get(c, "users", &users)
	if err != nil {
		return fmt.Errorf("Failed to get users: %v", err)
	}

	for _, stay := range lists {
		email := stay.Usrmail
		_, has := users[email]
		if has {
			err := channel.SendJSON(c, stay.Usrmail, cast)
			if err != nil {
				return fmt.Errorf("sending Cast: %v", err)
			}
		}
    }
	return json.NewEncoder(w).Encode(cast)
}
//---chatroom---------------------------------------------
func upDescription(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	//get Chatroom------------------
	roomid := mux.Vars(r)["room"]
	room := &ds.Chatroom{}
	room.ID = roomid
	err := room.GetChatroom(c)
	if err != nil {
		return fmt.Errorf("fetch chatroom Error: %v", err)
	}
	//case user != owner --> error
	u := user.Current(c)
	if u.Email != room.Owner {
		return rap.AppErrorf(http.StatusForbidden, "for owner's only")
	}
	err = json.NewDecoder(r.Body).Decode(room)
	if err != nil {
		return fmt.Errorf("decode room: %v", err)
	}
	key, err := room.SaveChatroom(c)
	if err != nil {
		return fmt.Errorf("save Chatroom: %v", err)
	}
	// Update the encoded key and encode the room.
	room.ID = key.Encode()
	room.CustomEvent = "chatmin-description-update"
	return json.NewEncoder(w).Encode(room)
};

//Chatroomの作成
//作成者本人を最初のメンバーに登録する
func createRoom(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	//Chatroomの作成
	room := &ds.Chatroom{}
	err := json.NewDecoder(r.Body).Decode(room)
	if err != nil {
		return fmt.Errorf("decode room: %v", err)
	}
	room.Owner = user.Current(c).Email
	room.Date = time.Now()
	key, err := room.CreateChatroom(c)
	if err != nil {
		return fmt.Errorf("create Chatroom: %v", err)
	}
	// Update the encoded key and encode the room.
	room.ID = key.Encode()
	room.CustomEvent = "chatmin-list-add"

	//メンバーに登録
	u := user.Current(c)
	stay := &ds.Stay{}
	stay.Roomname = room.Name
	stay.Roomid = room.ID
	stay.Usrmail = u.Email
	stay.Flag = true
	stay.Date = time.Now()
	key, err = stay.CreateStay(c)
	if err != nil {
		return fmt.Errorf("Create Stay failed: %v", err)
	}

	return json.NewEncoder(w).Encode(room)
}

//ログイン中のユーザが作成したChatroomのリスト
func listChatroom(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	u := user.Current(c)
	lists, err := ds.GetChatroomAll(c, u.Email)
	if err != nil {
		return fmt.Errorf("GetChatroomAll failed: %v", err)
	}

	return json.NewEncoder(w).Encode(lists)
}

//?--useless
func listMember(w io.Writer, r *http.Request) error {
	c := appengine.NewContext(r)
	roomid := mux.Vars(r)["room"]

	lists, err := ds.GetStayAll(c, "", roomid, true)
	if err != nil {
		return fmt.Errorf("GetStayAll failed: %v", err)
	}

	return json.NewEncoder(w).Encode(lists)
}

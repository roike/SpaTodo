package chatroom

import (
	"fmt"
	"time"

	"google.golang.org/appengine/datastore"
	"google.golang.org/appengine/memcache"
	"google.golang.org/appengine/user"
	"golang.org/x/net/context"
)

const (
	UserKind     = "User"
	SessionKind  = "Session"
	CastKind     = "Cast"
	ChatroomKind = "Chatroom"
	StayKind     = "Stay"
)

//---datastore------------------------------------------------------------
//Sessionの親はChatroom
//参加できるのはChatroomのメンバー
//Todosは全員参加のChatroom
//Session_idはオンラインで発行し投稿に使用する
//Chatroomのメンバーのうちログイン中のメンバーにブロードキャストする
//Casts=[]cast
//Sessionのcache時間は開始して1時間、アクセスごとに更新される
type Session struct {
	ID    string           `datastore:"-" json:"id"`
	Casts []*datastore.Key `datastore:"casts,noindex" json:"casts"`
	Date  time.Time        `datastore:"date" json:"date"`
}

//Castの親はSession
type Cast struct {
	ID          string    `datastore:"-" json:"-"`
	CustomEvent string    `datastore:"-" json:"customeve"`
	Text        string    `datastore:"text,noindex" json:"text"`
	User        string    `datastore:"user,noindex" json:"user"`
	Roomid      string    `datastore:"roomid,noindex" json:"roomid"`
	Time        time.Time `datastore:"time,noindex" json:"time"`
}

//Chatroomの親はOwner
//Owner = user@gmail.com
type Chatroom struct {
	ID          string    `datastore:"-" json:"id"` //not stored in the datastore
	CustomEvent string    `datastore:"-" json:"customeve"`
	Name        string    `datastore:"name,noindex" json:"name"`
	Owner       string    `datastore:"owner" json:"owner"`
	Description string    `datastore:"description,noindex" json:"description"`
	Date        time.Time `datastore:"date" json:"date"`
}

//Userが参加しているChatroomを登録
//招待中/停止中-->Flag=false,参加中-->Flag=true
//Userのchatroom list,owerのchatroom招待,castの送信先に使用
//Dateは該当のchatroomから最後に受信したcastの日付で更新
//上記日付以降でcastが発生していれば新着マークをchatroomにたてる
type Stay struct {
	ID       string    `datastore:"-" json:"id"`
	CustomEvent string    `datastore:"-" json:"customeve"`
	Roomname string    `datastore:"roomname,noindex" json:"roomname"`
	Roomid   string    `datastore:"roomid" json:"roomid"`
	Usrmail  string    `datastore:"usrmail" json:"usrmail"`
	Flag     bool      `datastore:"flag" json:"flag"`
	Date     time.Time `datastore:"date" json:"-"`
}


//---method------------------------------------------------
func GetStayAll(c context.Context, email string, roomid string, flag bool) ([]*Stay, error) {
	//current userのStay先をlistに取り出す
	q := datastore.NewQuery(StayKind)
	if email != "" {
		q = q.Filter("usrmail =", email)
	}
	if roomid != "" {
		q = q.Filter("roomid =", roomid)
	}
	if flag {
		q = q.Filter("flag =", flag)
	}
	q = q.Order("date")
	lists := []*Stay{}
	keys, err := q.GetAll(c, &lists)
	if err == nil {
		for i, k := range keys {
			lists[i].ID = k.Encode()
		}
	}
	return lists, err
}
func (s *Stay) CreateStay(c context.Context) (*datastore.Key, error) {
	key := datastore.NewIncompleteKey(c, StayKind, nil)
	return datastore.Put(c, key, s)
}
func (s *Stay) GetStay(c context.Context) error {
	key, err := datastore.DecodeKey(s.ID)
	if err != nil {
		return fmt.Errorf("datastore decodekey: %v", err)
	}
	return datastore.Get(c, key, s)
}
func (s *Stay) SaveStay(c context.Context) (*datastore.Key, error) {
	key, err := datastore.DecodeKey(s.ID)
	if err != nil {
		return nil, fmt.Errorf("datastore decodekey: %v", err)
	}
	return datastore.Put(c, key, s)
}

func (r *Chatroom) GetChatroom(c context.Context) error {
	roomkey, err := datastore.DecodeKey(r.ID)
	if err != nil {
		return fmt.Errorf("datastore decodekey: %v", err)
	}
	return datastore.Get(c, roomkey, r)
}
func GetChatroomAll(c context.Context, email string) ([]*Chatroom, error) {
	query := datastore.NewQuery(ChatroomKind).
		Filter("owner =", email).
		Order("date")
	lists := []*Chatroom{}
	keys, err := query.GetAll(c, &lists)
	if err == nil {
		for i, k := range keys {
			lists[i].ID = k.Encode()
		}
	}
	return lists, err
}
func (r *Chatroom) CreateChatroom(c context.Context) (*datastore.Key, error) {
	userKey := datastore.NewKey(c, UserKind, r.Owner, 0, nil)
	key := datastore.NewIncompleteKey(c, ChatroomKind, userKey)
	return datastore.Put(c, key, r)
}
func (r *Chatroom) SaveChatroom(c context.Context) (*datastore.Key, error) {
	key, err := datastore.DecodeKey(r.ID)
	if err != nil {
		return nil, fmt.Errorf("datastore decodekey: %v", err)
	}
	return datastore.Put(c, key, r)
}

//sessionはmemcacheから取り出す、ない場合は新規生成する
func (s *Session) LoadSession(c context.Context, roomid string) error {
	roomkey, err := datastore.DecodeKey(roomid)
	if err != nil {
		return fmt.Errorf("decode roomid error: %v", err)
	}
	memkey := roomkey.String()
	item, err := memcache.Get(c, memkey)

	if err == nil {
		sessionid := string(item.Value)
		sessionkey, err := datastore.DecodeKey(sessionid)
		if err != nil {
			return fmt.Errorf("decode sessionid error: %v", err)
		}
		if err = datastore.Get(c, sessionkey, s); err != nil {
			return fmt.Errorf("Get Session error: %v", err)
		}
		s.ID = sessionid
	} else if err == memcache.ErrCacheMiss {
		//新規にsessionを生成
		s.Date = time.Now()
		key := datastore.NewIncompleteKey(c, SessionKind, roomkey)
		key, err = datastore.Put(c, key, s)
		if err != nil {
			return fmt.Errorf("session save Error: %v", err)
		}
		s.ID = key.Encode()
		item = &memcache.Item{
			Key:        memkey,
			Value:      []byte(s.ID),
			Expiration: time.Second * 3600, //1時間
		}
	} else {
		return fmt.Errorf("memcache.item.Value fetct Error: %v", err)
	}
	//期間の更新---todo:tasqQueueでシングルトンで実装
	if err = memcache.Set(c, item); err != nil {
		return fmt.Errorf("memcache set item Error: %v", err)
	}
	return nil
}

func (cs *Cast) SaveCast(c context.Context, sessionid string) error {
	sessionkey, err := datastore.DecodeKey(sessionid)
	if err != nil {
		return fmt.Errorf("decode sessionid error: %v", err)
	}
	cs.Roomid = sessionkey.Parent().Encode()
	key := datastore.NewIncompleteKey(c, CastKind, sessionkey)
	castkey, err := datastore.Put(c, key, cs)
	if err != nil {
		return fmt.Errorf("Save Cast error:: %v", err)
	}

	//SessionにCastの追加
	err = datastore.RunInTransaction(c, func(c context.Context) error {

		session := &Session{}
		err = datastore.Get(c, sessionkey, session)
		if err != nil {
			return err
		}
		session.Casts = append(session.Casts, castkey)
		_, err = datastore.Put(c, sessionkey, session)
		return err
	}, nil)
	if err != nil {
		return fmt.Errorf("Save Session error: %v", err)
	}
	return nil

}

//--Set login user to memcache-------------
func MemcacheUser(c context.Context) error {
	u := user.Current(c)
	users := make(map[string]time.Time)
	_, err := memcache.JSON.Get(c, "users", &users)
	if err != nil && err != memcache.ErrCacheMiss {
		return fmt.Errorf("error getting users: %v", err)
	}
	users[u.Email] = time.Now()
	item := &memcache.Item{
		Key:        "users",
		Object:      users,
		Expiration: time.Second * 3600, //1時間
	}
	if err = memcache.JSON.Set(c, item); err != nil {
		return fmt.Errorf("error setting users: %v", err)
	}
	return nil
}

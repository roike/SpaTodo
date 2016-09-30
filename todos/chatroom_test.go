package chatroom

import (
	"testing"
	"time"

	"google.golang.org/appengine/aetest"
)

const (
	defaultName  = "Todos"
	adminMail    = "ryuji.oike@gmail.com"
)

func TestChatroom(t *testing.T) {
	//t.Skip("skipping TestGetToken.")

	c, done, err := aetest.NewContext()
	if err != nil {
		t.Fatal("Failed to create Context: %v", err)
	}
	defer done()

	//test CreateChatroom----------------------------
	room := &Chatroom{}
	room.Name = defaultName
	room.Owner = adminMail
	room.Date = time.Now()
	key, err := room.CreateChatroom(c)
	if err != nil {
		t.Errorf("Create Chatroom failed: %v", err)
	}
	room.ID = key.Encode()
	t.Logf("new Chatroom is %v", room)

	//test GetChatroom--------------------------
	room2 := &Chatroom{}
	room2.ID = room.ID
	err = room2.GetChatroom(c)

	if err != nil {
		t.Errorf("Get Chatroom failed: %v", err)
	}
	t.Logf("get room is %v", room2)

	//test GetChatroomAll-----------------
	lists, err := GetChatroomAll(c, adminMail)
	if err != nil {
		t.Errorf("GetChatroomAll failed: %v", err)
	}
	t.Logf("Your Chatroom List is %d", len(lists))

	//test CreateStay-----------------------
	stay := &Stay{}
	stay.Roomname = defaultName
	stay.Roomid = room.ID
	stay.Usrmail = adminMail
	stay.Flag = true
	stay.Date = time.Now()
	key, err = stay.CreateStay(c)
	if err != nil {
		t.Errorf("Create Stay failed: %v", err)
	}
	t.Logf("new Stay Key is %v", key.String())

	//test GetStayAll-----------------------
	//参加者のリスト
	lists2, err := GetStayAll(c, adminMail, "", true)
	if err != nil {
		t.Errorf("GetStayAll failed: %v", err)
	}
	t.Logf("StayList is %d", len(lists2))
	//memberのリスト
	lists2, err = GetStayAll(c, "", room.ID, true)
	if err != nil {
		t.Errorf("GetStayAll failed: %v", err)
	}
	t.Logf("StayList is %d", len(lists2))
	//test LoadSession--------------------------
	session := &Session{}
	err = session.LoadSession(c, room.ID)
	if err != nil {
		t.Errorf("Load Session failed: %v", err)
	}
	t.Logf("Load Session is %v", session)

	//test SaveCast-----------------------
	cast := &Cast{}
	cast.Text = "Hellow Test"
	cast.User = adminMail
	cast.Time = time.Now()
	err = cast.SaveCast(c, session.ID)
	if err != nil {
		t.Errorf("Save Cast failed: %v", err)
	}
	err = session.LoadSession(c, room.ID)
	if err != nil {
		t.Errorf("Load Session failed: %v", err)
	}
	t.Logf("Load Session after save Cast is %v", session)
}

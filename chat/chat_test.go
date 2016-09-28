package chat

import (
	"encoding/json"
	"net/http/httptest"
	"testing"
	"bytes"
	"time"

	"google.golang.org/appengine/user"
    "google.golang.org/appengine/aetest"
	"google.golang.org/appengine/datastore"

	ds "todos/models/chatroom"
)

const (
	adminMail    = "ryuji.oike@gmail.com"
)
//エラー発生以外で情報を出力する場合は-->
//goapp test -v ./chatでtestを起動する

func TestCreateRoom(t *testing.T) {
	//t.Skip("skipping TestGetToken.")

	inst, err := aetest.NewInstance(nil)
	if err != nil {
		t.Fatalf("Failed to create instance: %v", err)
	}
	defer inst.Close()

	params := `{"name": "testroom"}`
	req, err := inst.NewRequest("POST", "/create", bytes.NewBufferString(params) )
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	//-------login-------------------
	var u user.User
    u.Email = adminMail
    u.ID = "1000"
    aetest.Login(&u,req)
	//------------------------------
	w := httptest.NewRecorder()

	//---------save chatRoom-----------------
	if err = createRoom(w, req); err != nil {
		t.Errorf("Failed create room. Error is %v", err)
	}
	if w.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", w.Code, 200, w.Body.String())
	}
	room := &ds.Chatroom{}
	err = json.NewDecoder(w.Body).Decode(room)
	if err != nil {
		t.Errorf("Response not Json format: %v", err)
	}
	t.Logf("new room is %v", room)
}

func TestGetToken(t *testing.T) {
	//now := time.Now()
	//t.Skip("skipping TestGetToken.")

	inst, err := aetest.NewInstance(nil)
	if err != nil {
		t.Fatalf("Failed to create instance: %v", err)
	}
	defer inst.Close()

	req, err := inst.NewRequest("GET", "/token", nil)
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}
	//-------login------------------
	var u user.User
    u.Email = "test@example.com"
    u.ID = "1"
    aetest.Login(&u,req)
	//------------------------------
	w := httptest.NewRecorder()
	//---------getToken----------
	if err = getToken(w, req); err != nil {
		t.Errorf("token not generated: %v", err)
	}
	if w.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", w.Code, 200, w.Body.String())
	}
	//reply := new(struct{ token string })
	reply := make(map[string]string)
	err = json.NewDecoder(w.Body).Decode(&reply)
	if err != nil {
		t.Errorf("Response not Json format: %v", err)
	}

	if reply["token"] == "00000" {
		t.Errorf("Current user is nil. Token is %s", reply["token"])
	}
	t.Logf("getToken is Passed.")
}

func TestCheckin(t *testing.T) {
	//t.Skip("skipping TestCheckin.")

	inst, err := aetest.NewInstance(nil)
	if err != nil {
		t.Fatalf("Failed to create instance: %v", err)
	}
	defer inst.Close()
	c, done, err := aetest.NewContext()
    if err != nil {
        t.Fatal("Failed to create Context: %v", err)
    }
    defer done()

	//---Preparation-Todosの作成-------------------------
	room := &ds.Chatroom{}
	adminKey := datastore.NewKey(c, ds.UserKind, adminMail, 0, nil)
	key := datastore.NewIncompleteKey(c, ds.ChatroomKind, adminKey)
	room.Name = defaultName
	room.Owner = adminMail
	room.Date = time.Now()
	// Put the Chatroom in the datastore.
	key, err = datastore.Put(c, key, room)
	if err != nil {
		t.Errorf("create room: %v", err)
	}
	//---End Preparation--------------------------------
	//urlが通らなくて失敗する Why?
	path := "/checkin/" + key.Encode()
	t.Logf("url is %s", path)
	req, err := inst.NewRequest("GET", path, nil)
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}
	//-------login-------------------
	var u user.User
    u.Email = "test@example.com"
    u.ID = "1"
    aetest.Login(&u,req)
	//------------------------------
	w := httptest.NewRecorder()
	//---------check in chatRoom-----------------
	if err = checkIn(w, req); err != nil {
		t.Errorf("Failed checkin. Error is %v", err)
	}
	if w.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", w.Code, 200, w.Body.String())
	}
	checkin := struct{
		Session *ds.Session
		Owner, Roomname, Description string
		List []*ds.Stay
	} {}
	err = json.NewDecoder(w.Body).Decode(&checkin)
	if err != nil {
		t.Errorf("Response not Json format: %v", err)
	}
	t.Logf("new session is %v", checkin)
    //------------タスクを登録する-------------

}

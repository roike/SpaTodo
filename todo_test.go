package todo

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"appengine/aetest"
)

//エラー発生以外で情報を出力する場合は-->
//goapp test -vでtestを起動する

func TestFunction(t *testing.T) {
	//now := time.Now()
	inst, err := aetest.NewInstance(nil)
	if err != nil {
		t.Fatalf("Failed to create instance: %v", err)
	}
	defer inst.Close()

	//---------Authentication----------
	reqAuth, err := inst.NewRequest("GET", "/auth", nil)
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}

	resp := httptest.NewRecorder()
	authHandler(resp, reqAuth)
	if resp.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", resp.Code, 200, resp.Body.String())
	}
	reply := new(struct{ User, Login, Logout string })
	err = json.NewDecoder(resp.Body).Decode(reply)
	if err != nil {
		t.Errorf("Response not Json format: %v", err)
	}

	t.Logf("Login url is %s", reply.Login)

	//---------全リストを取り出す-----------------
	reqAllList, err := inst.NewRequest("GET", "/list", nil)
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}

	resp = httptest.NewRecorder()
	getAllLists(resp, reqAllList)
	if resp.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", resp.Code, 200, resp.Body.String())
	}
	t.Logf("List all are %s", resp.Body.String())

    //------------タスクを登録する-------------
}

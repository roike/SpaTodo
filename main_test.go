package home

import (
	"encoding/json"
	"net/http/httptest"
	"testing"

	"google.golang.org/appengine/user"
    "google.golang.org/appengine/aetest"
)

func TestAuthHandler(t *testing.T) {
	//t.Skip("skipping TestGetToken.")
	inst, err := aetest.NewInstance(nil)
	if err != nil {
		t.Fatalf("Failed to create instance: %v", err)
	}
	defer inst.Close()
	req, err := inst.NewRequest("GET", "/", nil)
	if err != nil {
		t.Errorf("inst.NewRequest failed: %v", err)
	}
	//-------login-------------------
	var u user.User
    u.Email = adminMail
    u.ID = "1000"
    aetest.Login(&u,req)
	//------------------------------
	w := httptest.NewRecorder()
	//------authHandler-----------
	if err = authHandler(w, req); err != nil {
		t.Errorf("Failed Authentication Error is %v", err)
	}
	if w.Code != 200 {
		t.Errorf("Got response code %d; want %d; body:\n%s", w.Code, 200, w.Body.String())
	}
	reply := struct{ User, Login, Logout, Roomid string }{}
	err = json.NewDecoder(w.Body).Decode(&reply)
	if err != nil {
		t.Errorf("Response not Json format: %v", err)
	}
	t.Logf("Authentication is %v", reply)
}

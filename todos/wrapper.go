package wrapper

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	"google.golang.org/appengine"
	"google.golang.org/appengine/log"
	"google.golang.org/appengine/user"
)

// appError is an error with a HTTP response code.
type appError struct {
	error
	Code int
}

// appErrorf creates a new appError given a reponse code and a message.
func AppErrorf(code int, format string, args ...interface{}) *appError {
	return &appError{fmt.Errorf(format, args...), code}
}

// appHandler handles HTTP requests and manages returned errors.
type AppHandler func(w io.Writer, r *http.Request) error

// appHandler implements http.Handler.
func (h AppHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	buf := &bytes.Buffer{}
	err := h(buf, r)
	if err == nil {
		io.Copy(w, buf)
		return
	}
	code := http.StatusInternalServerError
	logf := log.Errorf
	if err, ok := err.(*appError); ok {
		code = err.Code
		logf = log.Infof
	}

	w.WriteHeader(code)
	logf(c, err.Error())
	fmt.Fprint(w, err)
}

// authReq checks that a user is logged in before executing the appHandler.
type AuthReq AppHandler

// authReq implements http.Handler.
func (h AuthReq) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	c := appengine.NewContext(r)
	if user.Current(c) == nil {
		http.Error(w, "login required", http.StatusForbidden)
		return
	}
	AppHandler(h).ServeHTTP(w, r)
}

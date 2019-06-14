package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"

	"github.com/dparrish/go-autoconfig"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"
	log "github.com/sirupsen/logrus"
)

type Map struct {
	gorm.Model
	Name string `gorm:"unique;not null;INDEX"`
	JSON []byte `gorm:"type:MEDIUMBLOB"`
}

var (
	configFile = flag.String("config", "config.yaml", "Path to configuration file")

	db     *gorm.DB
	config *autoconfig.Config
)

func apiOK(d map[string]interface{}) map[string]interface{} {
	if d == nil {
		d = map[string]interface{}{}
	}
	d["status"] = "OK"
	return d
}

func apiError(err error) map[string]interface{} {
	return map[string]interface{}{
		"status": "error",
		"error":  err.Error(),
	}
}

func jsonResponse(w http.ResponseWriter, j interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, HEAD")
	w.Header().Set("Vary", "Origin")
	json, _ := json.MarshalIndent(j, "", "  ")
	w.Write(json)
}

func listMaps(ctx context.Context, log *log.Entry, w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, HEAD")
		w.Header().Set("Vary", "Origin")
		w.WriteHeader(http.StatusOK)
		return
	}

	var mapNames []string
	db.Table("maps").Pluck("name", &mapNames)
	jsonResponse(w, apiOK(map[string]interface{}{
		"maps": mapNames,
	}))
}

func readMap(ctx context.Context, log *log.Entry, w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, HEAD")
		w.Header().Set("Vary", "Origin")
		w.WriteHeader(http.StatusOK)
		return
	}

	vars := mux.Vars(r)
	var row Map
	db.First(&row, "name = ?", vars["name"])
	if row.Name == "" {
		jsonResponse(w, apiError(fmt.Errorf("map %s not found", vars["name"])))
		return
	}

	jsonResponse(w, apiOK(map[string]interface{}{
		"map": string(row.JSON),
	}))
}

func deleteMap(ctx context.Context, log *log.Entry, w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, HEAD")
		w.Header().Set("Vary", "Origin")
		w.WriteHeader(http.StatusOK)
		return
	}

	vars := mux.Vars(r)
	row := Map{Name: vars["name"]}
	db.Debug().Delete(&row)
	jsonResponse(w, apiOK(map[string]interface{}{}))
}

func writeMap(ctx context.Context, log *log.Entry, w http.ResponseWriter, r *http.Request) {
	if r.Method == "OPTIONS" {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, PUT, OPTIONS, HEAD")
		w.Header().Set("Vary", "Origin")
		w.WriteHeader(http.StatusOK)
		return
	}

	vars := mux.Vars(r)
	log.Printf("Write map %s", vars["name"])

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading PUT body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		jsonResponse(w, apiError(fmt.Errorf("Error reading PUT body: %v", err)))
		return
	}

	fields := make(map[string]interface{})
	if err := json.Unmarshal(body, &fields); err != nil {
		log.Printf("Error parsing PUT body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		jsonResponse(w, apiError(fmt.Errorf("Error parsing PUT body: %v", err)))
		return
	}

	if vars["name"] != fields["name"] {
		w.WriteHeader(http.StatusBadRequest)
		jsonResponse(w, apiError(fmt.Errorf("invalid map name")))
		return
	}

	var row Map
	db.First(&row, "name = ?", vars["name"])
	if row.Name == "" {
		log.Infof("Creating new map %s: %v", vars["name"], err)
		db.Create(&Map{
			Name: vars["name"],
			JSON: body,
		})
	} else {
		log.Infof("Updating map %s", vars["name"])
		row.JSON = body
		db.Save(&row)
	}

	jsonResponse(w, apiOK(map[string]interface{}{
		"maps": []string{"new-map-1"},
	}))
}

func logRequest(f func(context.Context, *log.Entry, http.ResponseWriter, *http.Request)) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		fields := log.Fields{
			"method": r.Method,
			"url":    r.URL.Path,
		}
		for k, v := range r.Header {
			if k == "Cookie" {
				continue
			}
			fields[fmt.Sprintf("header.%s", k)] = v
		}
		l := log.WithFields(fields)
		l.Info("Starting request")
		st := time.Now()
		f(ctx, l, w, r)
		l.WithFields(log.Fields{
			"duration": time.Since(st).String(),
		}).Info("Finished request")
	}
}

func main() {
	flag.Parse()
	log.SetReportCaller(true)

	config := autoconfig.New(*configFile)
	config.Default("cors_allow_origin", "*")
	config.Required("mysql.username")
	config.Required("mysql.password")
	config.Required("mysql.host")
	config.Required("mysql.database")
	config.Immutable("mysql.username")
	config.Immutable("mysql.password")
	config.Immutable("mysql.host")
	config.Immutable("mysql.database")

	if err := config.Load(); err != nil {
		log.Fatal(err)
	}
	if err := config.Watch(context.Background()); err != nil {
		log.Fatal(err)
	}

	dbUri := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8&parseTime=True", config.Get("mysql.username"), config.Get("mysql.password"), config.Get("mysql.host"), config.Get("mysql.database"))

	var err error
	db, err = gorm.Open("mysql", dbUri)
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}
	db.AutoMigrate(&Map{})

	router := mux.NewRouter()
	router.HandleFunc("/api/v1/maps", logRequest(listMaps)).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/v1/map/{name}", logRequest(writeMap)).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/v1/map/{name}", logRequest(readMap)).Methods("GET", "OPTIONS")
	router.HandleFunc("/api/v1/map/{name}", logRequest(deleteMap)).Methods("DELETE", "OPTIONS")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Listening on %s", port)
	if err := http.ListenAndServe(":"+port, router); err != nil {
		log.Fatal(err)
	}
}

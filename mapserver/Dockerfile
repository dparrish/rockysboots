FROM golang:1.12 as builder

WORKDIR /go/src
ENV GO111MODULE=on
RUN go get github.com/dparrish/go-autoconfig github.com/gorilla/mux github.com/jinzhu/gorm github.com/kr/pretty github.com/sirupsen/logrus github.com/stretchr/testify
COPY *.go go.mod go.sum ./
RUN go get .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo
RUN strip mapserver

FROM phusion/baseimage:latest
ENV GOOGLE_APPLICATION_CREDENTIALS=/tmp/credentials.json
COPY --from=builder /go/src/mapserver /app/
CMD ["/app/mapserver"]

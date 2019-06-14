all: html/wasm_exec.js html/rockysboots.wasm

html/rockysboots.wasm: *.go **/*.go
	GOOS=js GOARCH=wasm go build -o $@ github.com/dparrish/rockysboots

html/wasm_exec.js:
	cp `go env GOROOT`/misc/wasm/wasm_exec.js html/wasm_exec.js 

serve:
	docker run --rm -p 8080:8043 -v `pwd`/src:/srv/http pierrezemb/gostatic:latest

test:
	go test github.com/dparrish/rockysboots/map

"""Loopback-only preview of the generated package and its header profile."""
from pathlib import Path
from http.server import BaseHTTPRequestHandler,HTTPServer
from urllib.parse import urlsplit,unquote
import argparse,mimetypes

def serve(root,port):
    site=root.resolve()
    headers={}
    for line in (site/'_headers').read_text().splitlines():
        if line.startswith('  ') and ':' in line:
            k,v=line.strip().split(':',1);headers[k]=v.strip()
    allowed={p.name for p in site.iterdir() if p.is_file() and not p.name.startswith(('_','.'))}
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self): self.respond(False)
        def do_HEAD(self): self.respond(True)
        def respond(self,head):
            path=unquote(urlsplit(self.path).path)
            if path=='/index.html':
                self.send_response(301);self.send_header('Location','/')
                for k,v in headers.items():self.send_header(k,v)
                self.end_headers();return
            name='index.html' if path=='/' else path.removeprefix('/')
            code=200 if name in allowed else 404
            if code==404:name='404.html'
            data=(site/name).read_bytes();self.send_response(code)
            self.send_header('Content-Type',mimetypes.guess_type(name)[0] or 'application/octet-stream')
            self.send_header('Content-Length',str(len(data)))
            for k,v in headers.items():self.send_header(k,v)
            self.end_headers()
            if not head:self.wfile.write(data)
        def log_message(self,*args):pass
    HTTPServer(('127.0.0.1',port),Handler).serve_forever()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--site',type=Path,required=True);p.add_argument('--port',type=int,default=8782);a=p.parse_args();serve(a.site,a.port)

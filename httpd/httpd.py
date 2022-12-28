import ssl

from absl import app, flags
from absl.flags import FLAGS
from http.server import HTTPServer, SimpleHTTPRequestHandler

flags.DEFINE_integer('port', 443, '')
flags.DEFINE_string('host', '', '')
flags.DEFINE_string('key', '', '')
flags.DEFINE_string('cert', '', '')
flags.DEFINE_string('directory', '.', '')

class HttpRequestHandler(SimpleHTTPRequestHandler):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=FLAGS.directory, **kwargs)

def main(_):
  httpd = HTTPServer((FLAGS.host, FLAGS.port), HttpRequestHandler)
  httpd.socket = ssl.wrap_socket(
    httpd.socket,
    keyfile=FLAGS.key,
    certfile=FLAGS.cert,
    server_side=True)
  httpd.serve_forever()

if __name__ == '__main__':
  app.run(main)

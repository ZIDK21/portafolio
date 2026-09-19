import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const baseIndex = process.argv.indexOf('--base');
let base = baseIndex >= 0 ? process.argv[baseIndex + 1] : '/';
if (!base.startsWith('/')) base = `/${base}`;
if (!base.endsWith('/')) base += '/';
const port = Number(process.env.PORT || 4173);
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'], ['.jpg', 'image/jpeg'], ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'], ['.woff2', 'font/woff2'],
  ['.pdf', 'application/pdf'], ['.txt', 'text/plain; charset=utf-8']
]);

function send(response, status, body) {
  response.writeHead(status, {'content-type': 'text/plain; charset=utf-8'});
  response.end(body);
}

function redirect(response, location) {
  response.writeHead(308, { location });
  response.end();
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { return send(response, 400, 'Bad request'); }
    if (base !== '/' && pathname === base.slice(0, -1)) return redirect(response, `${base}${url.search}`);
    if (!pathname.startsWith(base)) return send(response, 404, 'Not found');
    const relative = pathname.slice(base.length).replaceAll('/', sep);
    if (relative.split(sep).includes('..')) return send(response, 403, 'Forbidden');
    let target = resolve(root, normalize(relative || '.'));
    if (target !== root && !target.startsWith(`${root}${sep}`)) return send(response, 403, 'Forbidden');
    let info;
    try { info = await stat(target); } catch { return send(response, 404, 'Not found'); }
    if (info.isDirectory() && !pathname.endsWith('/')) return redirect(response, `${pathname}/${url.search}`);
    if (info.isDirectory()) target = join(target, 'index.html');
    try { info = await stat(target); } catch { return send(response, 404, 'Not found'); }
    if (!info.isFile()) return send(response, 404, 'Not found');
    response.writeHead(200, {'content-type': mime.get(extname(target).toLowerCase()) || 'application/octet-stream'});
    createReadStream(target).pipe(response);
  } catch (error) {
    send(response, 500, 'Internal server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${base}`);
});

export type SandboxEvent = {
  seq: number;
  t: number;
  type:
    | "line"
    | "stack-push"
    | "stack-pop"
    | "microtask-enqueue"
    | "microtask-run"
    | "microtask-end"
    | "macrotask-enqueue"
    | "macrotask-run"
    | "macrotask-end"
    | "console"
    | "error"
    | "heap"
    | "complete";
  name?: string;
  line?: number;
  id?: number;
  label?: string;
  level?: "log" | "info" | "warn" | "error" | "debug";
  text?: string;
  used?: number;
  total?: number;
  limit?: number;
  suspended?: boolean;
};

const RUNTIME = `
(function () {
  var seq = 0, runId = null, taskId = 0, pending = 0, syncDone = false, completed = false;
  var stack = [];
  var rawThen = Promise.prototype.then;
  var rawST = window.setTimeout.bind(window);
  var rawCT = window.clearTimeout.bind(window);
  var rawSI = window.setInterval.bind(window);
  var rawConsole = { log: console.log.bind(console) };

  function emit(type, data) {
    var e = { seq: seq++, t: Math.round(performance.now() * 1000) / 1000, type: type };
    if (data) { for (var k in data) e[k] = data[k]; }
    parent.postMessage({ __jsSandbox: true, runId: runId, event: e }, '*');
  }

  function fmt(v, depth) {
    depth = depth || 0;
    try {
      if (v === null) return 'null';
      var t = typeof v;
      if (t === 'undefined') return 'undefined';
      if (t === 'string') return depth ? JSON.stringify(v) : v;
      if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
      if (t === 'symbol') return v.toString();
      if (t === 'function') return (v.name ? 'f ' + v.name : 'f anonymous') + '()';
      if (v instanceof Error) return (v.name || 'Error') + ': ' + v.message;
      if (v instanceof Promise) return 'Promise { <pending or settled> }';
      if (v instanceof Map) return 'Map(' + v.size + ')';
      if (v instanceof Set) return 'Set(' + v.size + ')';
      if (depth > 2) return Array.isArray(v) ? '[...]' : '{...}';
      if (Array.isArray(v)) {
        var head = v.slice(0, 20).map(function (x) { return fmt(x, depth + 1); });
        return '[' + head.join(', ') + (v.length > 20 ? ', ...' : '') + ']';
      }
      var keys = Object.keys(v);
      var shown = keys.slice(0, 20).map(function (k) { return k + ': ' + fmt(v[k], depth + 1); });
      return '{ ' + shown.join(', ') + (keys.length > 20 ? ', ...' : '') + ' }';
    } catch (e) { return String(v); }
  }

  function sampleHeap() {
    var m = performance.memory;
    if (m && m.usedJSHeapSize) {
      emit('heap', { used: m.usedJSHeapSize, total: m.totalJSHeapSize, limit: m.jsHeapSizeLimit });
    }
  }

  function maybeComplete() {
    if (completed || !syncDone || pending > 0) return;
    rawST(function () {
      if (completed || !syncDone || pending > 0) return;
      completed = true;
      sampleHeap();
      emit('complete', {});
    }, 0);
  }

  ['log', 'info', 'warn', 'error', 'debug'].forEach(function (level) {
    console[level] = function () {
      var args = Array.prototype.slice.call(arguments);
      emit('console', { level: level, text: args.map(function (a) { return fmt(a, 0); }).join(' ') });
    };
  });

  function scheduleMacrotask(fn, delay, label, frameName, extra) {
    var id = ++taskId;
    pending++;
    emit('macrotask-enqueue', { id: id, label: label });
    return rawST(function () {
      emit('macrotask-run', { id: id });
      stack.push(frameName);
      emit('stack-push', { name: frameName });
      try {
        fn.apply(null, extra || []);
      } catch (err) {
        emit('error', { text: 'Uncaught ' + (err && err.name ? err.name : 'Error') + ': ' + (err && err.message) });
      } finally {
        stack.pop();
        emit('stack-pop', {});
        emit('macrotask-end', { id: id });
        pending--;
        maybeComplete();
      }
    }, delay);
  }

  window.setTimeout = function (fn, ms) {
    var extra = Array.prototype.slice.call(arguments, 2);
    var delay = ms || 0;
    var run = typeof fn === 'function' ? fn : function () { (0, eval)(String(fn)); };
    return scheduleMacrotask(run, delay, 'setTimeout ' + delay + 'ms', 'setTimeout callback', extra);
  };

  window.clearTimeout = rawCT;


  var intervalTicks = 0;
  window.setInterval = function (fn, ms) {
    var delay = ms || 0;
    var handle = rawSI(function () {
      var id = ++taskId;
      intervalTicks++;
      emit('macrotask-enqueue', { id: id, label: 'setInterval ' + delay + 'ms' });
      emit('macrotask-run', { id: id });
      stack.push('setInterval callback');
      emit('stack-push', { name: 'setInterval callback' });
      try { if (typeof fn === 'function') fn(); }
      catch (err) { emit('error', { text: 'Uncaught ' + (err && err.name) + ': ' + (err && err.message) }); }
      finally {
        stack.pop();
        emit('stack-pop', {});
        emit('macrotask-end', { id: id });
      }
      if (intervalTicks > 200) clearInterval(handle);
    }, delay);
    return handle;
  };

  window.queueMicrotask = function (fn) {
    var id = ++taskId;
    pending++;
    emit('microtask-enqueue', { id: id, label: 'queueMicrotask' });
    rawThen.call(Promise.resolve(), function () {
      emit('microtask-run', { id: id });
      stack.push('queueMicrotask callback');
      emit('stack-push', { name: 'queueMicrotask callback' });
      try { fn(); }
      catch (err) { emit('error', { text: 'Uncaught ' + (err && err.name) + ': ' + (err && err.message) }); }
      finally {
        stack.pop();
        emit('stack-pop', {});
        emit('microtask-end', { id: id });
        pending--;
        maybeComplete();
      }
    });
  };

  function wrapReaction(id, handler, label, isReject) {
    return function (value) {
      emit('microtask-run', { id: id });
      stack.push(label);
      emit('stack-push', { name: label });
      try {
        if (typeof handler === 'function') return handler(value);
        if (isReject) throw value;
        return value;
      } finally {
        stack.pop();
        emit('stack-pop', {});
        emit('microtask-end', { id: id });
        pending--;
        maybeComplete();
      }
    };
  }

  Promise.prototype.then = function (onFulfilled, onRejected) {
    if (typeof onFulfilled !== 'function' && typeof onRejected !== 'function') {
      return rawThen.call(this, onFulfilled, onRejected);
    }
    var id = ++taskId;
    pending++;
    var tagged = rawThen.call(
      this,
      function (v) { emit('microtask-enqueue', { id: id, label: '.then reaction' }); return v; },
      function (e) { emit('microtask-enqueue', { id: id, label: '.catch reaction' }); throw e; }
    );
    return rawThen.call(
      tagged,
      wrapReaction(id, onFulfilled, '.then callback', false),
      wrapReaction(id, onRejected, '.catch callback', true)
    );
  };

  // --- Promise combinators -------------------------------------------------
  // Implemented on top of the *raw* then so a single logical settlement shows
  // up as one labelled microtask instead of N anonymous ".then reaction"s.
  function combinator(name, iterable, mode) {
    var items;
    try { items = Array.prototype.slice.call(iterable); }
    catch (e) { return Promise.reject(new TypeError(String(iterable) + ' is not iterable')); }

    var id = ++taskId;
    pending++;
    var settled = false;
    var results = new Array(items.length);
    var remaining = items.length;
    var resolveOuter, rejectOuter;
    var outer = new Promise(function (res, rej) { resolveOuter = res; rejectOuter = rej; });

    function finish(reject, value, verb) {
      if (settled) return;
      settled = true;
      var label = 'Promise.' + name + ' ' + verb + ' (' + items.length + ')';
      emit('microtask-enqueue', { id: id, label: label });
      emit('microtask-run', { id: id, label: label });

      if (reject) rejectOuter(value); else resolveOuter(value);
      emit('microtask-end', { id: id });
      pending--;
      maybeComplete();
    }

    if (items.length === 0) {
      if (mode === 'all' || mode === 'allSettled') finish(false, [], 'settled');
      else if (mode === 'any') finish(true, new AggregateError([], 'All promises were rejected'), 'rejected');
      else { pending--; } // race([]) stays pending forever, like the real thing
      return outer;
    }

    items.forEach(function (item, i) {
      rawThen.call(
        Promise.resolve(item),
        function (v) {
          if (mode === 'race' || mode === 'any') return finish(false, v, 'settled');
          results[i] = mode === 'allSettled' ? { status: 'fulfilled', value: v } : v;
          if (--remaining === 0) finish(false, results, 'settled');
        },
        function (e) {
          if (mode === 'all' || mode === 'race') return finish(true, e, 'rejected');
          if (mode === 'allSettled') {
            results[i] = { status: 'rejected', reason: e };
            if (--remaining === 0) finish(false, results, 'settled');
            return;
          }
          results[i] = e; // any
          if (--remaining === 0) finish(true, new AggregateError(results, 'All promises were rejected'), 'rejected');
        }
      );
    });

    return outer;
  }

  Promise.all = function (it) { return combinator('all', it, 'all'); };
  Promise.race = function (it) { return combinator('race', it, 'race'); };
  Promise.allSettled = function (it) { return combinator('allSettled', it, 'allSettled'); };
  Promise.any = function (it) { return combinator('any', it, 'any'); };

  // --- fetch (mocked: the sandboxed iframe has no network access) ----------
  var RawResponse = window.Response;
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || String(input);
    var cfgs = window.__mockFetch || {};
    var cfg = cfgs[url] || cfgs['*'] || {};
    var delay = cfg.delay === undefined ? 120 : cfg.delay;
    var status = cfg.status === undefined ? 200 : cfg.status;
    var body = cfg.body === undefined ? { ok: true, url: url, data: [1, 2, 3] } : cfg.body;
    var method = (init && init.method) || 'GET';
    return new Promise(function (resolve) {
      scheduleMacrotask(function () {
        resolve(new RawResponse(typeof body === 'string' ? body : JSON.stringify(body), {
          status: status,
          headers: { 'content-type': 'application/json' }
        }));
      }, delay, 'fetch ' + method + ' ' + url + ' (mocked)', 'fetch response', []);
    });
  };



  window.__rt = {
    line: function (n) { emit('line', { line: n }); },
    enter: function (name, line) {
      stack.push(name);
      emit('stack-push', { name: name, line: line });
    },
    exit: function () {
      stack.pop();
      emit('stack-pop', {});
    },
    aw: function (value, line) {
      var frame = stack.pop();
      emit('stack-pop', { suspended: true });
      var id = ++taskId;
      pending++;
      var tagged = rawThen.call(
        Promise.resolve(value),
        function (v) { emit('microtask-enqueue', { id: id, label: 'await resume (line ' + line + ')' }); return v; },
        function (e) { emit('microtask-enqueue', { id: id, label: 'await throw (line ' + line + ')' }); throw e; }
      );
      function resume() {
        emit('microtask-run', { id: id });
        if (frame !== undefined) { stack.push(frame); emit('stack-push', { name: frame, line: line }); }
        emit('microtask-end', { id: id });
        pending--;
        maybeComplete();
      }
      return rawThen.call(
        tagged,
        function (v) { resume(); return v; },
        function (e) { resume(); throw e; }
      );
    }
  };

  window.addEventListener('error', function (ev) {
    emit('error', { text: 'Uncaught ' + (ev.error && ev.error.name ? ev.error.name : 'Error') + ': ' + (ev.error ? ev.error.message : ev.message) });
    syncDone = true;
    pending = 0;
    maybeComplete();
  });

  window.addEventListener('unhandledrejection', function (ev) {
    var r = ev.reason;
    emit('error', {
      text: 'Uncaught (in promise) ' + (r && r.name ? r.name + ': ' + r.message : fmt(r, 1))
    });
    ev.preventDefault();
  });

  window.addEventListener('message', function (ev) {
    var data = ev.data;
    if (!data || data.__jsSandboxRun !== true) return;
    runId = data.runId;
    seq = 0; taskId = 0; pending = 0; syncDone = false; completed = false; stack = [];
    intervalTicks = 0;
    var el = document.getElementById('user-code');
    if (el) el.remove();
    var s = document.createElement('script');
    s.type = 'module';
    s.id = 'user-code';
    s.async = false;
    var hasModuleSyntax = /^\\s*(import|export)\\s/m.test(data.code);
    s.textContent = hasModuleSyntax
      ? data.code + '\\nwindow.__done && window.__done();'
      : 'window.__rt.enter("(main)",1);try{\\n' + data.code + '\\n}finally{window.__rt.exit();' +
        'window.__done && window.__done();}';

    window.__done = function () { syncDone = true; maybeComplete(); };
    document.body.appendChild(s);
  });

  parent.postMessage({ __jsSandbox: true, ready: true }, '*');
})();
`;

export const SANDBOX_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>sandbox</title></head><body><script>${RUNTIME}<\/script></body></html>`;

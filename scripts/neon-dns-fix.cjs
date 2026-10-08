// Neon DNS fix for local PCs whose ISP DNS (e.g. Reliance/Jio) refuses
// Neon hostnames with ENOTFOUND / "Query refused".
// Usage:
//   node -r ./scripts/neon-dns-fix.cjs scripts/check_neon.cjs
// or add `require('./neon-dns-fix')` as the first line of a script.
// Patches dns.lookup to fall back to Google DNS (8.8.8.8, 8.8.4.4) +
// Cloudflare (1.1.1.1) via resolve4/resolve6, and pins SSL servername
// so Neon's SNI routing works when connecting via fallback IP.
const dns = require("node:dns");
const net = require("node:net");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {}

const origLookup = dns.lookup.bind(dns);

function lookupWithGoogleFallback(hostname, options, callback) {
  let opts = {};
  let cb = callback;
  if (typeof options === "function") {
    cb = options;
  } else if (typeof options === "number") {
    opts = { family: options };
  } else if (options) {
    opts = options;
  }
  if (net.isIP(hostname)) {
    const family = net.isIPv4(hostname) ? 4 : 6;
    if (opts.all) return cb(null, [{ address: hostname, family }]);
    return cb(null, hostname, family);
  }
  return origLookup(hostname, opts, (err, address, family) => {
    if (!err) return cb(null, address, family);
    dns.resolve4(hostname, (e4, v4) => {
      if (!e4 && v4 && v4.length) {
        if (opts.all) return cb(null, v4.map((a) => ({ address: a, family: 4 })));
        return cb(null, v4[0], 4);
      }
      dns.resolve6(hostname, (e6, v6) => {
        if (!e6 && v6 && v6.length) {
          if (opts.all) return cb(null, v6.map((a) => ({ address: a, family: 6 })));
          return cb(null, v6[0], 6);
        }
        return cb(err);
      });
    });
  });
}

try {
  dns.lookup = lookupWithGoogleFallback;
} catch {}

// Auto-pin SSL servername for Neon when callers use a plain connection string.
// pg v8 reads ssl.servername for SNI; without it, IP-fallback connections hit
// "Endpoint ID is not specified ... SNI support".
try {
  const pg = require("pg");
  const OrigPool = pg.Pool;
  function hostOf(cs) {
    try {
      return new URL(cs).hostname;
    } catch {
      return undefined;
    }
  }
  pg.Pool = function (config) {
    config = config || {};
    if (config.connectionString) {
      const h = hostOf(config.connectionString);
      if (h && h.includes("neon.tech")) {
        config = {
          ...config,
          ssl: { rejectUnauthorized: false, servername: h, ...(config.ssl || {}) },
        };
        // keep explicit servername if caller set one
        if (config.ssl && !config.ssl.servername) config.ssl.servername = h;
      }
    }
    return new OrigPool(config);
  };
  Object.assign(pg.Pool, OrigPool);
} catch {
  // pg not installed in this context — lookup patch above still applies
}

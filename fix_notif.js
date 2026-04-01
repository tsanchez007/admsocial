const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8').replace(/\r\n/g, '\n');
const old = '  <div class="sidebar-logo">\n    <span class="logo-icon">\u25c8</span>\n    <span class="logo-text">SocialApp</span>\n  </div>';
const nw = '  <div class="sidebar-logo" style="display:flex;align-items:center;justify-content:space-between;">\n    <div><span class="logo-icon">\u25c8</span><span class="logo-text">SocialApp</span></div>\n    <div id="notifBtn" onclick="toggleNotif()" style="position:relative;cursor:pointer;padding:4px;">\n      <span style="font-size:1.3rem;">&#128276;</span>\n      <span id="notifBadge" style="display:none;position:absolute;top:0;right:0;background:#e74c3c;color:white;font-size:9px;font-weight:700;border-radius:99px;padding:1px 5px;min-width:16px;text-align:center;">0</span>\n    </div>\n  </div>';
if (h.includes(old)) { h = h.replace(old, nw); fs.writeFileSync('index.html', h); console.log('OK'); }
else { console.log('NOT FOUND'); }

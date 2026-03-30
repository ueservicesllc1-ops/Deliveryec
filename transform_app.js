const fs = require('fs');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(file => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

walk(path.join(process.cwd(), 'src/app/app'), (err, results) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  
  results.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    
    // Switch all internal links to the /app flow
    content = content.replace(/\/order\/search/g, '/app/search');
    content = content.replace(/\/order\/orders/g, '/app/orders');
    content = content.replace(/\/order\/checkout/g, '/app/checkout');
    content = content.replace(/\/order\/restaurant/g, '/app/restaurant');
    content = content.replace(/\/order\/track/g, '/app/track');
    content = content.replace(/\/order\/register-business/g, '/app/register-business');
    content = content.replace(/href=\"\/order\"/g, 'href=\"/app\"');
    content = content.replace(/push\([\'\"]\/?order[\'\"]\)/g, 'push(\"/app\")');
    content = content.replace(/'\/order'/g, '\'/app\'');
    content = content.replace(/\"\/order\"/g, '\"/app\"');
    
    // Explicit padding overrides for true mobile-only layout
    // We remove desktop styling completely.
    content = content.replace(/padding\s*:\s*'0 32px 28px'/g, "padding: '0 16px 24px'");
    content = content.replace(/padding\s*:\s*'0 32px'/g, "padding: '0 16px'");
    content = content.replace(/padding\s*:\s*'14px 32px'/g, "padding: '14px 16px'");
    content = content.replace(/padding\s*:\s*'32px 40px'/g, "padding: '24px 20px'");
    content = content.replace(/padding\s*:\s*'32px'/g, "padding: '16px'");
    content = content.replace(/left\s*:\s*'32px'/g, "left: '16px'");
    content = content.replace(/right\s*:\s*'32px'/g, "right: '16px'");
    content = content.replace(/padding\s*:\s*'0 24px 24px'/g, "padding: '0 16px'");
    
    // Hide massive elements designed for tablet/desktop
    // This removes the "md:" hidden logic so desktop nav is permanently hidden
    if (f.includes('layout.tsx')) {
      content = content.replace(/className=\"hidden md:flex\"/g, 'className=\"hidden\"');
      // For layout max_width, prevent constraints
      content = content.replace(/maxWidth:\s*pathname.includes\('\/checkout'\)\s*\?\s*'none'\s*:\s*'1280px'/g, "maxWidth: '100vw'");
    }

    fs.writeFileSync(f, content, 'utf8');
  });
  console.log("Done transforming /app");
});

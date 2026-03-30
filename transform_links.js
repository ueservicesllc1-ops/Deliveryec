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
    
    // Completely remove the `md:hidden` / `hidden md:flex` layout constraints
    // in the layout and page to ensure it functions consistently regardless of screen width.
    // BUT only do this carefully for the layout and page components specifically.

    fs.writeFileSync(f, content, 'utf8');
  });
  console.log("Done transforming /app links");
});

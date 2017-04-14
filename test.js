const glob = require('glob'),
    path = require('path');

function getEntries(globPath) {
    var files = [],
        entries = {};
    if (globPath instanceof Array) {
        globPath
            .forEach(function (pattern) {
                // console.log(pattern)
                files = files.concat(glob.sync(pattern))
            })
    } else {
        files = glob.sync(globPath)
    }
    // console.log(files); console.log(files.length)
    return files;
}

function getCssPath(ejsPath) {
    let extname = path.extname(ejsPath);
    let cssname = path.basename(ejsPath, extname);
    let ejsPathArr = ejsPath.split(path.sep);
    ejsPathArr.shift();
    const jsLinkPathArr = [
        'javascripts', ...ejsPathArr
    ];
    jsLinkPathArr[jsLinkPathArr.length - 1] = cssname + '.js';

    const jsPathArr = [
        'public', ...jsLinkPathArr
    ];

    ejsPathArr = [
        'stylesheets', ...ejsPathArr
    ];
    ejsPathArr[ejsPathArr.length - 1] = cssname + '.css';
    const cssPathArr = [
        'public', ...ejsPathArr
    ];

    // console.log(ejsPathArr) console.log(cssPathArr)
    console.log(ejsPathArr.join('/'));
    console.log(cssPathArr.join('/'));
    console.log(jsLinkPathArr.join('/'));
    console.log(jsPathArr.join('/'));
    return {
        cssLinkPath: '/' + ejsPathArr.join('/'),
        cssFilePath: cssPathArr.join('/'),
        jsLinkPath: '/' + jsLinkPathArr.join('/'),
        jsFilePath: jsPathArr.join('/')
    };
}

var ejsArr = getEntries('views/index.ejs');
console.log(ejsArr);

ejsArr.forEach(function (element) {
    getCssPath(element);
}, this);

process.exit(0);
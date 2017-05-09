const glob = require('glob'),
    path = require('path'),
    config = require('./config');

function Fn_GetEntries(globPath) {
    var files = [],
        entries = {};
    if (globPath instanceof Array) {
        globPath
            .forEach(function (pattern) {
                files = files.concat(glob.sync(pattern))
            })
    } else {
        files = glob.sync(globPath)
    }
    return files;
}

/**
 * 根据HTML模板路径获取js,css文件路径，以及需要注入的link路径(需要根据具体业务情况需改)
 * @param {*} templatePath HTML模板路径
 */
function Fn_GetCssJsPath(templatePath) {
    let extname = path.extname(templatePath);
    let cssname = path.basename(templatePath, extname);
    let templatePathArr = templatePath.split(path.sep);
    templatePathArr.shift();
    const jsLinkPathArr = [
        config.javascripts, ...templatePathArr
    ];
    jsLinkPathArr[jsLinkPathArr.length - 1] = cssname + '.js';

    const jsPathArr = [
        config.dist, ...jsLinkPathArr
    ];

    templatePathArr = [
        config.stylesheets, ...templatePathArr
    ];
    templatePathArr[templatePathArr.length - 1] = cssname + '.css';
    const cssPathArr = [
        'public', ...templatePathArr
    ];
    return {
        cssLinkPath: '/' + templatePathArr.join('/'),
        cssFilePath: cssPathArr.join('/'),
        jsLinkPath: '/' + jsLinkPathArr.join('/'),
        jsFilePath: jsPathArr.join('/')
    };
}

/**
 * 获取文件打包路径
 * @param {*} fileRelativePath 相对路径（相对于根目录__dirname）
 */
function Fn_GetFileDistPath(fileRelativePath) {
    const pathArr = fileRelativePath.split(path.sep);
    pathArr[0] = config.dist;
    pathArr.pop();
    return pathArr.join('/');
}

module.exports.Fn_GetEntries = Fn_GetEntries;
module.exports.Fn_GetCssJsPath = Fn_GetCssJsPath;
module.exports.Fn_GetFileDistPath = Fn_GetFileDistPath;

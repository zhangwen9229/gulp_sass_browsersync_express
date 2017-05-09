const postCssOptions = {
    map: false
};

const clean = require('gulp-clean'),
    runSequence = require('run-sequence'),

    config = require('./config'),
    path = require('path'),
    utils = require('./utils');

module.exports.RegisterTasks = function (gulp, dirname) {
    const taskTools = require('./tasktools').taskTools(gulp);
    // 删除文件
    gulp.task('clean', function (cb) {
        return gulp.src([
            path.join(config.dist, '/'),
            path.join(config.viewsDist, '/')
        ], {read: false}).pipe(clean());
    });
    // scss编译后的css将注入到浏览器里实现更新
    gulp.task('sass', function () {
        const styleDist = path.join(dirname, config.dist, config.stylesheets)
        return taskTools.Compresssass(path.join(dirname, config.src, config.stylesheets, '**/*.scss'), styleDist);
    });

    // 压缩HTML Template
    gulp.task('template', function () {
        // console.log(path.join(dirname,config.src, config.viewsSrc, '**', '*' +
        // config.htmlTemplateExt)); console.log(path.join(dirname, config.viewsDist));
        // process.exit(0)
        return taskTools.compressTemplate(path.join(dirname, config.src, config.viewsSrc, '**', '*' + config.htmlTemplateExt), path.join(dirname, config.viewsDist));
    });

    // 压缩js
    gulp.task('js', function () {
        return taskTools.CompressJs(path.join(dirname, config.src, config.javascripts, '**', '*.js'), path.join(dirname, config.dist, config.javascripts));
    });

    //拷贝并压缩img
    gulp.task('img', function () {
        return taskTools.CopeImage(path.join(dirname, config.src, config.images, '**', '*'), path.join(dirname, config.dist, config.images));
    });

    // 拷贝lib
    gulp.task('lib', function () {
        taskTools.cope(path.join(dirname, config.src, config.library, '**', '*'), path.join(dirname, config.dist, config.library));
    });

    gulp.task('inject', function (cb) {
        const ejsArr = utils.Fn_GetEntries(path.join(dirname, config.viewsDist, '**', '*' + config.htmlTemplateExt));
        var taskArr = [];
        ejsArr.forEach(function (ejsPath, index) {
            var pathObj = utils.Fn_GetCssJsPath(path.relative(dirname, ejsPath));
            var taskName = 'inject' + index;
            gulp.task(taskName, function (cb) {
                taskTools.staticInject(ejsPath, pathObj, cb);
            });
            taskArr.push(taskName);
        })
        if (taskArr.length == 0) {
            cb();
            return;
        }
        runSequence(taskArr, cb);

    });

}

function Fn_Build() {}

function Fn_IsApp() {
    return true;
}

const devEnv = require('./dev.env'),
    prodEnv = require('./prod.env');
/**
 * 判断是否生产环境
 */
function Fn_IsProductionEnv() {
    if (NODE_ENV == prodEnv.NODE_ENV) {
        return true;
    } else {
        return false;
    }
}
const clean = require('gulp-clean'),
    runSequence = require('run-sequence'),
    config = require('./config'),
    path = require('path'),
    watch = require('gulp-watch');
utils = require('./utils');

module.exports.RegisterTasks = function (gulp, dirname, reload) {
    const taskTools = require('./tasktools').taskTools(gulp, reload);
    Fn_Build(gulp, dirname, reload, taskTools);
    Fn_Dev(gulp, dirname, reload, taskTools);
}

function Fn_Dev(gulp, dirname, reload, taskTools) {
    gulp
        .task('dev', function () {
            // 将你的默认的任务代码放这 监听所有scss文档
            watch(path.join(dirname, config.src, config.stylesheets, '**', '*.scss'), function (event) {
                const filePath = path.relative(dirname, event.path);
                console.log(event.path)
                console.log(utils.Fn_GetFileDistPath(filePath));
                return taskTools.Compresssass(event.path, utils.Fn_GetFileDistPath(filePath));
            });

            // 监听所有.js档
            gulp
                .watch(path.join(dirname, config.src, config.library, '**', '*.js'))
                .on('change', function (event) {
                    const filePath = path.relative(dirname, event.path);
                    return taskTools.cope(event.path, utils.Fn_GetFileDistPath(filePath));
                });
            gulp
                .watch(path.join(dirname, config.src, config.javascripts, '**', '*.js'))
                .on('change', function (event) {
                    const filePath = path.relative(dirname, event.path);
                    return taskTools.CompressJs(event.path, utils.Fn_GetFileDistPath(filePath));
                });
            gulp.watch([
                path.join(dirname, config.dist, config.javascripts, '**', '*.js'),
                path.join(dirname, config.library, '**', '*.*')
            ]).on('change', reload);

            // 监听所有图片档
            watch([
                path.join(dirname, config.src, config.images, '**', '*'),
                '!' + path.join(dirname, config.src, config.images, '**', '*.DS_Store')
            ], function (event) {
                const filePath = path.relative(dirname, event.path);
                console.log(event.path)
                console.log(utils.Fn_GetFileDistPath(filePath))
                return taskTools.CopeImage(event.path, utils.Fn_GetFileDistPath(filePath));
            });
            gulp
                .watch(path.join(dirname, config.dist, config.images, '**', '*'))
                .on('change', reload);

            // 监听HTML 模板
            gulp
                .watch(path.join(dirname, config.src, config.viewsSrc, '**', '*' + config.htmlTemplateExt))
                .on('change', function (event) {
                    const filePath = path.relative(dirname, event.path);
                    const pathArr = filePath.split(path.sep);
                    pathArr.shift();
                    pathArr.pop();
                    return taskTools.compressTemplate(event.path, pathArr.join('/'));
                });
            var watcher = gulp.watch(path.join(dirname, config.viewsDist, '**', '*' + config.htmlTemplateExt));
            watcher.on('change', function (event) {
                // console.log('Event type: ' + event.type); // added, changed, or deleted
                // console.log('Event path: ' + event.path); // The path of the modified file
                console.log('relative path:' + path.relative(dirname, event.path));
                const filePath = path.relative(dirname, event.path);
                // const ejsArr = utils.Fn_GetEntries(filePath);
                const pathObj = utils.Fn_GetCssJsPath(filePath);
                Fn_InjectTask(event.path, pathObj, reload);
            });
        })
}

function Fn_Build(gulp, dirname, reload, taskTools) {
    // 删除文件
    gulp
        .task('clean', function (cb) {
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

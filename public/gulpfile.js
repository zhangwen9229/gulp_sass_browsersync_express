const gulp = require('gulp');
const sass = require('gulp-sass');
const filter = require('gulp-filter');
var postcss = require('gulp-postcss');
var px2rem = require('gulp-px2rem');
var autoprefixer = require('autoprefixer');
var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;
var sourcemaps = require('gulp-sourcemaps');

var px2remOptions = {
    rootValue: 750 / 16,
    unitPrecision: 5,
    propWhiteList: [],
    propBlackList: [
        'border-bottom',
        'border-top',
        'border-left',
        'border-right',
        'border',
        'filter'
    ],
    replace: true,
    mediaQuery: false,
    minPx: 1 //需转换rem的最小像素值，超过1px的都转换rem
};
var postCssOptions = {
    map: false,
};

// 静态服务器 + 监听 scss/html 文件
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        // server: "./",
        proxy: "http://127.0.0.1:3000"
    });

    gulp.watch("*.scss", ['sass']);
    gulp.watch("*.html").on('change', reload);
});

// scss编译后的css将注入到浏览器里实现更新
gulp.task('sass', function () {
    var plugins = [
        autoprefixer({browsers: ['> 5%']})
    ];
    const f = filter(['**', '!node_modules/**', '!px2rem.scss']);
    return gulp
        .src('./sass/*.scss')
        .pipe(f)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(plugins))
        .pipe(px2rem(px2remOptions,postCssOptions))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('./'))
        // .pipe(filter(['**/*.css']))  //防止sourcemap引起全页面刷新（css非注入式刷新） 
        .pipe(reload({stream: true,match: '**/*.css'}));//match: '**/*.css' 防止sourcemap引起全页面刷新（css非注入式刷新） 
});

gulp.task('default', ['serve']);
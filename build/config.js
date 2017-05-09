module.exports = {
    src: 'src',
    dist: 'public',
    viewsSrc:'views',
    viewsDist: 'views',
    javascripts: 'javascripts',
    stylesheets: 'stylesheets',
    images:'images',
    library:'lib',
    htmlTemplateExt:'.ejs',
    px2remOptions: {
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
    }
}
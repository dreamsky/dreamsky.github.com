
({
    // appDir: "some/path/",
    baseUrl: "../js/",
    // mainConfigFile: 'main.js',
    // dir: "dist",
    // optimize: "uglify2",
    // generateSourceMaps: true,
    preserveLicenseComments: false,
    paths: {
        'jquery': 'lib/jquery-1.10.1.min'
    },
    name: "main", 
    out: "dist/all.js",
    // excludeShallow: ['jquery'],
    /*uglify2: {
        output: {
            beautify: true
        },
        compress: {
            sequences: false,
            global_defs: {
                DEBUG: false
            }
        },
        warnings: true,
        mangle: false
    },*/ 
    // fileExclusionRegExp: /^\./,
    // skipModuleInsertion: true,
    logLevel: 0,
    throwWhen: {
        optimize: true
    },
    waitSeconds: 7
})
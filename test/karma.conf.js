module.exports = function(config) {
  config.set({
    reporters: ['dots'], //dots progress
    basePath : '../',
    files : [
      './node_modules/chai/chai.js',
      './bower_components/angular/angular.js',
      './bower_components/angular-ui-router/release/angular-ui-router.min.js',
      './src/ngMidwayTester.js',
      './test/spec/*.js'
    ],
    logLevel : config.LOG_INFO,
    frameworks: ['mocha'],

      // Start these browsers, currently available:
      // - Chrome
      // - ChromeCanary
      // - Firefox
      // - Opera
      // - Safari (only Mac)
      // - PhantomJS
      // - IE (only Windows)
    browsers: ['PhantomJS'],
    proxies: {
      '/': 'http://localhost:8844/'
    }
      ,

      // Which plugins to enable
      plugins: [
          'karma-phantomjs-launcher',
        'karma-mocha'
         // 'karma-jasmine'
      ]
  });
};

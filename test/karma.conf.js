module.exports = function(config) {
  config.set({
    reporters: ['dots'], //dots progress
    basePath : '../',
    files : [
      './node_modules/chai/chai.js',
      './bower_components/angular/angular.js',
      './bower_components/angular-route/angular-route.js',
      './src/ngMidwayTester.js',
      './test/lib/chai.js',
      './test/spec/ngMidwayTesterSpec.js'
    ],
    singleRun: true,
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
          'karma-jasmine',
          'karma-mocha'
          //'karma-junit-reporter'
      ],
  });
};

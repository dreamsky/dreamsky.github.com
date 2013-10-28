/*
	main code
*/
require.config({
    baseUrl: 'js',
    paths: {
        'jquery': 'lib/jquery-1.10.1.min'
    },
    shim: {
    	'undercore': {
    		exports: '_'
    	},
    	'backbone': {
    		deps: ['undercore'],
    		exports: 'Backbone'
    	}
    }
});

require(['app/demo']);



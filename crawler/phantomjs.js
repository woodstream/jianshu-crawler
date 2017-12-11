// a phantomjs example
var page = require('webpage').create();
page.onLoadFinished = function(status){
    // console.log(page.content); 
};
page.open("http://www.jianshu.com/u/4ca93d60a9fe", function(status) {
   if ( status === "success" ) {
        // setTimeout(function(){
        //     console.log(page.content); 
        //     phantom.exit(0);
        // }, 500);
        // console.log(page.content); 
        page.open("http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe", function(res){
            if ( res === "success" ) {    
                console.log(page.content); 
            } else {
                console.log("Api Page failed to load."); 
            }
        });
   } else {
      console.log("Page failed to load."); 
   }
//    phantom.exit(0);
});
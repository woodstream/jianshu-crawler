var jsdom = require("jsdom"); 
$ = require("jquery")(new jsdom.JSDOM().window); 


// http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe
$.get("http://www.jianshu.com/u/4ca93d60a9fe",function(result){
   console.log(result);
});
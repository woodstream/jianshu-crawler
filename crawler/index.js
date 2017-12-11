var Crawler = require("crawler");
// var mysql   = require('./db-helper');
var fs = require('fs');
var phantom = require('phantom');
var exec = require('child_process').exec; 
var jsdom = require("jsdom"); 
$ = require("jquery")(new jsdom.JSDOM().window); 

_baseSavePath = './data';
_baseHomeUrl = 'http://www.jianshu.com/u/4ca93d60a9fe';

/**
 * 获取博客信息
 * @param {*} res 
 */
function getBlogInfo(res){
    var $ = res.$;
    // $ is Cheerio by default
    //a lean implementation of core jQuery designed specifically for the server
    // console.log($("title").text());
    var infoes = $(".main-top .info .meta-block");
    var pList = infoes.find('p');
    var baseInfo = {
        "attention": pList[0].firstChild.data,
        "fans": pList[1].firstChild.data,
        "article": pList[2].firstChild.data,
        "wordCount": pList[3].firstChild.data,
        "favorite": pList[4].firstChild.data
    }
    var result = {
        baseInfo: baseInfo,
        special: [],
        anthology: []
    }
    return result;
}

/**
 * 获取文章列表
 * @param {*} res 
 * @param {*} domain 
 */
function getArticleList(res, domain){
    var $ = res.$;
    var raw = $(".note-list .content");
    var result = [];
    raw.each((index, item) =>{
        let $article = $(item);
        let link = $article.find('.title');
        let href = link.attr('href');
        var id;
        if(href){
            index = href.lastIndexOf('\/');
            if(index>=0){
                id = href.substr(index + 1);
            }
        }else{
            return null;
        }
        let summary = $article.find('p.abstract');
        let others = $article.find('div.meta');
        let children = others[0].children;
        result.push({
            "id": id,
            "title": link.text().trim(),
            "href": domain + href,
            "summary": summary.text().trim(),
            "view": $(children[1]).text().trim(),
            "viewHref": domain + $(children[1]).attr('href'),
            "favorite": $(children[3]).text().trim(),
            "favoriteHref": domain + $(children[3]).attr('href'),
            "message": $(children[5]).text().trim()
        })
    })
    return result;
}

/**
 * 获取文章详情
 * @param {*} res 
 */
function getArticleDetail(res){
    //TODO: 获取文章详情
}

/**
 * 获取文章信息
 */
function getArticleInfo(){

}

/**
 * 初始化获取主页信息
 * @param {* } baseHomeUrl 主页地址
 * @param {* } baseSavePath 保存基地址
 */
function initGetInfo(baseHomeUrl, baseSavePath){
    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                //var $ = res.$;
                //获取用户个人信息
                var info = getBlogInfo(res);
                if(info){
                    if (!fs.existsSync(baseSavePath)) {
                        fs.mkdirSync(baseSavePath);
                    }
                    // 写入数据, 文件不存在会自动创建
                    fs.writeFile(baseSavePath + '/info.json', JSON.stringify(info), function (err) {
                        if (err) throw err;
                        console.log('写入基本信息完成');
                    });
                }
            }
            done();
        }
    });
    c.queue(baseHomeUrl);
}

/**
 * 支持添加头部请求
 * @param {*} headers 请求头
 * @param {*} url 请求路径
 * @param {*} callback 回调
 */
function crawlerRuest(headers, url, callback){
    var c = new Crawler({
        jQuery: false,
        maxConnections : 10,
        headers: headers,
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                //var $ = res.$;
               callback(res.body);
            }
            done();
        }
    });
    c.queue(url);
}

/**
 * 执行命令行
 * @param {* } cmdStr 命令行
 * @param {* } callback 回调
 */
function execCmd(cmdStr, callback){

    //创建一个实例
    exec(cmdStr, function(err,stdout,stderr){
        callback(err,stdout,stderr);
    });
}


function initGetInfoByAjax(){
    $.ajax({
        type: 'GET',
        url: 'http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe',
        headers:{
            "Content-Type": "application/json; charset=utf-8",
            "Accept": "application/json", 
            "User-Agent": "Mozilla/5.0 (compatible, MSIE 10.0, Windows NT, DigExt)",
            "Referer": "http://www.jianshu.com/u/4ca93d60a9fe"
        },
        success: function(data, status, xhr){
           console.log(xhr);
        },
        error: function(xhr, type){
            console.log(xhr);
        }
    });
}

function initGetInfoByPhantom(baseHomeUrl){
    
    //创建一个实例
    phantom.create().then(function(instance){
        instance.createPage().then(function(page){
            var that = this;
            page.open(baseHomeUrl).then(function(status) {
                if ( status === "success" ) {
                    page.open("http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe").then(function(res){
                        var title = page.evaluate(function() {
                            console.log(document.body);
                            return document.body;
                        });
                    });
                } else {
                    console.log("Page failed to load."); 
                }
            });
        })
    });
}

/**
 * 获取文章列表
 * @param {*} articles 文章列表
 * @param {*} baseHomeUrl 主页地址
 * @param {*} baseSavePath 保存基地址
 */
function initGetArticleList(articles, baseHomeUrl, baseSavePath){
    //
    var pageIndex = 1;
    var cList = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            }else{   
                if (res.request.headers.referer == undefined) {     
                    //获取文章列表
                    var index = baseHomeUrl.indexOf('.com');
                    var domain = baseHomeUrl.substr(0, index + 4);
                    var list = getArticleList(res, domain);
                    if(list){
                        articles = articles.concat(list);
                    }
                }
            }
            done();
        }
    });
    var i = 1;
    var urls = [];
    while( i < 10) {
        var url = baseHomeUrl + '?order_by=shared_at&&page=' + i;
        urls.push(url);
        i++;
    }

    // 第一个爬虫结束之后开启第二个爬虫n
    cList.on('drain', () => {
        // console.log(articlesLink.length);
        // 写入数据, 文件不存在会自动创建
        var savePath = baseSavePath + '/article-list';
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }
        fs.writeFile(savePath + '/page.json', JSON.stringify(articles), function (err) {
            if (err) throw err;
            console.log('写入列表完成');
        });
    });
    cList.queue(urls);
}

function initGetArticleDetail(baseHomeUrl, baseSavePath){
    var c = new Crawler({
        maxConnections : 10,
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            }else{
                
                //获取文章详情
                var list = getArticleDetail(res);
                // 写入数据, 文件不存在会自动创建
                var savePath = baseSavePath + '/article-detail';
                if (!fs.existsSync(savePath)) {
                    fs.mkdirSync(savePath);
                }
                fs.writeFile(savePath + '/detail.json', info, function (err) {
                    if (err) throw err;
                    console.log('写入详情完成');
                });
            }
            done();
        }
    });
}

initGetInfo(_baseHomeUrl, _baseSavePath);
var articles = [];
crawlerRuest({"Accept": "application/json"}, 
'http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe',
function(stdout){
    if (!fs.existsSync(_baseSavePath)) {
        fs.mkdirSync(_baseSavePath);
    }
    // 写入数据, 文件不存在会自动创建
    fs.writeFile(_baseSavePath + '/other.json', stdout, function (err) {
        if (err) throw err;
        console.log('写入文集及专题信息完成');
    });
});
// execCmd('go run crawler.go', function(err,stdout,stderr){
//     var _savePath = '../src/assets/data';
//     if (!fs.existsSync(_savePath)) {
//         fs.mkdirSync(_savePath);
//     }
//     // 写入数据, 文件不存在会自动创建
//     fs.writeFile(_savePath + '/other.json', stdout, function (err) {
//         if (err) throw err;
//         console.log('写入完成');
//     });
// });
initGetArticleList(articles, _baseHomeUrl, _baseSavePath);
// initGetArticleDetail();

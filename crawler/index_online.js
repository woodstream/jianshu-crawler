var Crawler = require("crawler");
// var mysql   = require('./db-helper');
var fs = require('fs');
var phantom = require('phantom');
var exec = require('child_process').exec;
var jsdom = require("jsdom");
$ = require("jquery")(new jsdom.JSDOM().window);

_baseHomeUrl = 'http://www.jianshu.com/u/4ca93d60a9fe';

/**
 * 获取博客信息
 * @param {*} res 
 */
function getBlogInfo(res) {
  var $ = res.$;
  var infoes = $(".main-top .info .meta-block");
  var pList = infoes.find('p');
  var baseInfo = {
    "attention": pList[0].firstChild.data,
    "fans": pList[1].firstChild.data,
    "article": pList[2].firstChild.data,
    "wordCount": pList[3].firstChild.data,
    "favorite": pList[4].firstChild.data
  }
  return baseInfo;
}

/**
 * 获取文章列表
 * @param {*} res 
 * @param {*} domain 
 */
function getArticleList(res, domain) {
  var $ = res.$;
  var raw = $(".note-list .content");
  var result = [];
  raw.each((index, item) => {
    let $article = $(item);
    let link = $article.find('.title');
    let href = link.attr('href');
    var id;
    if (href) {
      index = href.lastIndexOf('\/');
      if (index >= 0) {
        id = href.substr(index + 1);
      }
    } else {
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
function getArticleDetail(res) {

}

/**
 * 获取文章信息
 */
function getArticleInfo() {

}


function initGetInfo(baseHomeUrl) {
  var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
        //var $ = res.$;
        //获取用户个人信息
        var info = getBlogInfo(res);
        if (info) {
            console.log(info);
            postData("http://localhost:8081/addBlogInfo", info);
        }
      }
      done();
    }
  });
  c.queue(baseHomeUrl);
}


function initGetInfoByAjax() {

  $.ajax({
    type: 'GET',
    url: 'http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe',
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible, MSIE 10.0, Windows NT, DigExt)",
      "Referer": "http://www.jianshu.com/u/4ca93d60a9fe"
    },
    success: function (data, status, xhr) {
      console.log(xhr);
    },
    error: function (xhr, type) {
      console.log(xhr);
    }
  });
}

/**
 * 支持添加头部请求
 * @param {*} headers 请求头
 * @param {*} url 请求路径
 * @param {*} callback 回调
 */
function crawlerRuest(headers, url, callback) {
  var c = new Crawler({
    jQuery: false,
    maxConnections: 10,
    headers: headers,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
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
function execCmd(cmdStr, callback) {
  //创建一个实例
  exec(cmdStr, function (err, stdout, stderr) {
    callback(err, stdout, stderr);
  });
}

function initGetInfoByPhantom() {
  //创建一个实例
  phantom.create().then(function (instance) {
    instance.createPage().then(function (page) {
      var that = this;
      page.open("http://www.jianshu.com/u/4ca93d60a9fe").then(function (status) {
        if (status === "success") {
          page.open("http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe").then(function (res) {
            var title = page.evaluate(function () {
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

function postData(url, data) {
    // console.log(articles);
  $.post(url, data, function (result) {
    console.log(result);
  }, "json");
}

function initGetArticleList(articles, baseHomeUrl) {
  //
  var pageIndex = 1;
  var cList = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {
        if (res.request.headers.referer == undefined) {
          //获取文章列表
          var index = baseHomeUrl.indexOf('.com');
          var domain = baseHomeUrl.substr(0, index + 4);
          var list = getArticleList(res, domain);
          if (list) {
            articles = articles.concat(list);
          }
        }
      }
      done();
    }
  });
  var i = 1;
  var urls = [];
  while (i < 10) {
    var url = baseHomeUrl + '?order_by=shared_at&&page=' + i;
    urls.push(url);
    i++;
  }

  // 等队列都处理完成后
  cList.on('drain', () => {
    console.log("save");
    postData("http://localhost:8081/addArticles", {
        json: JSON.stringify(articles)
    });
    // $.get("http://localhost:8081/hello", function(result){
    //     console.log(result);
    // });
  });
  cList.queue(urls);
}

function initGetArticleDetail() {
  var c = new Crawler({
    maxConnections: 10,
    // This will be called for each crawled page
    callback: function (error, res, done) {
      if (error) {
        console.log(error);
      } else {

        //获取文章列表
        var list = getArticleDetail(res);
        // 写入数据, 文件不存在会自动创建
        fs.writeFile('data/article-detail/detail.json', info, function (err) {
          if (err) throw err;
          console.log('写入详情完成');
        });
      }
      done();
    }
  });
}

// initGetInfo();
var articles = [];
// crawlerRuest({"Accept": "application/json"}, 
// 'http://www.jianshu.com/users/4ca93d60a9fe/collections_and_notebooks?slug=4ca93d60a9fe',
// function(stdout){
//     var obj = JSON.parse(stdout);
//     console.log(obj);
//     //文集
//     postData("http://localhost:8081/addNotebook", {
//         json: JSON.stringify(obj.notebooks)
//     });

//     //专题
//     postData("http://localhost:8081/addSpecial", {
//         json: JSON.stringify(obj.own_collections)
//     });

    
// });
// execCmd('go run crawler.go', function(err,stdout,stderr){
//     var baseUrl = '../src/assets/data';
//     if (!fs.existsSync(baseUrl)) {
//         fs.mkdirSync(baseUrl);
//     }
//     // 写入数据, 文件不存在会自动创建
//     fs.writeFile(baseUrl + '/other.json', stdout, function (err) {
//         if (err) throw err;
//         console.log('写入完成');
//     });
// });
initGetArticleList(articles);
// initGetArticleDetail();

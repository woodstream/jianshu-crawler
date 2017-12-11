var mysql = require('mysql');

function initDB(){
  var connection = mysql.createConnection({
      host     : 'localhost',
      user     : 'root',
      password : '123456',
      database : 'test'
  });
  return connection;
}

function connect(connection){
  connection.connect();
}

function disconnect(connection){
  connection.end();
}

function query(connection, sql, sqlParams){
  connection.query(sql, sqlParams, function (error, results, fields) {
    if (error) throw error;
    console.log('The solution is: ', results[0].solution);
  });  
}
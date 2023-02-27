"use strict"

let http=require("http");
let fs=require("fs");
let url=require("url");
let path=require("path");
let dispatcher = require("./dispatcher");
let mongo = require("mongodb");
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
let nodemailer = require("nodemailer");
const { Console } = require("console");

const mongoClient = mongo.MongoClient;
const CONNECTION_STRING = "mongodb://127.0.0.1:27017";
const privateKey = fs.readFileSync("keys/private.key","UTF-8");

let headerHTML={"Content-Type":"text/html;charset=utf-8"};
let headerCSS={"Content-Type":"text/css;charset=utf-8"};
let headerJS={"Content-Type":"text/javascript;charset=utf-8"};
let headerJSON={"Content-Type":"application/json;charset=utf-8"};
let headerIMAGE={"Content-Type":"image/png"};
let port=8888;


dispatcher.addListener("POST","/api/registraUtente",function(req,res){
    let mongoConnection = mongoClient.connect(CONNECTION_STRING);
    mongoConnection.catch((err) => {
        console.log("Errore di connessione al server Mongo. " + err);   //  lato server
        error(req,res,{"code":503,"message":"Errore di connessione al server Mongo."});     //lato client
    });
    mongoConnection.then((client) => {
        let db = client.db("basket");
        let collection = db.collection("user");
        let par = req["post"];
        let username = par["u"];
        let pwd = par["p"];
        let cog = par["c"];
        let nome = par["n"];
        let mail = par["m"];
        let pwdCrypted = bcrypt.hashSync(pwd,12);
        collection.insertOne({user:username, pwd:pwdCrypted, cognome:cog, nome:nome,mail:mail}, function(err,data){
            if(!err){
                res.writeHead(200, headerJSON);
                res.end(JSON.stringify(data));
            }else
                error(req,res,{"code":500,"message":"Errore di esecuzione della query Mongo."});
            client.close();
        });
    });
});

dispatcher.addListener("POST","/api/ctrlLogin",function(req,res){
    let mongoConnection = mongoClient.connect(CONNECTION_STRING);
    mongoConnection.catch((err) => {
        console.log("Errore di connessione al server Mongo. " + err);   //  lato server
        error(req,res,{"code":503,"message":"Errore di connessione al server Mongo."});     //lato client
    });
    mongoConnection.then((client) => {
        let db = client.db("basket");
        let collection = db.collection("user");
        let par = req["post"];
        let username = par["u"];
        let pwd = par["p"];
        
        collection.findOne({user:username}, function(errQ,dbUser){
            if(errQ){
                console.log(errQ);
                error(req,res,{"code":500,"message":"Errore di esecuzione della query Mongo."});
            }else{
                if(dbUser == null)
                    error(req,res,{"code":500,"message":"Errore login: username errato."});
                else{
                    if(bcrypt.compareSync(pwd,dbUser.pwd)){
                        let token = createToken(dbUser);
                        res.setHeader("Set-Cookie","token=" + token + ";max-age=" + (60*60*24*7));
                        res.writeHead(200,headerJSON);
                        res.end(JSON.stringify("Login OK!"));
                    }else
                        error(req,res,{"code":500,"message":"Errore login: password errata."});
                }
            }
            client.close();
        });
    });
});


dispatcher.addListener("POST","/api/dettagli",function(req,res){
    let token = readCookie(req,"token");
    let payload;
    if(token == "")
        error(req,res,{"code":401,"message":"Token inesistente"});
    else{
        payload = "";
        try{
            payload = jwt.verify(token, privateKey);
            console.log("------------------- Payload cognome e mail: " + payload+ " - " + payload.mail);
        }catch(err){
            error(req,res,{"code":401,"message":"Token scaduto o alterato"});
        }
    }

    let mongoConnection = mongoClient.connect(CONNECTION_STRING);
    mongoConnection.catch((err) => {
        console.log("Errore di connessione al server Mongo. " + err);   //  lato server
        error(req,res,{"code":503,"message":"Errore di connessione al server Mongo."});     //lato client
    });
    mongoConnection.then((client) => {
        let db = client.db("basket");
        let collection = db.collection("players");
        let id = req["post"].id;

        collection.findOne({"_id":id},function(errQ,data){
            if(errQ){
                console.log(err);
                error(req,res,{"code":500,"message":"Errore di esecuzione della query Mongo."});
            }else{
                // token rigenerato ad ogni tempo di scadenza
                console.log(data);
                token = createToken(payload);
                res.setHeader("Set-Cookie","token=" + token + ";max-age=" + (60*60*24*7));
                res.writeHead(200,headerJSON);
                
                /*let pwd = require("./getPwd");
                let transport=nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "valecremo22@gmail.com",
                        pass: pwd
                    }
                });
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
                let bodyHtml = "<html><body><br /><br /><h1>Dati del giocatore selezionato</h1>" +
							"<h3 style='font-weight: normal; font-size: 18pt; color:red'><table><tr><td width='250px'>Nome</td><td width='400px'>" + data.nome + "</td></tr>" +
							"<tr><td width='250px'>Squadra</td><td width='400px'>" + data.squadra + "</td></tr>" +
							"<tr><td width='250px'>Punti</td><td width='400px'>" + data.punti + "</td></tr>" +
							"</table></h3>" +
							"<br><br><h2>Grazie per averci contattato. Il team della 5D info</h2>"
						"</body></html>";
                const message = {
                    from:"valecremo22@gmail.com",
                    to:payload.mail,
                    subject:"Fanta giocatore acquisito",
                    html: bodyHtml
                };
                transport.sendMail(message,function(err,info){
                    if(err){
                        console.log("Errore di invio mail!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
                        res.end(JSON.stringify("Errore di invio mail!"));
                    }else{
                        console.log("Mail inviata correttamente!");
                        process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 1;
                        res.end(JSON.stringify(info));
                    }
                });*/
            }
            client.close();
        });
    });
});

dispatcher.addListener("GET","/api/tabGiocatori",function(req,res){
    let token = readCookie(req,"token");
    let payload;
    if(token == "")
        error(req,res,{"code":401,"message":"Token inesistente"});
    else{
        payload = "";
        try{
            payload = jwt.verify(token, privateKey);
            console.log("------------------- Payload cognome e mail: " + payload.cognome + " - " + payload.mail);
        }catch(err){
            error(req,res,{"code":401,"message":"Token scaduto o alterato"});
        }
    }

    let mongoConnection = mongoClient.connect(CONNECTION_STRING);
    mongoConnection.catch((err) => {
        console.log("Errore di connessione al server Mongo. " + err);   //  lato server
        error(req,res,{"code":503,"message":"Errore di connessione al server Mongo."});     //lato client
    });
    mongoConnection.then((client) => {
        let db = client.db("basket");
        let collection = db.collection("players");
        collection.find({}).toArray(function(errQ,data){
            if(errQ){
                console.log(err);
                error(req,res,{"code":500,"message":"Errore di esecuzione della query Mongo."});
            }else{
                // token rigenerato ad ogni tempo di scadenza
                token = createToken(payload);
                res.setHeader("Set-Cookie","token=" + token + ";max-age=" + (60*60*24*7));
                res.writeHead(200,headerJSON);
                res.end(JSON.stringify(data));
            }
            client.close();
        });
    });
});

function createToken(user){
    let token = jwt.sign({
        "user":user.user,
        "cognome":user.cognome,
        "nome":user.nome,
        "mail":user.mail,
        "exp":Math.floor(Date.now()/1000 + 10)
    },privateKey);
    console.log("Creato nuovo token: " + token);
    return token;
}

function readCookie(req,cookieName){
    let valoreCookie = "";
    if(req.headers.cookie){
        let cookies = req.headers.cookie.split(";");
        for(let i=0; i<cookies.length; i++){
            cookies[i] = cookies[i].split("=");
            if(cookies[i][0] == cookieName){
                valoreCookie = cookies[i][1];
            }
        }
    }
    return valoreCookie;
}

let server=http.createServer(function(request,response){
    dispatcher.dispatch(request,response);
});
server.listen(port,"127.0.0.1",serverMessage);
dispatcher.showList();

function error(req,res,err){
    res.writeHead(err.code,headerHTML);
    res.end(err.message);
}


function serverMessage(){
    console.log("Server running on port " + port + "...");
}

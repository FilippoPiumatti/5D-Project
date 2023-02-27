"use strict"

$(() => {
    $("#regForm").hide();
    $("#alertRegOk").hide();
    $("#mainForm").hide();
    $("#pError").hide();

    $("#btnReg").on("click",function(){
        $("#regForm").show();
        $("#loginForm").hide();
        $("#txtUserReg").val("");
        $("#txtPwdReg").val("");
        $("#txtCognome").val("");
        $("#txtNome").val("");
        $("#txtMail").val("");
    })

    $("#btnAnnulla").on("click", function(){
        $("#loginForm").show();
        $("#regForm").hide();
        $("#txtUser").val("");
        $("#txtPwd").val("");
    })

    $("#btnLogin").on("click",eseguiLogin);

    $("#btnRegistraDati").on("click", function(){
        let registra = sendRequestNoCallback("/api/registraUtente","POST",{u:$("#txtUserReg").val(),p:$("#txtPwdReg").val(), c:$("#txtCognome").val(),n:$("#txtNome").val(),m:$("#txtMail").val()});
        registra.fail(function(jqXHR){
            error(jqXHR);
        })
        registra.done(function(serverData){
            console.log(serverData);
            $("#alertRegOk").fadeIn();
            setTimeout(endReg,2000);
        })
    });
    
    function endReg(){
        $("#regForm").hide();
        $("#loginForm").show();
    }

    function eseguiLogin(){
        let user = $("#txtUser").val();
        let pwd = $("#txtPwd").val();

        let login = sendRequestNoCallback("/api/ctrlLogin","POST",{u:user,p:pwd});
        login.fail(function(jqXHR){
            error(jqXHR);
        });
        login.done(function(data) {
            let tabellaPlayer = sendRequestNoCallback("/api/tabGiocatori");
            tabellaPlayer.fail(function(jqXHR){
                error(jqXHR);
            });
            tabellaPlayer.done(function(serverData){
                $("#tbodyRoster").html("");
                serverData.forEach(function(player){
                    let tr=$("<tr></tr>");
                    tr.on("click", function(){
                        let datiGiocatore = sendRequestNoCallback("/api/dettagli","POST",{"id":player._id});
                        datiGiocatore.fail(function(jqXHR){
                            error(jqXHR);
                        });
                        datiGiocatore.done(function(serverData){
                            console.log("Mail inviata correttamente.Giocatore: " + serverData.nome + " - " + serverData.squadra);
                        });
                    });

                    let td = $("<td></td>");
                    td.html(player.nome);
                    tr.append(td);

                    td = $("<td></td>");
                    td.html(player.punti);
                    tr.append(td);

                    td = $("<td></td>");
                    td.html(player.squadra);
                    tr.append(td);

                    td = $("<td></td>");
                    td.html(player.eta);
                    tr.append(td);
                    
                    td = $("<td></td>");
                    td.html(player.conference);
                    tr.append(td);

                    td = $("<td></td>");
                    td.html(player.ruolo);
                    tr.append(td);

                    $("#tbodyRoster").append(tr);
                });
                $("#mainForm").show();
                $("#loginForm").hide();
            });
        });
    }
});
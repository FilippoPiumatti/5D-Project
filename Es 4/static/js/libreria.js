function sendRequest(url,method,parameters,callback){
	$.ajax({
		url: url,
		type: method,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		dataType: "text",  
		data: parameters,
		timeout : 6000000,
		success: callback,
		error : function(jqXHR, test_status, str_error){
			//console.log("No connection to " + link);
			//console.log("Test_status: " + test_status);
			alert("Error: " + str_error);
		}
	});
}

function sendRequestNoCallback(url,method,parameters){
	return $.ajax({
        url: url,
        contentType: "application/json; charset=UTF-8",
		type: method,
		dataType: "json",
		data: parameters,
		timeout: 5000
	});
}

function error(jqXHR, testStatus, strError) {
	/*if (jqXHR.status == 0)
		console.log("server timeout");
	else if (jqXHR.status == 200)
		console.log("Formato dei dati non corretto : " + jqXHR.responseText);
	else
		console.log("Server Error: " + jqXHR.status + " - " + jqXHR.responseText);*/

	let code = jqXHR.status;
	let message = jqXHR.responseText;
	$("#pError").show();
	if(code==0)
		$("#pError").html("Server TimeOut");
	else
		$("#pError").html("Errore Login. Codice Errore: " + code + " - " + message);
}
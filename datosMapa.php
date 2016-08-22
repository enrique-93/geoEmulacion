<?php

	header('Content-Type: application/json');
	$denegado = (object) ['code' => 0,'desc' => 'No se puede abrir el archivo'];

  if(isset($_POST['jsondata'])){
    	$myfile = fopen("json/mapa.json", "w") or die(json_encode($denegado));
		fwrite($myfile, $_POST['jsondata']);
		fclose($myfile);

		$response = (object) ['code' => 1,'des' => 'OK'];
		echo(json_encode($response));
    }else{
    	$response = (object) ['code' => 0,'des' => 'falta jsondata'];
    	echo(json_encode($response));
    }
  
?>
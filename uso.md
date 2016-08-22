Configurar Simulaciones

1.- Una vez instalado el proyecto en un servidor, acceder a http://localhost:PUERTO/index.html desde un navegador web.

2.- Para establecer una nueva ubicación para todas las simulaciones, arrastrar el círculo azul, o cambiar su tamaño
    desde sus esquinas (Circulos blancos) y después dar click en "Establecer esta Área" (IMPORTANTE: Aún no hay evento 
    asociado al punto central del círculo, por lo que al hacer drag sobre él, no se actualizarán los puntos en el mapa).
    Un alert te indicará si tuviste éxito.
    
2.1.- Sí en el área no hay mínimo 20 establecimientos (Por ejemplo en el mar) u ocurre un error con la API "Places de google",
    se mostrará debajo del mapa un mensaje de color rojo con el texto "No hay suficientes lugares en esta área".
    
2.2.- Una vez realizado el paso 2 sin encontrar algún error, un máximo de 200 lugares encontrados en la zona por el API de 
    "Places" será enviado al server y guardado en un archivo "json/mapa.json" junto con el centro del área, su radio y el
    zoom del mapa actual, para su posterior uso en una simulación
    
3.- Para establecer el número de conductores y usuarios en el ambiente, solo se debe modificar su cantidad en los spinner 
    correspondientes y luego dar click en el botón "Guardar datos". Un alert te indicará si tuviste éxito.
    
Iniciar una simulación (En desarrollo)

1.- Entrar a http://localhost:PUERTO/emulador.php desde un navegador web o dar click en el botón "Configurar Simulaciones" 
    del configurador.
    
2.- En base a los lugares encontrados por el configurador y guardados en el server, se establecerán en ellos aleatoriamente
    el número configurado de usuarios y conductores.
    
3.- Se encuentra en desarrollo la simulación aleatoria de movimiento tando de usuarios, como de conductores, pintar sus rutas
    y la distancia de cada conductor a su usuario mas cercano, mostrar una tabla con esos datos y poder detener la ejecución.

import * as functions from "firebase-functions";
import * as admin from 'firebase-admin';

import * as express from 'express';
import * as cors from 'cors';


/**NOTA 
 *1) Para poder hacer el firebase deploy correctamente fui al archivo firebase.json
 * y en predeploy elimine : //"npm --prefix \"$RESOURCE_DIR\" run lint"
 

 2) Para que el archico index.js coja los cambios del archivo index.ts
  es decir para q javascript coja automaticamente lo que hace en typescript nos vamos en consola:
  cd functions/ y una vez aqui ejecutamos npm run build* y despues tsc --watch
  
 3) Firebase serve para hechar a correr el servidor
  */

  //---------------------------------------------
//conexion con la base de datos de firebase
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();//aqui conectamos
//---------------------------------------------------------

//FUNCION QUE DEVUELVE TODOS LOS JUEGOS (asi viene por defecto las peticiones a FIREBASE)-------------------
export const getGames = functions.https.onRequest( async (request, response) => {
  
     const gamesRef = db.collection('games');//hacemos referencia a la collection

     const docsSnap = await gamesRef.get();//extraemos la informacion

      ///nota: docsSnap.docs[0].data() extrae el primer juego

     const gamesAll = docsSnap.docs.map( doc => doc.data())//extraemos todos los juegos

     response.json( gamesAll );
  
  });
 //---------------PETICIONES USANDO UN SERVIDOR EXPRESS---------------------------- 
  //Servidor Express
  const app = express();

  app.use( cors({ origin:true }));


  //PARA EXTRAER TODOS LOS JUEGOS--------------------------
  app.get('/games', async (req,resp) => {

    const gamesRef = db.collection('games');//hacemos referencia a la collection

     const docsSnap = await gamesRef.get();//extraemos la informacion

      ///nota: docsSnap.docs[0].data() extrae el primer juego

     const gamesAll = docsSnap.docs.map( doc => doc.data())//extraemos todos los juegos

     resp.json( gamesAll );
  });

  ///VOTAR POR UN JUEGO--------------------------------------

  app.post('/games/:id', async (req,resp) => {
      
    const id = req.params.id;//captamos el parametro id

    const gameRef = db.collection('games').doc( id );//hacemos referencia la collecion con ese id

    const gameSnap = await gameRef.get();//cojemos dicha referencia
     
    //si no existe el juego
    if (!gameSnap.exists ) {
      resp.status(404).json({
        ok:false,
        msg: `No existe juego con el id '${id}'`
      })
    }else{
      //si existe 
      const antes = gameSnap.data() || { votos:0 };//cojemos la data del juego y ponemos lo votos cero pa que no se queje
      //actualizamos los votos sumandole 1
      await gameRef.update({
        votos: antes.votos + 1
      });

      resp.json({
        ok:true,
        msg: `Gracias por tu voto a ${ antes.nombre }`
      })
    }
    
  });

  export const api = functions.https.onRequest( app );


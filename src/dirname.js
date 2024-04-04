import path from "path";

import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";
import passport from "passport";

import config from "./config/config.js";
import nodemailer from "nodemailer";

import ticketDao from "./Services/DAOS/mongoDB/ticket.dao.js";
//faker en español:
import { fakerES as faker } from "@faker-js/faker";

import winston from "winston";

import { v4 } from "uuid";
import userRepository from "./Services/Repository/user.repository.js";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

//separar en carpeta utils

//generamos la encriptación de contraseña, de manera sincrónica:
export const createHash = (hashPass) =>
  bcrypt.hashSync(hashPass, bcrypt.genSaltSync(10));

//validamos la encriptación:

export const validatePass = (user, hashPass) => {
  return bcrypt.compareSync(hashPass, user.password);
};

//JWT

export const PRIVATE_KEY = config.privateKey;

export const generateJWToken = (user) => {
   return jwt.sign({ user }, PRIVATE_KEY, { expiresIn: "600s" });

};

export const passportCall = (strategy) => {
  return async (req, res, next) => {
    logger.debug(`Entrando a llamar strategy ${strategy}`);

    passport.authenticate(strategy, function (err, user, info) {
      if (err) return next(err);

      if (!user) {
        logger.error("Me estoy quedando en !user de passportCall")
        return res
          .status(401)
          .send({ error: info.messages ? info.messages : info.toString() });
      }

      req.user = user;
    
      next(); 
    })(req, res, next);
  };
};

export const authToken = (req, res, next) => {
  //El JWT token se guarda en los headers de autorización.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .send({ error: "User not authenticated or missing token." });
  }
  const token = authHeader.split(" ")[1]; //Se hace el split para retirar la palabra Bearer.
  //Validar token
  jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
    if (error) return res.status(403).send({ error: "Token invalido." });
    //Token OK
    req.user = credentials.user;
    // console.log("usuario de auth"  + user)
    // res.send(user)
    next();
  });
};

//autorizamos quien puede ver las paginas segun el rol
export const authorization = (roles) => {
  return async (req, res, next) => {
    if (!req.user)
      return res.status(401).send("Unauthorized: User not found in JWT");
    // 1 ruta admite más de un tipo de auth
    if (roles.includes(req.user.role)) {
      return next();
    }
    return res
      .status(403)
      .send("Forbidden: El usuario no tiene permisos con este rol.");
  };
};

//NODEMAILER:
// configuracion de transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  auth: {
    user: config.emailAcount,
    pass: config.appPassword,
  },
});

// Verificamos conexion con gmail
transporter.verify(function (error, success) {
  if (error) {
    logger.error(`Error de verificación ${error}`);
  } else {
    logger.info("Server is ready to take our messages");
  }
});

export const sendEmail = async (id, email) => {
  try {
    const data = await ticketDao.findOneTicket(id);

    logger.info(data);

    let result = transporter.sendMail({
      from: "Coder Backend PreEntrega - " + config.emailAcount,
      to: email,
      subject: "Comprobante Ticket de compra",
      html: `<div><h1> Ticket generado: ${data} </h1></div>`,
      attachments: [],
    });
    logger.info(`Email: ${email}`);
  
    return result;
  } catch (error) {
    logger.error(error);
    return error;
  }
};

//Más adelante adjuntar el ticket además de mandarlo en el cuerpo:

// const mailOptionsWithAttachments = {
//     from: "Coder Test - " + config.gmailAccount,
//     to: `${config.gmailAccount};enzozanino2000@gmail.com; leo1987@yopmail.com`,
//     subject: "Correo de prueba CoderHouse Pkrogramacion BackEnmd clase30",
//     html: `<div>
//                 <h1>Esto es un Test de envio de correos con Nodemailer!</h1>
//                 <p>Ahora usando imagenes: </p>
//                 <img src="cid:meme"/>
//             </div>`,
//     attachments: [
//         {
//             filename: 'Meme de programacion',
//             path: __dirname + '/public/images/meme.png',
//             cid: 'meme'
//         }
//     ]
// }

// export const sendEmailWithAttachments = (req, res) => {
//     try {
//         let result = transporter.sendMail(mailOptionsWithAttachments, (error, info) => {
//             if (error) {
//                 console.log(error);
//                 res.status(400).send({ message: "Error", payload: error });
//             }
//             console.log('Message sent: %s', info.messageId);
//             res.send({ message: "Success", payload: info })
//         })
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: error, message: "No se pudo enviar el email desde:" + config.gmailAccount });
//     }
// }

/*=============================================
=                   Password Reset            =
=============================================*/

const mailOptionsToReset = {
  from: config.emailAcount,
  subject: "Reset password",
};

//esto guardarlo en bbdd
const tempDbMails = {};
//tengo que generar una vista con un campo para ingresar el email
export const resetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const userExists = await userRepository.findUser(email);

    if (!userExists) {
      return res.status(404).send("Email not found");
    }
    // Genero un id provisorio con la libreria uuid
    const token = v4();

    const link = `${config.restoreLink}${token}`;

    //le genero una propiedad token a tempDBMails
    tempDbMails[token] = {
      email,
      expirationTime: new Date(Date.now() + 1 * 15 * 1000),
    };

    req.logger.info(tempDbMails)

    mailOptionsToReset.to = email;
    mailOptionsToReset.html = `To reset your password, click on the following link: <a href="${link}"> Reset Password</a>`;

    transporter.sendMail(mailOptionsToReset, (error, info) => {
      if (error) {
        logger.error(error);
        res.status(500).send({ message: "Error", payload: error });
      }
      res.status(200).send({ message: "Success", payload: info });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({
        error: error,
        message: "No se pudo enviar el email desde:" + config.gmailAccount,
      });
  }
};

export const resetPassword = (req, res) => {
  const token = req.params.token;

  const email = tempDbMails[token];

  const now = new Date();
  const expirationTime = email?.expirationTime;

  if (now > expirationTime || !expirationTime) {
    delete tempDbMails[token];
    // delete `/api/users/restoreForm/${[token]}`
    req.logger.error("Time expired")
    return res.redirect("/resetPassword");
  }

  res.redirect(`/api/users/restoreForm/${[token]}`);
};

export const restorePassword = async (req, res) => {
  try {
    const { email, password, repeatPassword } = req.body;
    if(password !== repeatPassword){
      req.logger.error("Both passwords must be the same");
      return res.status(400).send("Both passwords must be the same")
    }
    const userExists = await userRepository.findUser(email);

    if (!userExists) {
      return res.status(404).send("Email not found");
    }
    if(validatePass(userExists, password)){
      req.logger.error("Can't use previous password")
      return res.status(400).send("Can't use previous password");
    }
    const result = await userRepository.updatePassword(email, password);

    return res.status(200).send("contraseña actualizada")
  } catch (error) {
    logger.error(error);
    return error;
  }
};

//Mocking:

export const generateProducts = () => {
  return {
    id: faker.database.mongodbObjectId(),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    price: faker.commerce.price({ min: 1000, max: 8000, dec: 0 }),
    code: faker.location.zipCode(),
    status: faker.datatype.boolean(),
    category: faker.commerce.department(),
    stock: faker.finance.amount({ min: 1, max: 100, dec: 0 }),
    thumbnails: faker.image.urlLoremFlickr({ width: 128, height: 128 }),
  };
};

//creo un objeto custom con las propiedades que quiera
const customLevelOptions = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5,
  },
  colors: {
    fatal: "red",
    error: "black",
    warning: "yellow",
    info: "blue",
    http: "white",
    debug: "green",
  },
};

winston.addColors(customLevelOptions.colors);

//Logger:
const logger = winston.createLogger({
  levels: customLevelOptions.levels,
  transports: [
    new winston.transports.Console({
      level: config.maxLevelConsole,

      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: "./errors.log",
      level: config.maxLevelFile,
    }),
  ],
});

//middleware de logger:
export const addLogger = (req, res, next) => {
  req.logger = logger;

  //lo que quiero registrar en los logs. En este caso ${método} en ${ruta} at ${fecha y hora}
  req.logger.http(
    `${req.method} en ${
      req.url
    } - at ${new Date().toLocaleDateString()}- ${new Date().toLocaleTimeString()}`
  );

  next();
};

export default __dirname;

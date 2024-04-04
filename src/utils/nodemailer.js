import config from "../config/config.js";
import nodemailer from "nodemailer";
import { v4 } from "uuid";

import userRepository from "../Services/Repository/user.repository.js";
import ticketDao from "../Services/DAOS/mongoDB/ticket.dao.js";

import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
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
    const { email, password } = req.body;
    const userExists = await userRepository.findUser(email);

    if (!userExists) {
      return res.status(404).send("Email not found");
    }

    const result = await userRepository.updatePassword(email, password);

    return res.status(200).send("contraseña actualizada")
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


export default __dirname;
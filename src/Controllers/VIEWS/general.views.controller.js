import MessagesDao from "../../Services/DAOS/mongoDB/messages.dao.js";


export const getChat = async (req, res) => {
  const message = req.body;
  const user = req.body;

  const messages = await MessagesDao.addMessage(message);

  res.render("chat", {
    messages,
  });
};

export const home = (req, res) => {
  res.render("home", {});
};

export const resetView = async (req, res) => {
  res.render("resetPassword", {})
}

export const testFrontEnd = async (req,res) =>{

//  req.logger.debug("llego a la funcion test")
 const usuario = req.user
//  console.log(usuario)
 res.send(usuario)
}

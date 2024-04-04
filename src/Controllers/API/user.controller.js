import userRepository from "../../Services/Repository/user.repository.js";

export const switchUser = async (req, res) => {
  const { uid } = req.params;
  req.logger.info(uid);
  const currentRole = req.user.role;
  if (currentRole === "user") {
    req.user.role = "premium";
  } else {
    req.user.role = "user";
  }

  const newRole = req.user.role;
  req.logger.info(newRole);

  await userRepository.updateUser(uid, newRole);
  res.status(200).send(newRole);
};


export const getUser = async(req, res) => {
   const { uid } = req.params;
   const user = await userRepository.getUser(uid)
   res.status(200).send(user)
}
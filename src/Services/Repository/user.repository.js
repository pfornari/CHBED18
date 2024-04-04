import userDao from "../DAOS/mongoDB/user.dao.js";

class UserRepository {
  constructor(dao) {
    this.dao = dao;
  }
  getUser = async (uid) => {
    return await userDao.getUser(uid)
  }
  updateUser = async (uid, role) => {
    return await userDao.updateUser(uid, role);
  };
  updatePassword = async (email, password) => {
    return await userDao.updatePassword(email, password);
  };
  findUser = async (email) => {
    return await userDao.findUser(email);
  };
}

export default new UserRepository();

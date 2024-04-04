import cartRepository from "../../Services/Repository/cart.repository.js";


export const registerUser = async (req, res) => {
  res.render("register", {
    fileCss: "register.css",
  });
};

export const getUsers = async (req, res) => {

  // const user = req.user

  res.render("profile", {
    id: req.user._id,
    role: req.user.role,
    user: req.user.name,
    age: req.user.age,
    email: req.user.email,
    cart: req.user.cart,
  });
};

export const getPremiumUsers = async (req, res) => {
  res.render("profilePremium", {
    id: req.user._id,
    role: req.user.role,
    user: req.user.name,
    age: req.user.age,
    email: req.user.email,
    cart: req.user.cart,
  });
};

export const restoreForm = async (req, res) => {
  res.render("newPasswordForm", {})
}

export const viewCart = async (req, res) => {
    try {
      const { cid } = req.params;

      const cart = await cartRepository.getById(cid);

      // let totalPrice = await cartRepository.getTotal(cart);

      let products = cart.products;
      req.logger.info(`Cart ID: ${cid}`);
      res.render("cartView", {
        cart: cid,
        message: `This is the cart with id ${cid}:`,
        products,
        // amount: totalPrice,
      });
    } catch (error) {
      req.logger.error(error.cause);
      return res
        .status(500)
        .send({ error: error.code, message: error.message });
    }
}

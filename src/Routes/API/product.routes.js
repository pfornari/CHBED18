import { Router } from "express";
import {
  getAdminProducts,
  getOneProduct,
  postProduct,
  changeProduct,
  deleteProduct,
} from "../../Controllers/API/products.controller.js";
import {
  getEditForm,
  getProductForm,
} from "../../Controllers/VIEWS/admin.views.controller.js";
// import { passportCall, authorization } from "../../utils/authorizations.js";
import { passportCall, authorization } from "../../dirname.js";

const router = Router();

router.get(
  "/",

  passportCall("jwt"),
  authorization("admin"),
  getAdminProducts
);

router.get("/getProduct/:id", getOneProduct);

router.get(
  "/addProduct",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  getProductForm
);

router.post(
  "/",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  postProduct
);

router.get(
  "/editProduct/:id",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  getEditForm
);

router.put(
  "/:id",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  changeProduct
);

router.delete(
  "/:id",
  passportCall("jwt"),
  authorization(["admin", "premium"]),
  deleteProduct
);

export default router;

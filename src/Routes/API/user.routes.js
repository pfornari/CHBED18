import { Router } from "express";
import { switchUser} from "../../Controllers/API/user.controller.js";
// import { passportCall, authorization } from "../../utils/authorizations.js";
import { passportCall, authorization, authToken } from "../../dirname.js";
import {
  resetPasswordEmail,
  resetPassword,
  restorePassword,
} from "../../dirname.js";
// import { resetPasswordEmail, resetPassword, restorePassword } from "../../utils/nodemailer.js";
import { getUser } from "../../Controllers/API/user.controller.js"
import { restoreForm } from "../../Controllers/VIEWS/user.views.controller.js";

const router = Router();

router.get("/:id", getUser)

//ruta para cambiar de rol de user a premium
router.get(
  "/premium/:uid",
  passportCall("jwt"),
  authorization(["premium", "user"]),
  switchUser
);

router.post("/sendEmailToReset", resetPasswordEmail);

router.get("/resetPassword/:token", resetPassword);

router.get(`/restoreForm/:token`, restoreForm);

router.post(`/restoreForm`, restorePassword);


export default router;

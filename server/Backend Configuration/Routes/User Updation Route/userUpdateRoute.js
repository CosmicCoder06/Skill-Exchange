
const express= require("express")
const router= express.Router()
const updateUser= require("../../Controllers/User Updation Controller/userController") 
const verifyToken= require("../../Configuration Folders/Middleware Configuration/authMiddleware")



router.put("/user/update/:id", verifyToken, updateUser)

module.exports= router;
// @teamcosmiccoders

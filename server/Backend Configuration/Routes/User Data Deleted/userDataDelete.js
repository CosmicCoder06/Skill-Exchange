
const express= require("express")
const router= express.Router()
const {deletedUser}= require("../../Controllers/User Deletion Controller/userDeletion") 
const verifyToken=require("../../Configuration Folders/Middleware Configuration/authMiddleware")



router.delete("/user/delete/:id", verifyToken, deletedUser)

module.exports= router;
// @teamcosmiccoders

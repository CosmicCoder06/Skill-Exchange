
const express= require("express")
const router= express.Router()
const updateUser= require("../../Controllers/User Updation Controller/userController") 



router.put("/user/update/:id", updateUser)

module.exports= router;